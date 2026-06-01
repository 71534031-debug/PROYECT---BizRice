from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract, cast, String
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime, timezone
from typing import Optional
from passlib.context import CryptContext
import re

from src.config.db import get_db
from src.models.user import Usuario
from src.models.business import Emprendimiento
from src.models.category import Categoria
from src.models.review import Comentario
from src.models.rating import Valoracion
from src.models.promotion import Promocion
from src.controllers.auth_controller import require_role

router = APIRouter()

# ─── Schemas ───────────────────────────────────────────────────────────────

class SolicitudReciente(BaseModel):
    id_emprendimiento: int
    nombre: str
    categoria: str
    propietario: str
    fecha_registro: datetime

class CrecimientoMensual(BaseModel):
    mes: str
    negocios: int

class StatsResponse(BaseModel):
    total_negocios: int
    pendientes: int
    nuevos_usuarios_mes: int
    crecimiento_porcentaje: int
    solicitudes_recientes: list[SolicitudReciente]
    crecimiento_mensual: list[CrecimientoMensual]

class PropietarioInfo(BaseModel):
    nombre: str
    apellido: str
    correo: str

class BusinessAdminItem(BaseModel):
    id_emprendimiento: int
    nombre: str
    categoria: str
    propietario: PropietarioInfo
    distrito: Optional[str] = None
    fecha_registro: datetime
    estado_verificacion: str

class BusinessListResponse(BaseModel):
    items: list[BusinessAdminItem]
    total: int
    page: int
    size: int
    pages: int

class RejectSchema(BaseModel):
    motivo: str

class MessageResponse(BaseModel):
    message: str

class UserAdminItem(BaseModel):
    id_usuario: int
    nombre: str
    apellido: str
    correo: str
    rol: str
    estado: str
    fecha_registro: datetime
    avatar_url: Optional[str] = None
    tiene_negocio: bool
    nombre_negocio: Optional[str] = None

class UserListResponse(BaseModel):
    items: list[UserAdminItem]
    total: int
    page: int
    size: int
    pages: int

class CreateUserSchema(BaseModel):
    nombre: str
    apellido: str
    correo: EmailStr
    contrasena: str
    rol: str = "emprendedor"

    @field_validator('contrasena')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Mínimo 8 caracteres')
        if not re.search(r'\d', v):
            raise ValueError('Debe contener al menos un número')
        return v

    @field_validator('rol')
    def validate_rol(cls, v):
        if v not in ("visitante", "emprendedor", "administrador", "cliente"):
            raise ValueError('Rol no válido')
        return v

# ─── Helpers ───────────────────────────────────────────────────────────────

MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
         "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

# ─── Endpoints — Stats ────────────────────────────────────────────────────

@router.get("/stats", response_model=StatsResponse)
def obtener_estadisticas(
    current_user: Usuario = Depends(require_role("administrador")),
    db: Session = Depends(get_db)
):
    total_negocios = db.query(func.count(Emprendimiento.id_emprendimiento)).filter(
        Emprendimiento.estado_verificacion == "aprobado"
    ).scalar() or 0

    pendientes = db.query(func.count(Emprendimiento.id_emprendimiento)).filter(
        Emprendimiento.estado_verificacion == "pendiente"
    ).scalar() or 0

    inicio_mes = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    nuevos_usuarios_mes = db.query(func.count(Usuario.id_usuario)).filter(
        Usuario.fecha_registro >= inicio_mes
    ).scalar() or 0

    mes_anterior = inicio_mes.replace(month=inicio_mes.month - 1) if inicio_mes.month > 1 else \
                   inicio_mes.replace(year=inicio_mes.year - 1, month=12)
    usuarios_mes_anterior = db.query(func.count(Usuario.id_usuario)).filter(
        Usuario.fecha_registro >= mes_anterior,
        Usuario.fecha_registro < inicio_mes
    ).scalar() or 0

    crecimiento_porcentaje = 0
    if usuarios_mes_anterior > 0:
        crecimiento_porcentaje = round(
            ((nuevos_usuarios_mes - usuarios_mes_anterior) / usuarios_mes_anterior) * 100
        )

    solicitudes = db.query(Emprendimiento).options(
        joinedload(Emprendimiento.categoria),
        joinedload(Emprendimiento.propietario)
    ).filter(
        Emprendimiento.estado_verificacion == "pendiente"
    ).order_by(Emprendimiento.fecha_registro.desc()).limit(5).all()

    solicitudes_recientes = [
        SolicitudReciente(
            id_emprendimiento=s.id_emprendimiento,
            nombre=s.nombre,
            categoria=s.categoria.nombre if s.categoria else "",
            propietario=f"{s.propietario.nombre} {s.propietario.apellido}" if s.propietario else "",
            fecha_registro=s.fecha_registro
        )
        for s in solicitudes
    ]

    ahora = datetime.now(timezone.utc)
    crecimiento_mensual = []
    for i in range(5, -1, -1):
        mes_num = ahora.month - i
        año = ahora.year
        if mes_num <= 0:
            mes_num += 12
            año -= 1
        count = db.query(func.count(Emprendimiento.id_emprendimiento)).filter(
            extract("year", Emprendimiento.fecha_registro) == año,
            extract("month", Emprendimiento.fecha_registro) == mes_num,
            Emprendimiento.estado_verificacion == "aprobado"
        ).scalar() or 0
        crecimiento_mensual.append(CrecimientoMensual(
            mes=MESES[mes_num - 1],
            negocios=count
        ))

    return StatsResponse(
        total_negocios=total_negocios,
        pendientes=pendientes,
        nuevos_usuarios_mes=nuevos_usuarios_mes,
        crecimiento_porcentaje=crecimiento_porcentaje,
        solicitudes_recientes=solicitudes_recientes,
        crecimiento_mensual=crecimiento_mensual
    )


# ─── Endpoints — Businesses ────────────────────────────────────────────────

@router.get("/businesses", response_model=BusinessListResponse)
def listar_emprendimientos(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    estado: Optional[str] = None,
    categoria: Optional[int] = None,
    busqueda: Optional[str] = None,
    current_user: Usuario = Depends(require_role("administrador")),
    db: Session = Depends(get_db)
):
    query = db.query(Emprendimiento).options(
        joinedload(Emprendimiento.categoria),
        joinedload(Emprendimiento.propietario)
    )

    if estado:
        query = query.filter(Emprendimiento.estado_verificacion == estado)
    if categoria is not None:
        query = query.filter(Emprendimiento.id_categoria == categoria)
    if busqueda:
        patron = f"%{busqueda}%"
        query = query.filter(
            Emprendimiento.nombre.ilike(patron) |
            cast(Emprendimiento.descripcion, String).ilike(patron)
        )

    total = query.count()
    items = query.order_by(Emprendimiento.fecha_registro.desc())\
                 .offset((page - 1) * size).limit(size).all()

    return BusinessListResponse(
        items=[
            BusinessAdminItem(
                id_emprendimiento=e.id_emprendimiento,
                nombre=e.nombre,
                categoria=e.categoria.nombre if e.categoria else "",
                propietario=PropietarioInfo(
                    nombre=e.propietario.nombre if e.propietario else "",
                    apellido=e.propietario.apellido if e.propietario else "",
                    correo=e.propietario.correo if e.propietario else ""
                ),
                distrito=e.distrito,
                fecha_registro=e.fecha_registro,
                estado_verificacion=e.estado_verificacion
            )
            for e in items
        ],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size if total > 0 else 0
    )


@router.put("/businesses/{id_emprendimiento}/approve", response_model=MessageResponse)
def aprobar_emprendimiento(
    id_emprendimiento: int,
    current_user: Usuario = Depends(require_role("administrador")),
    db: Session = Depends(get_db)
):
    emp = db.query(Emprendimiento).filter(
        Emprendimiento.id_emprendimiento == id_emprendimiento
    ).first()
    if not emp:
        raise HTTPException(404, "Emprendimiento no encontrado")

    emp.estado_verificacion = "aprobado"
    db.commit()

    return MessageResponse(message="Emprendimiento aprobado exitosamente")


@router.put("/businesses/{id_emprendimiento}/reject", response_model=MessageResponse)
def rechazar_emprendimiento(
    id_emprendimiento: int,
    data: RejectSchema,
    current_user: Usuario = Depends(require_role("administrador")),
    db: Session = Depends(get_db)
):
    if not data.motivo or len(data.motivo.strip()) < 20:
        raise HTTPException(400, "El motivo del rechazo debe tener al menos 20 caracteres")

    emp = db.query(Emprendimiento).filter(
        Emprendimiento.id_emprendimiento == id_emprendimiento
    ).first()
    if not emp:
        raise HTTPException(404, "Emprendimiento no encontrado")

    emp.estado_verificacion = "rechazado"
    db.commit()

    return MessageResponse(message="Emprendimiento rechazado")


# ─── Endpoints — Users ────────────────────────────────────────────────────

@router.get("/users", response_model=UserListResponse)
def listar_usuarios(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    rol: Optional[str] = None,
    estado: Optional[str] = None,
    busqueda: Optional[str] = None,
    current_user: Usuario = Depends(require_role("administrador")),
    db: Session = Depends(get_db)
):
    query = db.query(Usuario)

    if rol:
        query = query.filter(Usuario.rol == rol)
    if estado:
        query = query.filter(Usuario.estado == estado)
    if busqueda:
        patron = f"%{busqueda}%"
        query = query.filter(
            Usuario.nombre.ilike(patron) |
            Usuario.apellido.ilike(patron) |
            Usuario.correo.ilike(patron)
        )

    total = query.count()
    items = query.order_by(Usuario.fecha_registro.desc())\
                 .offset((page - 1) * size).limit(size).all()

    resultado = []
    for u in items:
        negocio = db.query(Emprendimiento).filter(
            Emprendimiento.id_usuario == u.id_usuario
        ).first()
        resultado.append(UserAdminItem(
            id_usuario=u.id_usuario,
            nombre=u.nombre,
            apellido=u.apellido,
            correo=u.correo,
            rol=u.rol,
            estado=u.estado,
            fecha_registro=u.fecha_registro,
            avatar_url=u.avatar_url,
            tiene_negocio=negocio is not None,
            nombre_negocio=negocio.nombre if negocio else None
        ))

    return UserListResponse(
        items=resultado,
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size if total > 0 else 0
    )


@router.put("/users/{id_usuario}/suspend", response_model=MessageResponse)
def suspender_usuario(
    id_usuario: int,
    current_user: Usuario = Depends(require_role("administrador")),
    db: Session = Depends(get_db)
):
    if current_user.id_usuario == id_usuario:
        raise HTTPException(400, "No puedes suspenderte a ti mismo")

    user = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    if user.estado == "suspendido":
        raise HTTPException(400, "El usuario ya está suspendido")

    user.estado = "suspendido"
    db.commit()

    return MessageResponse(message="Usuario suspendido correctamente")


@router.put("/users/{id_usuario}/activate", response_model=MessageResponse)
def activar_usuario(
    id_usuario: int,
    current_user: Usuario = Depends(require_role("administrador")),
    db: Session = Depends(get_db)
):
    user = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    if user.estado == "activo":
        raise HTTPException(400, "El usuario ya está activo")

    user.estado = "activo"
    db.commit()

    return MessageResponse(message="Usuario activado correctamente")


@router.delete("/reviews/{id_comentario}", response_model=MessageResponse)
def eliminar_resena(
    id_comentario: int,
    current_user: Usuario = Depends(require_role("administrador")),
    db: Session = Depends(get_db)
):
    comentario = db.query(Comentario).filter(
        Comentario.id_comentario == id_comentario
    ).first()
    if not comentario:
        raise HTTPException(404, "Reseña no encontrada")

    db.delete(comentario)
    db.commit()

    return MessageResponse(message="Reseña eliminada por el administrador")


@router.post("/users", status_code=201, response_model=MessageResponse)
def crear_usuario(
    data: CreateUserSchema,
    current_user: Usuario = Depends(require_role("administrador")),
    db: Session = Depends(get_db)
):
    existe = db.query(Usuario).filter(Usuario.correo == data.correo).first()
    if existe:
        raise HTTPException(400, "Este correo ya tiene una cuenta registrada")

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    user = Usuario(
        nombre=data.nombre.strip(),
        apellido=data.apellido.strip(),
        correo=data.correo,
        contrasena_hash=pwd_context.hash(data.contrasena),
        rol=data.rol
    )
    db.add(user)
    db.commit()

    return MessageResponse(message=f"Usuario {data.rol} creado exitosamente")

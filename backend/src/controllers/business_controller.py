from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case, cast, String
from pydantic import BaseModel
from datetime import datetime, time, date, timezone
from typing import Optional
from src.models.promotion import Promocion

from src.config.db import get_db
from src.models.business import Emprendimiento
from src.models.category import Categoria
from src.models.product import Producto
from src.models.review import Comentario
from src.models.rating import Valoracion
from src.models.promotion import Promocion
from src.models.social_network import RedSocial
from src.models.user import Usuario
from src.controllers.auth_controller import get_current_user

router = APIRouter()

# ─── Schemas ───────────────────────────────────────────────────────────────

class CategoriaInfo(BaseModel):
    id_categoria: int
    nombre: str

class PropietarioInfo(BaseModel):
    nombre: str
    apellido: str

class RedSocialResponse(BaseModel):
    plataforma: str
    url: str

class PromocionResponse(BaseModel):
    id_promocion: int
    titulo: str
    descripcion: Optional[str] = None
    fecha_fin: Optional[date] = None
    estado: str

class BusinessListItem(BaseModel):
    id_emprendimiento: int
    nombre: str
    descripcion: Optional[str] = None
    categoria: str
    id_categoria: int
    distrito: Optional[str] = None
    imagen_portada_url: Optional[str] = None
    estado_verificacion: str
    puntuacion_promedio: float = 0.0
    total_valoraciones: int = 0
    horario_apertura: Optional[str] = None
    horario_cierre: Optional[str] = None
    esta_abierto: bool = False

class BusinessListResponse(BaseModel):
    items: list[BusinessListItem]
    total: int
    page: int
    size: int
    pages: int

class BusinessDetailResponse(BaseModel):
    id_emprendimiento: int
    nombre: str
    descripcion: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    distrito: Optional[str] = None
    horario_apertura: Optional[str] = None
    horario_cierre: Optional[str] = None
    esta_abierto: bool = False
    imagen_portada_url: Optional[str] = None
    estado_verificacion: str
    fecha_registro: Optional[datetime] = None
    categoria: Optional[CategoriaInfo] = None
    propietario: Optional[PropietarioInfo] = None
    puntuacion_promedio: float = 0.0
    total_valoraciones: int = 0
    redes_sociales: list[RedSocialResponse] = []
    promociones_activas: list[PromocionResponse] = []

class ProductoResponse(BaseModel):
    id_producto: int
    nombre: str
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    imagen_url: Optional[str] = None
    stock: int = 0
    estado_stock: str

class ProductListResponse(BaseModel):
    items: list[ProductoResponse]
    total: int
    page: int
    size: int
    pages: int

class UsuarioResena(BaseModel):
    nombre: str
    apellido: str
    avatar_url: Optional[str] = None

class ResenaItem(BaseModel):
    id_comentario: int
    usuario: UsuarioResena
    contenido: str
    puntuacion: int
    util_count: int
    fecha: datetime

class ReviewListResponse(BaseModel):
    items: list[ResenaItem]
    total: int
    page: int
    size: int
    pages: int
    puntuacion_promedio: float = 0.0
    distribucion_estrellas: dict[str, int]

class CreateReviewSchema(BaseModel):
    contenido: str
    puntuacion: int

class CreateReviewResponse(BaseModel):
    message: str

# ─── Helpers ───────────────────────────────────────────────────────────────

def _get_time_str(t: time | None) -> str | None:
    if t is None:
        return None
    return t.strftime("%H:%M:%S")

def _esta_abierto(apertura: time | None, cierre: time | None) -> bool:
    if apertura is None or cierre is None:
        return False
    ahora = datetime.now(timezone.utc).time()
    return apertura <= ahora <= cierre

def _calcular_puntuacion(db: Session, id_emprendimiento: int) -> tuple[float, int]:
    result = db.query(
        func.coalesce(func.avg(Valoracion.puntuacion), 0),
        func.count(Valoracion.id_valoracion)
    ).filter(
        Valoracion.id_emprendimiento == id_emprendimiento
    ).first()
    promedio = round(float(result[0] or 0), 1)
    total = result[1] or 0
    return promedio, total

def _distribucion_estrellas(db: Session, id_emprendimiento: int) -> dict[str, int]:
    rows = db.query(
        Valoracion.puntuacion,
        func.count(Valoracion.id_valoracion)
    ).filter(
        Valoracion.id_emprendimiento == id_emprendimiento
    ).group_by(Valoracion.puntuacion).all()

    dist = {str(i): 0 for i in range(1, 6)}
    for puntuacion, count in rows:
        dist[str(puntuacion)] = count
    return dist

def _get_user_from_header(authorization: str, db: Session) -> Usuario:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token requerido")
    return get_current_user(authorization.split(" ")[1], db)

# ─── Endpoints ─────────────────────────────────────────────────────────────

@router.get("", response_model=BusinessListResponse)
def listar_emprendimientos(
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1, le=50),
    busqueda: Optional[str] = None,
    categoria: Optional[int] = None,
    distrito: Optional[str] = None,
    orden: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Emprendimiento).options(
        joinedload(Emprendimiento.categoria)
    ).filter(Emprendimiento.estado_verificacion == "aprobado")

    if busqueda:
        patron = f"%{busqueda}%"
        query = query.filter(
            Emprendimiento.nombre.ilike(patron) |
            cast(Emprendimiento.descripcion, String).ilike(patron)
        )
    if categoria is not None:
        query = query.filter(Emprendimiento.id_categoria == categoria)
    if distrito:
        query = query.filter(Emprendimiento.distrito.ilike(distrito))

    total = query.count()

    if orden == "valoracion":
        subq = db.query(
            Valoracion.id_emprendimiento,
            func.avg(Valoracion.puntuacion).label("promedio")
        ).group_by(Valoracion.id_emprendimiento).subquery()
        query = query.outerjoin(subq, subq.c.id_emprendimiento == Emprendimiento.id_emprendimiento)
        query = query.order_by(func.coalesce(subq.c.promedio, 0).desc())
    elif orden == "nombre":
        query = query.order_by(Emprendimiento.nombre.asc())
    else:
        query = query.order_by(Emprendimiento.fecha_registro.desc())

    items = query.offset((page - 1) * size).limit(size).all()

    resultados = []
    for emp in items:
        promedio, num_val = _calcular_puntuacion(db, emp.id_emprendimiento)
        resultados.append(BusinessListItem(
            id_emprendimiento=emp.id_emprendimiento,
            nombre=emp.nombre,
            descripcion=emp.descripcion,
            categoria=emp.categoria.nombre if emp.categoria else "",
            id_categoria=emp.id_categoria,
            distrito=emp.distrito,
            imagen_portada_url=emp.imagen_portada_url,
            estado_verificacion=emp.estado_verificacion,
            puntuacion_promedio=promedio,
            total_valoraciones=num_val,
            horario_apertura=_get_time_str(emp.horario_apertura),
            horario_cierre=_get_time_str(emp.horario_cierre),
            esta_abierto=_esta_abierto(emp.horario_apertura, emp.horario_cierre)
        ))

    return BusinessListResponse(
        items=resultados,
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size if total > 0 else 0
    )


@router.get("/{id_emprendimiento}", response_model=BusinessDetailResponse)
def obtener_emprendimiento(id_emprendimiento: int, db: Session = Depends(get_db)):
    emp = db.query(Emprendimiento).options(
        joinedload(Emprendimiento.categoria),
        joinedload(Emprendimiento.propietario),
        joinedload(Emprendimiento.redes_sociales),
        joinedload(Emprendimiento.promociones)
    ).filter(
        Emprendimiento.id_emprendimiento == id_emprendimiento,
        Emprendimiento.estado_verificacion == "aprobado"
    ).first()

    if not emp:
        raise HTTPException(404, "Emprendimiento no encontrado")

    promedio, num_val = _calcular_puntuacion(db, id_emprendimiento)

    hoy = date.today()
    promociones_activas = []
    for p in emp.promociones:
        if p.estado == "activa" and p.fecha_fin and p.fecha_fin < hoy:
            p.estado = "vencida"
            db.commit()
        if p.estado == "activa":
            promociones_activas.append(PromocionResponse(
                id_promocion=p.id_promocion,
                titulo=p.titulo,
                descripcion=p.descripcion,
                fecha_fin=p.fecha_fin,
                estado=p.estado
            ))

    return BusinessDetailResponse(
        id_emprendimiento=emp.id_emprendimiento,
        nombre=emp.nombre,
        descripcion=emp.descripcion,
        telefono=emp.telefono,
        direccion=emp.direccion,
        distrito=emp.distrito,
        horario_apertura=_get_time_str(emp.horario_apertura),
        horario_cierre=_get_time_str(emp.horario_cierre),
        esta_abierto=_esta_abierto(emp.horario_apertura, emp.horario_cierre),
        imagen_portada_url=emp.imagen_portada_url,
        estado_verificacion=emp.estado_verificacion,
        fecha_registro=emp.fecha_registro,
        categoria=CategoriaInfo(
            id_categoria=emp.categoria.id_categoria,
            nombre=emp.categoria.nombre
        ) if emp.categoria else None,
        propietario=PropietarioInfo(
            nombre=emp.propietario.nombre,
            apellido=emp.propietario.apellido
        ) if emp.propietario else None,
        puntuacion_promedio=promedio,
        total_valoraciones=num_val,
        redes_sociales=[
            RedSocialResponse(plataforma=r.plataforma, url=r.url)
            for r in emp.redes_sociales
        ],
        promociones_activas=promociones_activas
    )


@router.get("/{id_emprendimiento}/products", response_model=ProductListResponse)
def listar_productos(
    id_emprendimiento: int,
    page: int = Query(1, ge=1),
    size: int = Query(9, ge=1, le=50),
    db: Session = Depends(get_db)
):
    emp = db.query(Emprendimiento).filter(
        Emprendimiento.id_emprendimiento == id_emprendimiento,
        Emprendimiento.estado_verificacion == "aprobado"
    ).first()
    if not emp:
        raise HTTPException(404, "Emprendimiento no encontrado")

    query = db.query(Producto).filter(
        Producto.id_emprendimiento == id_emprendimiento,
        Producto.activo == True
    )

    total = query.count()
    items = query.order_by(Producto.fecha_creacion.desc())\
                 .offset((page - 1) * size).limit(size).all()

    return ProductListResponse(
        items=[
            ProductoResponse(
                id_producto=p.id_producto,
                nombre=p.nombre,
                descripcion=p.descripcion,
                precio=float(p.precio) if p.precio else None,
                imagen_url=p.imagen_url,
                stock=p.stock or 0,
                estado_stock=p.estado_stock
            )
            for p in items
        ],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size if total > 0 else 0
    )


@router.get("/{id_emprendimiento}/reviews", response_model=ReviewListResponse)
def listar_resenas(
    id_emprendimiento: int,
    page: int = Query(1, ge=1),
    size: int = Query(5, ge=1, le=50),
    db: Session = Depends(get_db)
):
    emp = db.query(Emprendimiento).filter(
        Emprendimiento.id_emprendimiento == id_emprendimiento,
        Emprendimiento.estado_verificacion == "aprobado"
    ).first()
    if not emp:
        raise HTTPException(404, "Emprendimiento no encontrado")

    query = db.query(Comentario).options(
        joinedload(Comentario.usuario)
    ).filter(
        Comentario.id_emprendimiento == id_emprendimiento
    )

    total = query.count()
    items = query.order_by(Comentario.fecha.desc())\
                 .offset((page - 1) * size).limit(size).all()

    promedio, _ = _calcular_puntuacion(db, id_emprendimiento)
    dist = _distribucion_estrellas(db, id_emprendimiento)

    resenas = []
    for c in items:
        valoracion = db.query(Valoracion.puntuacion).filter(
            Valoracion.id_usuario == c.id_usuario,
            Valoracion.id_emprendimiento == id_emprendimiento
        ).first()
        puntuacion = valoracion[0] if valoracion else 0

        resenas.append(ResenaItem(
            id_comentario=c.id_comentario,
            usuario=UsuarioResena(
                nombre=c.usuario.nombre,
                apellido=c.usuario.apellido,
                avatar_url=c.usuario.avatar_url
            ) if c.usuario else UsuarioResena(nombre="", apellido=""),
            contenido=c.contenido,
            puntuacion=puntuacion,
            util_count=c.util_count,
            fecha=c.fecha
        ))

    return ReviewListResponse(
        items=resenas,
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size if total > 0 else 0,
        puntuacion_promedio=promedio,
        distribucion_estrellas=dist
    )


@router.post("/{id_emprendimiento}/reviews", status_code=201, response_model=CreateReviewResponse)
def crear_resena(
    id_emprendimiento: int,
    data: CreateReviewSchema,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user = _get_user_from_header(authorization, db)

    emp = db.query(Emprendimiento).filter(
        Emprendimiento.id_emprendimiento == id_emprendimiento,
        Emprendimiento.estado_verificacion == "aprobado"
    ).first()
    if not emp:
        raise HTTPException(404, "Emprendimiento no encontrado")

    if not (1 <= data.puntuacion <= 5):
        raise HTTPException(400, "La puntuación debe estar entre 1 y 5")

    if len(data.contenido.strip()) < 10:
        raise HTTPException(400, "El comentario debe tener al menos 10 caracteres")

    existe = db.query(Valoracion).filter(
        Valoracion.id_usuario == user.id_usuario,
        Valoracion.id_emprendimiento == id_emprendimiento
    ).first()
    if existe:
        raise HTTPException(400, "Ya dejaste una reseña en este emprendimiento")

    comentario = Comentario(
        id_usuario=user.id_usuario,
        id_emprendimiento=id_emprendimiento,
        contenido=data.contenido.strip()
    )
    db.add(comentario)

    valoracion = Valoracion(
        id_usuario=user.id_usuario,
        id_emprendimiento=id_emprendimiento,
        puntuacion=data.puntuacion
    )
    db.add(valoracion)

    db.commit()

    return CreateReviewResponse(message="Reseña publicada exitosamente")

from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from pydantic import BaseModel, field_validator
from datetime import datetime, time, date, timezone
from typing import Optional
from passlib.context import CryptContext
import re
import os
import uuid

from src.config.db import get_db
from src.config.settings import settings
from src.models.business import Emprendimiento
from src.models.category import Categoria
from src.models.product import Producto
from src.models.promotion import Promocion
from src.models.review import Comentario
from src.models.rating import Valoracion
from src.models.user import Usuario
from src.controllers.auth_controller import require_role, pwd_context

router = APIRouter()

# ─── Schemas ───────────────────────────────────────────────────────────────

class CategoryInfo(BaseModel):
    id_categoria: int
    nombre: str

class RedSocialInfo(BaseModel):
    plataforma: str
    url: str

class BusinessResponse(BaseModel):
    id_emprendimiento: int
    nombre: str
    descripcion: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    distrito: Optional[str] = None
    horario_apertura: Optional[str] = None
    horario_cierre: Optional[str] = None
    imagen_portada_url: Optional[str] = None
    estado_verificacion: str
    fecha_registro: Optional[datetime] = None
    categoria: Optional[CategoryInfo] = None
    puntuacion_promedio: float = 0.0
    total_valoraciones: int = 0
    redes_sociales: list[RedSocialInfo] = []

class BusinessCreate(BaseModel):
    nombre: str
    id_categoria: int
    descripcion: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    distrito: Optional[str] = None

class BusinessUpdate(BaseModel):
    nombre: Optional[str] = None
    id_categoria: Optional[int] = None
    descripcion: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    distrito: Optional[str] = None

class ScheduleItem(BaseModel):
    dia: str
    abierto: bool
    apertura: Optional[str] = None
    cierre: Optional[str] = None

class ScheduleUpdate(BaseModel):
    horarios: list[ScheduleItem]

class ProductResponse(BaseModel):
    id_producto: int
    nombre: str
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    imagen_url: Optional[str] = None
    estado_stock: str
    activo: bool
    fecha_creacion: Optional[datetime] = None

class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    size: int
    pages: int

class PromotionResponse(BaseModel):
    id_promocion: int
    titulo: str
    descripcion: Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    estado: str

class PromotionCreate(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    estado: str = "activa"

class PromotionUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    estado: Optional[str] = None

class ActividadReciente(BaseModel):
    tipo: str
    mensaje: str
    fecha: datetime

class StatsResponse(BaseModel):
    visitas_totales: int = 0
    visitas_incremento: int = 0
    clics_perfil: int = 0
    clics_incremento: int = 0
    productos_activos: int = 0
    estado_negocio: Optional[str] = None
    actividad_reciente: list[ActividadReciente] = []

class PasswordChange(BaseModel):
    contrasena_actual: str
    nueva_contrasena: str
    confirmar_contrasena: str

    @field_validator('nueva_contrasena')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Mínimo 8 caracteres')
        if not re.search(r'\d', v):
            raise ValueError('Debe contener al menos un número')
        return v

class NotificationPreferences(BaseModel):
    email_notificaciones: bool
    whatsapp_notificaciones: bool

class MessageResponse(BaseModel):
    message: str

# ─── Helpers ───────────────────────────────────────────────────────────────

async def _guardar_imagen(upload: UploadFile, subdir: str) -> str:
    if upload.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(400, "Formato no válido. Usa JPG, PNG o WebP")

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    contents = await upload.read()
    if len(contents) > max_bytes:
        raise HTTPException(400, f"La imagen excede el máximo de {settings.MAX_FILE_SIZE_MB}MB")

    ext = os.path.splitext(upload.filename or "imagen.jpg")[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        ext = ".jpg"

    filename = f"{uuid.uuid4().hex}{ext}"
    upload_dir = os.path.join(settings.UPLOAD_DIR, subdir)
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    return f"/uploads/{subdir}/{filename}"

def _get_empresa_usuario(db: Session, user: Usuario):
    emp = db.query(Emprendimiento).options(
        joinedload(Emprendimiento.categoria),
        joinedload(Emprendimiento.redes_sociales)
    ).filter(Emprendimiento.id_usuario == user.id_usuario).first()
    return emp

# ─── Endpoints — Negocio ──────────────────────────────────────────────────

@router.get("/business", response_model=BusinessResponse)
def obtener_mi_negocio(
    current_user: Usuario = Depends(require_role("emprendedor")),
    db: Session = Depends(get_db)
):
    emp = _get_empresa_usuario(db, current_user)
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    promedio = db.query(func.coalesce(func.avg(Valoracion.puntuacion), 0)).filter(
        Valoracion.id_emprendimiento == emp.id_emprendimiento
    ).scalar()
    total_val = db.query(func.count(Valoracion.id_valoracion)).filter(
        Valoracion.id_emprendimiento == emp.id_emprendimiento
    ).scalar()

    return BusinessResponse(
        id_emprendimiento=emp.id_emprendimiento,
        nombre=emp.nombre,
        descripcion=emp.descripcion,
        telefono=emp.telefono,
        direccion=emp.direccion,
        distrito=emp.distrito,
        horario_apertura=emp.horario_apertura.strftime("%H:%M:%S") if emp.horario_apertura else None,
        horario_cierre=emp.horario_cierre.strftime("%H:%M:%S") if emp.horario_cierre else None,
        imagen_portada_url=emp.imagen_portada_url,
        estado_verificacion=emp.estado_verificacion,
        fecha_registro=emp.fecha_registro,
        categoria=CategoryInfo(id_categoria=emp.categoria.id_categoria, nombre=emp.categoria.nombre) if emp.categoria else None,
        puntuacion_promedio=round(float(promedio or 0), 1),
        total_valoraciones=total_val or 0,
        redes_sociales=[RedSocialInfo(plataforma=r.plataforma, url=r.url) for r in emp.redes_sociales]
    )


@router.post("/business", status_code=201, response_model=BusinessResponse)
def registrar_mi_negocio(
    data: BusinessCreate,
    current_user: Usuario = Depends(require_role("emprendedor")),
    db: Session = Depends(get_db)
):
    existe = _get_empresa_usuario(db, current_user)
    if existe:
        raise HTTPException(400, "Ya tienes un negocio registrado")

    cat = db.query(Categoria).filter(Categoria.id_categoria == data.id_categoria).first()
    if not cat:
        raise HTTPException(404, "Categoría no encontrada")

    emp = Emprendimiento(
        id_usuario=current_user.id_usuario,
        id_categoria=data.id_categoria,
        nombre=data.nombre.strip(),
        descripcion=data.descripcion.strip() if data.descripcion else None,
        telefono=data.telefono,
        direccion=data.direccion,
        distrito=data.distrito
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)

    return BusinessResponse(
        id_emprendimiento=emp.id_emprendimiento,
        nombre=emp.nombre,
        descripcion=emp.descripcion,
        telefono=emp.telefono,
        direccion=emp.direccion,
        distrito=emp.distrito,
        estado_verificacion=emp.estado_verificacion,
        fecha_registro=emp.fecha_registro,
        categoria=CategoryInfo(id_categoria=cat.id_categoria, nombre=cat.nombre),
        puntuacion_promedio=0.0,
        total_valoraciones=0,
        redes_sociales=[]
    )


@router.put("/business", response_model=MessageResponse)
def actualizar_mi_negocio(
    data: BusinessUpdate,
    current_user: Usuario = Depends(require_role("emprendedor")),
    db: Session = Depends(get_db)
):
    emp = _get_empresa_usuario(db, current_user)
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    if data.nombre is not None:
        emp.nombre = data.nombre.strip()
    if data.id_categoria is not None:
        cat = db.query(Categoria).filter(Categoria.id_categoria == data.id_categoria).first()
        if not cat:
            raise HTTPException(404, "Categoría no encontrada")
        emp.id_categoria = data.id_categoria
    if data.descripcion is not None:
        emp.descripcion = data.descripcion.strip()
    if data.telefono is not None:
        emp.telefono = data.telefono
    if data.direccion is not None:
        emp.direccion = data.direccion
    if data.distrito is not None:
        emp.distrito = data.distrito

    db.commit()
    return MessageResponse(message="Negocio actualizado correctamente")


@router.put("/business/schedule", response_model=MessageResponse)
def actualizar_horarios(
    data: ScheduleUpdate,
    current_user: Usuario = Depends(require_role("emprendedor")),
    db: Session = Depends(get_db)
):
    emp = _get_empresa_usuario(db, current_user)
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    for item in data.horarios:
        if item.abierto and item.apertura and item.cierre:
            try:
                h_apertura = time.fromisoformat(item.apertura)
                h_cierre = time.fromisoformat(item.cierre)
            except ValueError:
                raise HTTPException(400, f"Formato de hora inválido para {item.dia}")
            if item.dia == "lunes":
                emp.horario_apertura = h_apertura
                emp.horario_cierre = h_cierre

    db.commit()
    return MessageResponse(message="Horarios actualizados")


@router.post("/business/image", response_model=dict)
async def subir_imagen_portada(
    imagen: UploadFile = File(...),
    current_user: Usuario = Depends(require_role("emprendedor")),
    db: Session = Depends(get_db)
):
    emp = _get_empresa_usuario(db, current_user)
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    url = await _guardar_imagen(imagen, "negocios")
    emp.imagen_portada_url = url
    db.commit()

    return {"imagen_url": url}


# ─── Endpoints — Productos ─────────────────────────────────────────────────

@router.get("/products", response_model=ProductListResponse)
def listar_mis_productos(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    busqueda: Optional[str] = None,
    current_user: Usuario = Depends(require_role("emprendedor")),
    db: Session = Depends(get_db)
):
    emp = _get_empresa_usuario(db, current_user)
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    query = db.query(Producto).filter(Producto.id_emprendimiento == emp.id_emprendimiento)

    if busqueda:
        patron = f"%{busqueda}%"
        query = query.filter(Producto.nombre.ilike(patron))

    total = query.count()
    items = query.order_by(Producto.fecha_creacion.desc())\
                 .offset((page - 1) * size).limit(size).all()

    return ProductListResponse(
        items=[
            ProductResponse(
                id_producto=p.id_producto,
                nombre=p.nombre,
                descripcion=p.descripcion,
                precio=float(p.precio) if p.precio else None,
                imagen_url=p.imagen_url,
                estado_stock=p.estado_stock,
                activo=p.activo,
                fecha_creacion=p.fecha_creacion
            )
            for p in items
        ],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size if total > 0 else 0
    )


@router.post("/products", status_code=201, response_model=ProductResponse)
async def crear_producto(
    nombre: str = Form(...),
    descripcion: Optional[str] = Form(None),
    precio: Optional[float] = Form(None),
    estado_stock: str = Form("disponible"),
    imagen: Optional[UploadFile] = File(None),
    current_user: Usuario = Depends(require_role("emprendedor")),
    db: Session = Depends(get_db)
):
    emp = _get_empresa_usuario(db, current_user)
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")
    if emp.estado_verificacion != "aprobado":
        raise HTTPException(400, "No puedes agregar productos si tu negocio no está aprobado")

    count = db.query(func.count(Producto.id_producto)).filter(
        Producto.id_emprendimiento == emp.id_emprendimiento,
        Producto.activo == True
    ).scalar() or 0
    if count >= 50:
        raise HTTPException(400, "Máximo 50 productos por emprendimiento")

    imagen_url = None
    if imagen and imagen.filename:
        imagen_url = await _guardar_imagen(imagen, "productos")

    prod = Producto(
        id_emprendimiento=emp.id_emprendimiento,
        nombre=nombre.strip(),
        descripcion=descripcion.strip() if descripcion else None,
        precio=precio,
        imagen_url=imagen_url,
        estado_stock=estado_stock
    )
    db.add(prod)
    db.commit()
    db.refresh(prod)

    return ProductResponse(
        id_producto=prod.id_producto,
        nombre=prod.nombre,
        descripcion=prod.descripcion,
        precio=float(prod.precio) if prod.precio else None,
        imagen_url=prod.imagen_url,
        estado_stock=prod.estado_stock,
        activo=prod.activo,
        fecha_creacion=prod.fecha_creacion
    )


@router.put("/products/{id_producto}", response_model=ProductResponse)
async def actualizar_producto(
    id_producto: int,
    nombre: Optional[str] = Form(None),
    descripcion: Optional[str] = Form(None),
    precio: Optional[float] = Form(None),
    estado_stock: Optional[str] = Form(None),
    imagen: Optional[UploadFile] = File(None),
    current_user: Usuario = Depends(require_role("emprendedor")),
    db: Session = Depends(get_db)
):
    emp = _get_empresa_usuario(db, current_user)
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    prod = db.query(Producto).filter(
        Producto.id_producto == id_producto,
        Producto.id_emprendimiento == emp.id_emprendimiento
    ).first()
    if not prod:
        raise HTTPException(404, "Producto no encontrado")

    if nombre is not None:
        prod.nombre = nombre.strip()
    if descripcion is not None:
        prod.descripcion = descripcion.strip()
    if precio is not None:
        prod.precio = precio
    if estado_stock is not None:
        prod.estado_stock = estado_stock
    if imagen and imagen.filename:
        prod.imagen_url = await _guardar_imagen(imagen, "productos")

    db.commit()
    db.refresh(prod)

    return ProductResponse(
        id_producto=prod.id_producto,
        nombre=prod.nombre,
        descripcion=prod.descripcion,
        precio=float(prod.precio) if prod.precio else None,
        imagen_url=prod.imagen_url,
        estado_stock=prod.estado_stock,
        activo=prod.activo,
        fecha_creacion=prod.fecha_creacion
    )


@router.delete("/products/{id_producto}", response_model=MessageResponse)
def eliminar_producto(
    id_producto: int,
    current_user: Usuario = Depends(require_role("emprendedor")),
    db: Session = Depends(get_db)
):
    emp = _get_empresa_usuario(db, current_user)
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    prod = db.query(Producto).filter(
        Producto.id_producto == id_producto,
        Producto.id_emprendimiento == emp.id_emprendimiento
    ).first()
    if not prod:
        raise HTTPException(404, "Producto no encontrado")

    prod.activo = False
    db.commit()

    return MessageResponse(message="Producto eliminado")


# ─── Endpoints — Promociones ───────────────────────────────────────────────

@router.get("/promotions", response_model=list[PromotionResponse])
def listar_mis_promociones(
    current_user: Usuario = Depends(require_role("emprendedor")),
    db: Session = Depends(get_db)
):
    emp = _get_empresa_usuario(db, current_user)
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    hoy = date.today()
    promos = db.query(Promocion).filter(
        Promocion.id_emprendimiento == emp.id_emprendimiento
    ).order_by(func.coalesce(Promocion.fecha_inicio, '1900-01-01').desc()).all()

    resultado = []
    for p in promos:
        if p.estado == "activa" and p.fecha_fin and p.fecha_fin < hoy:
            p.estado = "vencida"
            db.commit()
        resultado.append(PromotionResponse(
            id_promocion=p.id_promocion,
            titulo=p.titulo,
            descripcion=p.descripcion,
            fecha_inicio=p.fecha_inicio,
            fecha_fin=p.fecha_fin,
            estado=p.estado
        ))

    return resultado


@router.post("/promotions", status_code=201, response_model=PromotionResponse)
def crear_promocion(
    data: PromotionCreate,
    current_user: Usuario = Depends(require_role("emprendedor")),
    db: Session = Depends(get_db)
):
    emp = _get_empresa_usuario(db, current_user)
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    if data.estado == "activa":
        activas = db.query(func.count(Promocion.id_promocion)).filter(
            Promocion.id_emprendimiento == emp.id_emprendimiento,
            Promocion.estado == "activa"
        ).scalar() or 0
        if activas >= 10:
            raise HTTPException(400, "Máximo 10 promociones activas simultáneas")

    promo = Promocion(
        id_emprendimiento=emp.id_emprendimiento,
        titulo=data.titulo.strip(),
        descripcion=data.descripcion.strip() if data.descripcion else None,
        fecha_inicio=data.fecha_inicio,
        fecha_fin=data.fecha_fin,
        estado=data.estado
    )
    db.add(promo)
    db.commit()
    db.refresh(promo)

    return PromotionResponse(
        id_promocion=promo.id_promocion,
        titulo=promo.titulo,
        descripcion=promo.descripcion,
        fecha_inicio=promo.fecha_inicio,
        fecha_fin=promo.fecha_fin,
        estado=promo.estado
    )


@router.put("/promotions/{id_promocion}", response_model=PromotionResponse)
def actualizar_promocion(
    id_promocion: int,
    data: PromotionUpdate,
    current_user: Usuario = Depends(require_role("emprendedor")),
    db: Session = Depends(get_db)
):
    emp = _get_empresa_usuario(db, current_user)
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    promo = db.query(Promocion).filter(
        Promocion.id_promocion == id_promocion,
        Promocion.id_emprendimiento == emp.id_emprendimiento
    ).first()
    if not promo:
        raise HTTPException(404, "Promoción no encontrada")

    if data.titulo is not None:
        promo.titulo = data.titulo.strip()
    if data.descripcion is not None:
        promo.descripcion = data.descripcion.strip()
    if data.fecha_inicio is not None:
        promo.fecha_inicio = data.fecha_inicio
    if data.fecha_fin is not None:
        promo.fecha_fin = data.fecha_fin
    if data.estado is not None:
        promo.estado = data.estado

    db.commit()
    db.refresh(promo)

    return PromotionResponse(
        id_promocion=promo.id_promocion,
        titulo=promo.titulo,
        descripcion=promo.descripcion,
        fecha_inicio=promo.fecha_inicio,
        fecha_fin=promo.fecha_fin,
        estado=promo.estado
    )


@router.delete("/promotions/{id_promocion}", response_model=MessageResponse)
def eliminar_promocion(
    id_promocion: int,
    current_user: Usuario = Depends(require_role("emprendedor")),
    db: Session = Depends(get_db)
):
    emp = _get_empresa_usuario(db, current_user)
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    promo = db.query(Promocion).filter(
        Promocion.id_promocion == id_promocion,
        Promocion.id_emprendimiento == emp.id_emprendimiento
    ).first()
    if not promo:
        raise HTTPException(404, "Promoción no encontrada")

    db.delete(promo)
    db.commit()

    return MessageResponse(message="Promoción eliminada")


# ─── Endpoints — Stats ─────────────────────────────────────────────────────

@router.get("/stats", response_model=StatsResponse)
def obtener_estadisticas(
    current_user: Usuario = Depends(require_role("emprendedor")),
    db: Session = Depends(get_db)
):
    emp = _get_empresa_usuario(db, current_user)
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    productos_activos = db.query(func.count(Producto.id_producto)).filter(
        Producto.id_emprendimiento == emp.id_emprendimiento,
        Producto.activo == True
    ).scalar() or 0

    resenas_recientes = db.query(Comentario).options(
        joinedload(Comentario.usuario)
    ).filter(
        Comentario.id_emprendimiento == emp.id_emprendimiento
    ).order_by(Comentario.fecha.desc()).limit(5).all()

    actividad = []
    for r in resenas_recientes:
        nombre = f"{r.usuario.nombre} {r.usuario.apellido}" if r.usuario else "Alguien"
        actividad.append(ActividadReciente(
            tipo="resena",
            mensaje=f"Nueva reseña de {nombre}",
            fecha=r.fecha
        ))

    if emp.estado_verificacion:
        actividad.append(ActividadReciente(
            tipo="verificacion",
            mensaje=f"Perfil {emp.estado_verificacion}",
            fecha=emp.fecha_registro or datetime.now(timezone.utc)
        ))

    return StatsResponse(
        visitas_totales=0,
        visitas_incremento=0,
        clics_perfil=0,
        clics_incremento=0,
        productos_activos=productos_activos,
        estado_negocio=emp.estado_verificacion,
        actividad_reciente=actividad
    )


# ─── Endpoints — Settings ──────────────────────────────────────────────────

@router.put("/settings/password", response_model=MessageResponse)
def cambiar_contrasena(
    data: PasswordChange,
    current_user: Usuario = Depends(require_role("emprendedor")),
    db: Session = Depends(get_db)
):
    if not pwd_context.verify(data.contrasena_actual, current_user.contrasena_hash):
        raise HTTPException(400, "La contraseña actual es incorrecta")

    if data.nueva_contrasena != data.confirmar_contrasena:
        raise HTTPException(400, "Las contraseñas no coinciden")

    current_user.contrasena_hash = pwd_context.hash(data.nueva_contrasena)
    db.commit()

    return MessageResponse(message="Contraseña actualizada exitosamente")


@router.put("/settings/notifications", response_model=MessageResponse)
def guardar_preferencias(
    data: NotificationPreferences,
    current_user: Usuario = Depends(require_role("emprendedor")),
    db: Session = Depends(get_db)
):
    db.commit()
    return MessageResponse(message="Preferencias guardadas")

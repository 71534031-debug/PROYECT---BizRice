from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from pydantic import BaseModel, field_validator, model_validator
from datetime import datetime, time, date, timezone
from typing import Optional
from passlib.context import CryptContext
import re
import os
import uuid

from src.config.db import get_db_conn
from src.config.settings import settings
from src.repositories.business_repository import BusinessRepository
from src.repositories.product_repository import ProductRepository
from src.repositories.promotion_repository import PromotionRepository
from src.repositories.review_repository import ReviewRepository
from src.repositories.base_repository import BaseRepository
from src.controllers.auth_controller import require_role, pwd_context

router = APIRouter()


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
    stock: int = 0
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

    @field_validator('fecha_inicio')
    @classmethod
    def fecha_inicio_no_pasada(cls, v):
        if v is not None and v < date.today():
            raise ValueError('La fecha de inicio no puede ser anterior a hoy')
        return v

    @model_validator(mode='after')
    def fechas_coherentes(self):
        if self.fecha_inicio and self.fecha_fin:
            if self.fecha_fin <= self.fecha_inicio:
                raise ValueError('La fecha fin debe ser posterior a la fecha inicio')
        return self


class PromotionUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    estado: Optional[str] = None

    @field_validator('fecha_inicio')
    @classmethod
    def fecha_inicio_no_pasada(cls, v):
        if v is not None and v < date.today():
            raise ValueError('La fecha de inicio no puede ser anterior a hoy')
        return v

    @model_validator(mode='after')
    def fechas_coherentes(self):
        if self.fecha_inicio and self.fecha_fin:
            if self.fecha_fin <= self.fecha_inicio:
                raise ValueError('La fecha fin debe ser posterior a la fecha inicio')
        return self


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


async def _guardar_imagen(upload: UploadFile, subdir: str) -> str:
    if upload.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(400, "Formato no válido. Usa JPG, PNG o WebP")

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    contents = await upload.read()
    if len(contents) > max_bytes:
        raise HTTPException(400, f"La imagen excede el máximo de {settings.MAX_FILE_SIZE_MB}MB")

    try:
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(contents))
        if img.mode == "RGBA":
            img = img.convert("RGB")
        if img.width > 800:
            ratio = 800.0 / img.width
            img = img.resize((800, int(img.height * ratio)), Image.LANCZOS)
        output = io.BytesIO()
        img.save(output, format="WEBP", quality=85)
        filename = f"{uuid.uuid4().hex}.webp"
    except ImportError:
        ext = os.path.splitext(upload.filename or "imagen.jpg")[1].lower()
        if ext not in (".jpg", ".jpeg", ".png", ".webp"):
            ext = ".jpg"
        filename = f"{uuid.uuid4().hex}{ext}"
        output = io.BytesIO(contents)

    upload_dir = os.path.join(settings.UPLOAD_DIR, subdir)
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, "wb") as f:
        f.write(output.getvalue())

    return f"/uploads/{subdir}/{filename}"


@router.get("/business", response_model=BusinessResponse)
def obtener_mi_negocio(
    current_user=Depends(require_role("emprendedor")),
    conn=Depends(get_db_conn),
):
    repo = BusinessRepository(conn)
    emp = repo.get_by_user(current_user["id_usuario"])
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    return BusinessResponse(
        id_emprendimiento=emp["id_emprendimiento"],
        nombre=emp["nombre"],
        descripcion=emp.get("descripcion"),
        telefono=emp.get("telefono"),
        direccion=emp.get("direccion"),
        distrito=emp.get("distrito"),
        horario_apertura=str(emp.get("horario_apertura") or "")[:8] or None,
        horario_cierre=str(emp.get("horario_cierre") or "")[:8] or None,
        imagen_portada_url=emp.get("imagen_portada_url"),
        estado_verificacion=emp["estado_verificacion"],
        fecha_registro=emp.get("fecha_registro"),
        categoria=CategoryInfo(
            id_categoria=emp["id_categoria"],
            nombre=emp.get("nombre_categoria") or "",
        ),
        puntuacion_promedio=float(emp.get("puntuacion_promedio", 0)),
        total_valoraciones=int(emp.get("total_valoraciones", 0)),
        redes_sociales=[
            RedSocialInfo(plataforma=r["plataforma"], url=r["url"])
            for r in (emp.get("redes_sociales") or [])
        ],
    )


@router.post("/business", status_code=201, response_model=BusinessResponse)
def registrar_mi_negocio(
    data: BusinessCreate,
    current_user=Depends(require_role("emprendedor")),
    conn=Depends(get_db_conn),
):
    repo = BusinessRepository(conn)
    existe = repo.get_by_user(current_user["id_usuario"])
    if existe:
        raise HTTPException(400, "Ya tienes un negocio registrado")

    try:
        emp = repo.create({
            "id_usuario": current_user["id_usuario"],
            "id_categoria": data.id_categoria,
            "nombre": data.nombre.strip(),
            "descripcion": data.descripcion.strip() if data.descripcion else None,
            "telefono": data.telefono,
            "direccion": data.direccion,
            "distrito": data.distrito,
        })
    except Exception as e:
        error_msg = str(e)
        if "Categoría no encontrada" in error_msg:
            raise HTTPException(404, "Categoría no encontrada")
        raise HTTPException(400, error_msg)

    conn.commit()

    return BusinessResponse(
        id_emprendimiento=emp["id_emprendimiento"],
        nombre=emp["nombre"],
        descripcion=emp.get("descripcion"),
        telefono=emp.get("telefono"),
        direccion=emp.get("direccion"),
        distrito=emp.get("distrito"),
        estado_verificacion=emp["estado_verificacion"],
        fecha_registro=emp.get("fecha_registro"),
        categoria=CategoryInfo(id_categoria=emp["id_categoria"], nombre=emp.get("nombre_categoria") or ""),
        puntuacion_promedio=0.0,
        total_valoraciones=0,
        redes_sociales=[],
    )


@router.put("/business", response_model=MessageResponse)
def actualizar_mi_negocio(
    data: BusinessUpdate,
    current_user=Depends(require_role("emprendedor")),
    conn=Depends(get_db_conn),
):
    repo = BusinessRepository(conn)
    emp = repo.get_by_user(current_user["id_usuario"])
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    try:
        repo.update(emp["id_emprendimiento"], current_user["id_usuario"], data.model_dump(exclude_none=True))
    except Exception as e:
        raise HTTPException(400, str(e))

    conn.commit()
    return MessageResponse(message="Negocio actualizado correctamente")


@router.put("/business/schedule", response_model=MessageResponse)
def actualizar_horarios(
    data: ScheduleUpdate,
    current_user=Depends(require_role("emprendedor")),
    conn=Depends(get_db_conn),
):
    repo = BusinessRepository(conn)
    emp = repo.get_by_user(current_user["id_usuario"])
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
                repo.update(emp["id_emprendimiento"], current_user["id_usuario"], {
                    "horario_apertura": str(h_apertura),
                    "horario_cierre": str(h_cierre),
                })

    conn.commit()
    return MessageResponse(message="Horarios actualizados")


@router.post("/business/image", response_model=dict)
async def subir_imagen_portada(
    imagen: UploadFile = File(...),
    current_user=Depends(require_role("emprendedor")),
    conn=Depends(get_db_conn),
):
    repo = BusinessRepository(conn)
    emp = repo.get_by_user(current_user["id_usuario"])
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    url = await _guardar_imagen(imagen, "negocios")
    repo.update(emp["id_emprendimiento"], current_user["id_usuario"], {"imagen_portada_url": url})
    conn.commit()

    return {"imagen_url": url}


@router.get("/products", response_model=ProductListResponse)
def listar_mis_productos(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    busqueda: Optional[str] = None,
    current_user=Depends(require_role("emprendedor")),
    conn=Depends(get_db_conn),
):
    repo = BusinessRepository(conn)
    emp = repo.get_by_user(current_user["id_usuario"])
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    prod_repo = ProductRepository(conn)
    result = prod_repo.get_by_business(emp["id_emprendimiento"], page=page, size=size, busqueda=busqueda)

    items = [
        ProductResponse(
            id_producto=r["id_producto"],
            nombre=r["nombre"],
            descripcion=r.get("descripcion"),
            precio=float(r["precio"]) if r.get("precio") else None,
            imagen_url=r.get("imagen_url"),
            estado_stock=r["estado_stock"],
            stock=r.get("stock") or 0,
            activo=r.get("activo", True),
            fecha_creacion=r.get("fecha_creacion"),
        )
        for r in result["items"]
    ]
    return ProductListResponse(
        items=items, total=result["total"],
        page=result["page"], size=result["size"], pages=result["pages"],
    )


@router.post("/products", status_code=201, response_model=ProductResponse)
async def crear_producto(
    nombre: str = Form(...),
    descripcion: Optional[str] = Form(None),
    precio: Optional[float] = Form(None),
    stock: int = Form(0),
    estado_stock: str = Form("disponible"),
    imagen: Optional[UploadFile] = File(None),
    current_user=Depends(require_role("emprendedor")),
    conn=Depends(get_db_conn),
):
    biz_repo = BusinessRepository(conn)
    emp = biz_repo.get_by_user(current_user["id_usuario"])
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")
    if emp.get("estado_verificacion") != "aprobado":
        raise HTTPException(400, "No puedes agregar productos si tu negocio no está aprobado")

    imagen_url = None
    if imagen and imagen.filename:
        imagen_url = await _guardar_imagen(imagen, "productos")

    prod_repo = ProductRepository(conn)
    try:
        prod = prod_repo.create(emp["id_emprendimiento"], {
            "nombre": nombre.strip(),
            "descripcion": descripcion.strip() if descripcion else None,
            "precio": precio,
            "imagen_url": imagen_url,
            "stock": stock,
            "estado_stock": estado_stock,
        })
    except Exception as e:
        if "Máximo 50" in str(e):
            raise HTTPException(400, "Máximo 50 productos por emprendimiento")
        raise HTTPException(400, str(e))

    conn.commit()
    return ProductResponse(
        id_producto=prod["id_producto"],
        nombre=prod["nombre"],
        descripcion=prod.get("descripcion"),
        precio=float(prod["precio"]) if prod.get("precio") else None,
        imagen_url=prod.get("imagen_url"),
        estado_stock=prod["estado_stock"],
        stock=prod.get("stock") or 0,
        activo=prod.get("activo", True),
        fecha_creacion=prod.get("fecha_creacion"),
    )


@router.put("/products/{id_producto}", response_model=ProductResponse)
async def actualizar_producto(
    id_producto: int,
    nombre: Optional[str] = Form(None),
    descripcion: Optional[str] = Form(None),
    precio: Optional[float] = Form(None),
    stock: Optional[int] = Form(None),
    estado_stock: Optional[str] = Form(None),
    imagen: Optional[UploadFile] = File(None),
    current_user=Depends(require_role("emprendedor")),
    conn=Depends(get_db_conn),
):
    biz_repo = BusinessRepository(conn)
    emp = biz_repo.get_by_user(current_user["id_usuario"])
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    imagen_url = None
    if imagen and imagen.filename:
        imagen_url = await _guardar_imagen(imagen, "productos")

    prod_repo = ProductRepository(conn)
    data = {}
    if nombre is not None: data["nombre"] = nombre.strip()
    if descripcion is not None: data["descripcion"] = descripcion.strip()
    if precio is not None: data["precio"] = precio
    if stock is not None: data["stock"] = stock
    if estado_stock is not None: data["estado_stock"] = estado_stock
    if imagen_url: data["imagen_url"] = imagen_url

    try:
        prod = prod_repo.update(id_producto, emp["id_emprendimiento"], data)
    except Exception as e:
        raise HTTPException(404, str(e))

    conn.commit()
    return ProductResponse(
        id_producto=prod["id_producto"],
        nombre=prod["nombre"],
        descripcion=prod.get("descripcion"),
        precio=float(prod["precio"]) if prod.get("precio") else None,
        imagen_url=prod.get("imagen_url"),
        estado_stock=prod["estado_stock"],
        stock=prod.get("stock") or 0,
        activo=prod.get("activo", True),
        fecha_creacion=prod.get("fecha_creacion"),
    )


@router.delete("/products/{id_producto}", response_model=MessageResponse)
def eliminar_producto(
    id_producto: int,
    current_user=Depends(require_role("emprendedor")),
    conn=Depends(get_db_conn),
):
    biz_repo = BusinessRepository(conn)
    emp = biz_repo.get_by_user(current_user["id_usuario"])
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    prod_repo = ProductRepository(conn)
    try:
        prod_repo.delete(id_producto, emp["id_emprendimiento"])
    except Exception as e:
        raise HTTPException(404, str(e))

    conn.commit()
    return MessageResponse(message="Producto eliminado")


@router.get("/promotions", response_model=list[PromotionResponse])
def listar_mis_promociones(
    current_user=Depends(require_role("emprendedor")),
    conn=Depends(get_db_conn),
):
    biz_repo = BusinessRepository(conn)
    emp = biz_repo.get_by_user(current_user["id_usuario"])
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    promo_repo = PromotionRepository(conn)
    promos = promo_repo.get_by_business(emp["id_emprendimiento"])
    return [
        PromotionResponse(
            id_promocion=p["id_promocion"],
            titulo=p["titulo"],
            descripcion=p.get("descripcion"),
            fecha_inicio=p.get("fecha_inicio"),
            fecha_fin=p.get("fecha_fin"),
            estado=p["estado"],
        )
        for p in promos
    ]


@router.post("/promotions", status_code=201, response_model=PromotionResponse)
def crear_promocion(
    data: PromotionCreate,
    current_user=Depends(require_role("emprendedor")),
    conn=Depends(get_db_conn),
):
    biz_repo = BusinessRepository(conn)
    emp = biz_repo.get_by_user(current_user["id_usuario"])
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    promo_repo = PromotionRepository(conn)
    try:
        promo = promo_repo.create(emp["id_emprendimiento"], data.model_dump())
    except Exception as e:
        if "Máximo 10" in str(e):
            raise HTTPException(400, "Máximo 10 promociones activas simultáneas")
        raise HTTPException(400, str(e))

    conn.commit()
    return PromotionResponse(
        id_promocion=promo["id_promocion"],
        titulo=promo["titulo"],
        descripcion=promo.get("descripcion"),
        fecha_inicio=promo.get("fecha_inicio"),
        fecha_fin=promo.get("fecha_fin"),
        estado=promo["estado"],
    )


@router.put("/promotions/{id_promocion}", response_model=PromotionResponse)
def actualizar_promocion(
    id_promocion: int,
    data: PromotionUpdate,
    current_user=Depends(require_role("emprendedor")),
    conn=Depends(get_db_conn),
):
    biz_repo = BusinessRepository(conn)
    emp = biz_repo.get_by_user(current_user["id_usuario"])
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    promo_repo = PromotionRepository(conn)
    try:
        promo = promo_repo.update(id_promocion, emp["id_emprendimiento"], data.model_dump(exclude_none=True))
    except Exception as e:
        raise HTTPException(404, str(e))

    conn.commit()
    return PromotionResponse(
        id_promocion=promo["id_promocion"],
        titulo=promo["titulo"],
        descripcion=promo.get("descripcion"),
        fecha_inicio=promo.get("fecha_inicio"),
        fecha_fin=promo.get("fecha_fin"),
        estado=promo["estado"],
    )


@router.delete("/promotions/{id_promocion}", response_model=MessageResponse)
def eliminar_promocion(
    id_promocion: int,
    current_user=Depends(require_role("emprendedor")),
    conn=Depends(get_db_conn),
):
    biz_repo = BusinessRepository(conn)
    emp = biz_repo.get_by_user(current_user["id_usuario"])
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    promo_repo = PromotionRepository(conn)
    try:
        promo_repo.delete(id_promocion, emp["id_emprendimiento"])
    except Exception as e:
        raise HTTPException(404, str(e))

    conn.commit()
    return MessageResponse(message="Promoción eliminada")


@router.get("/stats", response_model=StatsResponse)
def obtener_estadisticas(
    current_user=Depends(require_role("emprendedor")),
    conn=Depends(get_db_conn),
):
    biz_repo = BusinessRepository(conn)
    emp = biz_repo.get_by_user(current_user["id_usuario"])
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    prod_repo = ProductRepository(conn)
    products = prod_repo.get_by_business(emp["id_emprendimiento"], page=1, size=1000)
    productos_activos = sum(1 for p in products["items"] if p.get("activo", True))

    review_repo = ReviewRepository(conn)
    reviews = review_repo.get_by_business(emp["id_emprendimiento"], page=1, size=5)

    actividad = []
    for r in reviews["items"]:
        nombre = f"{r.get('usuario_nombre') or ''} {r.get('usuario_apellido') or ''}".strip() or "Alguien"
        actividad.append(ActividadReciente(
            tipo="resena",
            mensaje=f"Nueva reseña de {nombre}",
            fecha=r["fecha"],
        ))

    if emp.get("estado_verificacion"):
        actividad.append(ActividadReciente(
            tipo="verificacion",
            mensaje=f"Perfil {emp['estado_verificacion']}",
            fecha=emp.get("fecha_registro") or datetime.now(timezone.utc),
        ))

    return StatsResponse(
        visitas_totales=0,
        visitas_incremento=0,
        clics_perfil=0,
        clics_incremento=0,
        productos_activos=productos_activos,
        estado_negocio=emp.get("estado_verificacion"),
        actividad_reciente=actividad,
    )


@router.put("/settings/password", response_model=MessageResponse)
def cambiar_contrasena(
    data: PasswordChange,
    current_user=Depends(require_role("emprendedor")),
    conn=Depends(get_db_conn),
):
    if not pwd_context.verify(data.contrasena_actual, current_user.get("contrasena_hash", "")):
        raise HTTPException(400, "La contraseña actual es incorrecta")
    if data.nueva_contrasena != data.confirmar_contrasena:
        raise HTTPException(400, "Las contraseñas no coinciden")

    from src.repositories.user_repository import UserRepository
    user_repo = UserRepository(conn)
    user_repo.change_password(current_user["id_usuario"], pwd_context.hash(data.nueva_contrasena))
    conn.commit()

    return MessageResponse(message="Contraseña actualizada exitosamente")


@router.get("/settings/notifications", response_model=NotificationPreferences)
def obtener_preferencias(
    current_user=Depends(require_role("emprendedor")),
):
    return NotificationPreferences(email_notificaciones=True, whatsapp_notificaciones=False)


@router.put("/settings/notifications", response_model=MessageResponse)
def guardar_preferencias(
    data: NotificationPreferences,
    current_user=Depends(require_role("emprendedor")),
    conn=Depends(get_db_conn),
):
    return MessageResponse(message="Preferencias guardadas")

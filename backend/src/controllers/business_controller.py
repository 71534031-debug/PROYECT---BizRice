from fastapi import APIRouter, Depends, HTTPException, Header, Query
from pydantic import BaseModel
from datetime import datetime, time, date, timezone
from typing import Optional

from src.config.db import get_db_conn
from src.repositories.business_repository import BusinessRepository
from src.repositories.product_repository import ProductRepository
from src.repositories.review_repository import ReviewRepository
from src.controllers.auth_controller import get_current_user

router = APIRouter()


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


def _get_time_str(t) -> str | None:
    if t is None:
        return None
    return str(t)[:8] if hasattr(t, "strftime") else str(t)[:8]


def _esta_abierto(apertura, cierre) -> bool:
    if not apertura or not cierre:
        return False
    ahora = datetime.now(timezone.utc).time()
    try:
        if isinstance(apertura, str):
            h_apertura = time.fromisoformat(str(apertura)[:5])
            h_cierre = time.fromisoformat(str(cierre)[:5])
        else:
            h_apertura = apertura
            h_cierre = cierre
        return h_apertura <= ahora <= h_cierre
    except Exception:
        return False


def _get_user_from_header(authorization: str, conn):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token requerido")
    return get_current_user(authorization.split(" ")[1], conn)


@router.get("", response_model=BusinessListResponse)
def listar_emprendimientos(
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1, le=100),
    busqueda: Optional[str] = None,
    categoria: Optional[int] = None,
    distrito: Optional[str] = None,
    orden: Optional[str] = None,
    conn=Depends(get_db_conn),
):
    repo = BusinessRepository(conn)
    result = repo.get_all(
        busqueda=busqueda, id_categoria=categoria,
        distrito=distrito, orden=orden, page=page, size=size,
    )
    items = [
        BusinessListItem(
            id_emprendimiento=r["id_emprendimiento"],
            nombre=r["nombre"],
            descripcion=r.get("descripcion"),
            categoria=r.get("nombre_categoria") or "",
            id_categoria=r["id_categoria"],
            distrito=r.get("distrito"),
            imagen_portada_url=r.get("imagen_portada_url"),
            estado_verificacion=r["estado_verificacion"],
            puntuacion_promedio=float(r.get("puntuacion_promedio", 0)),
            total_valoraciones=int(r.get("total_valoraciones", 0)),
            horario_apertura=_get_time_str(r.get("horario_apertura")),
            horario_cierre=_get_time_str(r.get("horario_cierre")),
            esta_abierto=_esta_abierto(r.get("horario_apertura"), r.get("horario_cierre")),
        )
        for r in result["items"]
    ]
    return BusinessListResponse(
        items=items, total=result["total"],
        page=result["page"], size=result["size"], pages=result["pages"],
    )


@router.get("/{id_emprendimiento}", response_model=BusinessDetailResponse)
def obtener_emprendimiento(id_emprendimiento: int, conn=Depends(get_db_conn)):
    repo = BusinessRepository(conn)
    emp = repo.get_by_id(id_emprendimiento)
    if not emp:
        raise HTTPException(404, "Emprendimiento no encontrado")

    return BusinessDetailResponse(
        id_emprendimiento=emp["id_emprendimiento"],
        nombre=emp["nombre"],
        descripcion=emp.get("descripcion"),
        telefono=emp.get("telefono"),
        direccion=emp.get("direccion"),
        distrito=emp.get("distrito"),
        horario_apertura=_get_time_str(emp.get("horario_apertura")),
        horario_cierre=_get_time_str(emp.get("horario_cierre")),
        esta_abierto=_esta_abierto(emp.get("horario_apertura"), emp.get("horario_cierre")),
        imagen_portada_url=emp.get("imagen_portada_url"),
        estado_verificacion=emp["estado_verificacion"],
        fecha_registro=emp.get("fecha_registro"),
        categoria=CategoriaInfo(
            id_categoria=emp["id_categoria"],
            nombre=emp.get("nombre_categoria") or "",
        ),
        propietario=PropietarioInfo(
            nombre=emp.get("nombre_propietario") or "",
            apellido=emp.get("apellido_propietario") or "",
        ),
        puntuacion_promedio=float(emp.get("puntuacion_promedio", 0)),
        total_valoraciones=int(emp.get("total_valoraciones", 0)),
        redes_sociales=[
            RedSocialResponse(plataforma=r["plataforma"], url=r["url"])
            for r in (emp.get("redes_sociales") or [])
        ],
        promociones_activas=[
            PromocionResponse(
                id_promocion=p["id_promocion"],
                titulo=p["titulo"],
                descripcion=p.get("descripcion"),
                fecha_fin=p.get("fecha_fin"),
                estado=p["estado"],
            )
            for p in (emp.get("promociones_activas") or [])
        ],
    )


@router.get("/{id_emprendimiento}/products", response_model=ProductListResponse)
def listar_productos(
    id_emprendimiento: int,
    page: int = Query(1, ge=1),
    size: int = Query(9, ge=1, le=50),
    conn=Depends(get_db_conn),
):
    repo = ProductRepository(conn)
    result = repo.get_by_business(id_emprendimiento, page=page, size=size)
    items = [
        ProductoResponse(
            id_producto=r["id_producto"],
            nombre=r["nombre"],
            descripcion=r.get("descripcion"),
            precio=float(r["precio"]) if r.get("precio") else None,
            imagen_url=r.get("imagen_url"),
            stock=r.get("stock") or 0,
            estado_stock=r["estado_stock"],
        )
        for r in result["items"]
    ]
    return ProductListResponse(
        items=items, total=result["total"],
        page=result["page"], size=result["size"], pages=result["pages"],
    )


@router.get("/{id_emprendimiento}/reviews", response_model=ReviewListResponse)
def listar_resenas(
    id_emprendimiento: int,
    page: int = Query(1, ge=1),
    size: int = Query(5, ge=1, le=50),
    conn=Depends(get_db_conn),
):
    repo = ReviewRepository(conn)
    result = repo.get_by_business(id_emprendimiento, page=page, size=size)
    items = [
        ResenaItem(
            id_comentario=r["id_comentario"],
            usuario=UsuarioResena(
                nombre=r.get("usuario_nombre") or "",
                apellido=r.get("usuario_apellido") or "",
                avatar_url=r.get("avatar_url"),
            ),
            contenido=r["contenido"],
            puntuacion=r["puntuacion"],
            util_count=r.get("util_count", 0),
            fecha=r["fecha"],
        )
        for r in result["items"]
    ]
    return ReviewListResponse(
        items=items,
        total=result["total"],
        page=result["page"],
        size=result["size"],
        pages=result["pages"],
        puntuacion_promedio=result["puntuacion_promedio"],
        distribucion_estrellas=result["distribucion_estrellas"],
    )


@router.post("/{id_emprendimiento}/reviews", status_code=201, response_model=CreateReviewResponse)
def crear_resena(
    id_emprendimiento: int,
    data: CreateReviewSchema,
    authorization: str = Header(None),
    conn=Depends(get_db_conn),
):
    user = _get_user_from_header(authorization, conn)

    if not (1 <= data.puntuacion <= 5):
        raise HTTPException(400, "La puntuación debe estar entre 1 y 5")
    if len(data.contenido.strip()) < 10:
        raise HTTPException(400, "El comentario debe tener al menos 10 caracteres")

    repo = ReviewRepository(conn)
    try:
        repo.create(
            id_usuario=user["id_usuario"],
            id_emprendimiento=id_emprendimiento,
            contenido=data.contenido.strip(),
            puntuacion=data.puntuacion,
        )
    except Exception as e:
        error_msg = str(e)
        if "Ya dejaste" in error_msg:
            raise HTTPException(400, "Ya dejaste una reseña en este emprendimiento")
        if "al menos 10 caracteres" in error_msg:
            raise HTTPException(400, error_msg)
        if "entre 1 y 5" in error_msg:
            raise HTTPException(400, error_msg)
        raise

    conn.commit()
    return CreateReviewResponse(message="Reseña publicada exitosamente")

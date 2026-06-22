import logging
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from src.config.db import get_db_conn
from src.repositories.base_repository import BaseRepository
from src.repositories.business_repository import BusinessRepository
from src.controllers.auth_controller import get_current_user

router = APIRouter()


class ProductoVentaInfo(BaseModel):
    id_producto: int
    nombre: str
    precio: Optional[float] = None


class DetalleVentaResponse(BaseModel):
    id_detalle: int
    id_producto: int
    producto_nombre: str
    cantidad: int
    precio_unitario: float
    subtotal: float


class VentaResponse(BaseModel):
    id_venta: int
    id_usuario: int
    id_emprendimiento: int
    negocio_nombre: str
    total: float
    estado: str
    fecha_creacion: datetime
    detalles: list[DetalleVentaResponse] = []


class VentaListResponse(BaseModel):
    items: list[VentaResponse]
    total: int
    page: int
    size: int
    pages: int


class VentaCreateItem(BaseModel):
    id_producto: int
    cantidad: int = 1


class VentaCreateSchema(BaseModel):
    id_emprendimiento: int
    productos: list[VentaCreateItem]


class MessageResponse(BaseModel):
    message: str


def _get_user_from_header(authorization: str, conn):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token requerido")
    return get_current_user(authorization.split(" ")[1], conn)


@router.get("", response_model=VentaListResponse)
def listar_ventas(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    estado: Optional[str] = None,
    id_emprendimiento: Optional[int] = None,
    authorization: str = Header(None),
    conn=Depends(get_db_conn),
):
    user = _get_user_from_header(authorization, conn)
    biz_repo = BusinessRepository(conn)

    if user.get("rol") == "emprendedor":
        emp = biz_repo.get_by_user(user["id_usuario"])
        if not emp:
            return VentaListResponse(items=[], total=0, page=page, size=size, pages=0)
        busqueda_id = emp["id_emprendimiento"]
    elif user.get("rol") == "cliente":
        busqueda_id = user["id_usuario"]
    elif user.get("rol") == "administrador" and id_emprendimiento:
        busqueda_id = id_emprendimiento
    else:
        busqueda_id = None

    if busqueda_id is None:
        return VentaListResponse(items=[], total=0, page=page, size=size, pages=0)

    offset = (page - 1) * size
    sql = """WITH filtered AS (
        SELECT v.id_venta, v.total, v.estado, v.fecha_creacion,
               u.id_usuario, u.nombre AS cliente_nombre, u.apellido AS cliente_apellido
        FROM Ventas v
        INNER JOIN Usuarios u ON v.id_usuario = u.id_usuario
        WHERE v.id_emprendimiento = %(id_emprendimiento)s
          AND (%(estado)s IS NULL OR v.estado = %(estado)s)
    )
    SELECT *, (SELECT COUNT(*) FROM filtered) AS total,
           %(size)s AS size, %(page)s AS page,
           CEIL((SELECT COUNT(*)::decimal FROM filtered) / NULLIF(%(size)s, 0)) AS pages
    FROM filtered
    ORDER BY fecha_creacion DESC
    LIMIT %(size)s OFFSET %(offset)s"""

    repo = BaseRepository(conn)
    try:
        rows = repo.execute_sp(sql, {
            "id_emprendimiento": busqueda_id,
            "page": page, "size": size, "offset": offset, "estado": estado,
        })
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"Error obteniendo ventas: {e}")
        raise HTTPException(500, "Error al obtener ventas")

    if not rows:
        return VentaListResponse(items=[], total=0, page=page, size=size, pages=0)

    meta = rows[0] if rows else {}
    return VentaListResponse(
        items=[
            VentaResponse(
                id_venta=r["id_venta"],
                id_usuario=r["id_usuario"],
                id_emprendimiento=busqueda_id,
                negocio_nombre="",
                total=float(r.get("total", 0)),
                estado=r.get("estado", "pendiente"),
                fecha_creacion=r.get("fecha_creacion") or datetime.now(),
                detalles=[],
            )
            for r in rows
        ],
        total=meta.get("total", 0),
        page=meta.get("page", page),
        size=meta.get("size", size),
        pages=meta.get("pages", 0),
    )


@router.get("/{id_venta}", response_model=VentaResponse)
def obtener_venta(
    id_venta: int,
    authorization: str = Header(None),
    conn=Depends(get_db_conn),
):
    user = _get_user_from_header(authorization, conn)
    repo = BaseRepository(conn)
    sql = """SELECT v.id_venta, v.total, v.estado, v.fecha_creacion,
                    u.id_usuario
             FROM Ventas v
             INNER JOIN Usuarios u ON v.id_usuario = u.id_usuario
             WHERE v.id_venta = %(id_venta)s
             LIMIT 1"""
    rows = repo.execute_sp(sql, {"id_venta": id_venta})
    if not rows:
        raise HTTPException(404, "Venta no encontrada")

    r = rows[0]
    return VentaResponse(
        id_venta=r["id_venta"],
        id_usuario=r.get("id_usuario", 0),
        id_emprendimiento=0,
        negocio_nombre="",
        total=float(r.get("total", 0)),
        estado=r.get("estado", "pendiente"),
        fecha_creacion=r.get("fecha_creacion") or datetime.now(),
        detalles=[],
    )


@router.post("", status_code=201, response_model=VentaResponse)
def crear_venta(
    data: VentaCreateSchema,
    authorization: str = Header(None),
    conn=Depends(get_db_conn),
):
    user = _get_user_from_header(authorization, conn)
    if not data.productos:
        raise HTTPException(400, "Debe incluir al menos un producto")

    raise HTTPException(501, "Creación de ventas requiere endpoint adicional")


@router.put("/{id_venta}/status", response_model=MessageResponse)
def actualizar_estado_venta(
    id_venta: int,
    nuevo_estado: str,
    authorization: str = Header(None),
    conn=Depends(get_db_conn),
):
    user = _get_user_from_header(authorization, conn)
    if nuevo_estado not in ("entregado", "pendiente", "cancelado"):
        raise HTTPException(400, "Estado no válido. Usar: entregado, pendiente, cancelado")

    conn.commit()
    return MessageResponse(message=f"Venta actualizada a '{nuevo_estado}'")

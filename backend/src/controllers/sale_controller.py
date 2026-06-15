from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from src.config.db import get_db
from src.models.sale import Venta, DetalleVenta
from src.models.product import Producto
from src.models.business import Emprendimiento
from src.models.user import Usuario
from src.controllers.auth_controller import get_current_user

router = APIRouter()

# ─── Schemas ───────────────────────────────────────────────────────────────

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

# ─── Helpers ───────────────────────────────────────────────────────────────

def _get_user_from_header(authorization: str, db: Session) -> Usuario:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token requerido")
    return get_current_user(authorization.split(" ")[1], db)

# ─── Endpoints ─────────────────────────────────────────────────────────────

@router.get("", response_model=VentaListResponse)
def listar_ventas(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    estado: Optional[str] = None,
    id_emprendimiento: Optional[int] = None,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user = _get_user_from_header(authorization, db)

    query = db.query(Venta).options(
        joinedload(Venta.emprendimiento),
        joinedload(Venta.detalles).joinedload(DetalleVenta.producto)
    )

    if user.rol == "emprendedor":
        emp = db.query(Emprendimiento).filter(
            Emprendimiento.id_usuario == user.id_usuario
        ).first()
        if not emp:
            return VentaListResponse(items=[], total=0, page=page, size=size, pages=0)
        query = query.filter(Venta.id_emprendimiento == emp.id_emprendimiento)
    elif user.rol == "cliente":
        query = query.filter(Venta.id_usuario == user.id_usuario)
    elif user.rol == "administrador":
        if id_emprendimiento:
            query = query.filter(Venta.id_emprendimiento == id_emprendimiento)
    else:
        raise HTTPException(403, "Acceso no autorizado")

    if estado:
        query = query.filter(Venta.estado == estado)

    total = query.count()
    items = query.order_by(Venta.fecha_creacion.desc())\
                 .offset((page - 1) * size).limit(size).all()

    return VentaListResponse(
        items=[_serialize_venta(v) for v in items],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size if total > 0 else 0
    )


@router.get("/{id_venta}", response_model=VentaResponse)
def obtener_venta(
    id_venta: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user = _get_user_from_header(authorization, db)

    venta = db.query(Venta).options(
        joinedload(Venta.emprendimiento),
        joinedload(Venta.detalles).joinedload(DetalleVenta.producto)
    ).filter(Venta.id_venta == id_venta).first()

    if not venta:
        raise HTTPException(404, "Venta no encontrada")

    if user.rol == "emprendedor":
        emp = db.query(Emprendimiento).filter(
            Emprendimiento.id_usuario == user.id_usuario
        ).first()
        if not emp or venta.id_emprendimiento != emp.id_emprendimiento:
            raise HTTPException(403, "No tienes acceso a esta venta")
    elif user.rol == "cliente" and venta.id_usuario != user.id_usuario:
        raise HTTPException(403, "No tienes acceso a esta venta")

    return _serialize_venta(venta)


@router.post("", status_code=201, response_model=VentaResponse)
def crear_venta(
    data: VentaCreateSchema,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user = _get_user_from_header(authorization, db)

    emp = db.query(Emprendimiento).filter(
        Emprendimiento.id_emprendimiento == data.id_emprendimiento,
        Emprendimiento.estado_verificacion == "aprobado"
    ).first()
    if not emp:
        raise HTTPException(404, "Emprendimiento no encontrado o no aprobado")

    if not data.productos:
        raise HTTPException(400, "Debe incluir al menos un producto")

    detalles = []
    total = 0

    for item in data.productos:
        producto = db.query(Producto).filter(
            Producto.id_producto == item.id_producto,
            Producto.id_emprendimiento == data.id_emprendimiento,
            Producto.activo == True
        ).first()
        if not producto:
            raise HTTPException(404, f"Producto {item.id_producto} no encontrado")
        if producto.estado_stock == "agotado":
            raise HTTPException(400, f"'{producto.nombre}' está agotado")

        precio = float(producto.precio or 0)
        subtotal = round(precio * item.cantidad, 2)
        total += subtotal

        detalles.append({
            "id_producto": producto.id_producto,
            "nombre": producto.nombre,
            "cantidad": item.cantidad,
            "precio_unitario": precio,
            "subtotal": subtotal
        })

    venta = Venta(
        id_usuario=user.id_usuario,
        id_emprendimiento=data.id_emprendimiento,
        total=round(total, 2),
        estado="pendiente"
    )
    db.add(venta)
    db.flush()

    for d in detalles:
        dv = DetalleVenta(
            id_venta=venta.id_venta,
            id_producto=d["id_producto"],
            cantidad=d["cantidad"],
            precio_unitario=d["precio_unitario"],
            subtotal=d["subtotal"]
        )
        db.add(dv)

    db.commit()
    db.refresh(venta)

    venta = db.query(Venta).options(
        joinedload(Venta.emprendimiento),
        joinedload(Venta.detalles).joinedload(DetalleVenta.producto)
    ).filter(Venta.id_venta == venta.id_venta).first()

    return _serialize_venta(venta)


@router.put("/{id_venta}/status", response_model=MessageResponse)
def actualizar_estado_venta(
    id_venta: int,
    nuevo_estado: str,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user = _get_user_from_header(authorization, db)

    if nuevo_estado not in ("entregado", "pendiente", "cancelado"):
        raise HTTPException(400, "Estado no válido. Usar: entregado, pendiente, cancelado")

    venta = db.query(Venta).filter(Venta.id_venta == id_venta).first()
    if not venta:
        raise HTTPException(404, "Venta no encontrada")

    if user.rol == "emprendedor":
        emp = db.query(Emprendimiento).filter(
            Emprendimiento.id_usuario == user.id_usuario
        ).first()
        if not emp or venta.id_emprendimiento != emp.id_emprendimiento:
            raise HTTPException(403, "No tienes acceso a esta venta")

    venta.estado = nuevo_estado
    db.commit()

    return MessageResponse(message=f"Venta actualizada a '{nuevo_estado}'")


def _serialize_venta(v: Venta) -> VentaResponse:
    return VentaResponse(
        id_venta=v.id_venta,
        id_usuario=v.id_usuario,
        id_emprendimiento=v.id_emprendimiento,
        negocio_nombre=v.emprendimiento.nombre if v.emprendimiento else "",
        total=float(v.total),
        estado=v.estado,
        fecha_creacion=v.fecha_creacion,
        detalles=[
            DetalleVentaResponse(
                id_detalle=d.id_detalle,
                id_producto=d.id_producto,
                producto_nombre=d.producto.nombre if d.producto else "",
                cantidad=d.cantidad,
                precio_unitario=float(d.precio_unitario),
                subtotal=float(d.subtotal)
            )
            for d in v.detalles
        ] if v.detalles else []
    )

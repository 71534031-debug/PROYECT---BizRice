from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, cast, String
from pydantic import BaseModel
from typing import Optional

from src.config.db import get_db
from src.models.product import Producto
from src.models.business import Emprendimiento

router = APIRouter()

# ─── Schemas ───────────────────────────────────────────────────────────────

class NegocioInfo(BaseModel):
    id_emprendimiento: int
    nombre: str
    distrito: Optional[str] = None

class ProductoPublicResponse(BaseModel):
    id_producto: int
    nombre: str
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    imagen_url: Optional[str] = None
    stock: int = 0
    estado_stock: str
    negocio: Optional[NegocioInfo] = None

class ProductoPublicListResponse(BaseModel):
    items: list[ProductoPublicResponse]
    total: int
    page: int
    size: int
    pages: int

# ─── Endpoints ─────────────────────────────────────────────────────────────

@router.get("", response_model=ProductoPublicListResponse)
def listar_productos(
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1, le=50),
    busqueda: Optional[str] = None,
    precio_min: Optional[float] = None,
    precio_max: Optional[float] = None,
    id_categoria: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Producto).options(
        joinedload(Producto.emprendimiento)
    ).filter(
        Producto.activo == True,
        Producto.estado_stock != "agotado"
    ).join(
        Emprendimiento,
        (Emprendimiento.id_emprendimiento == Producto.id_emprendimiento) &
        (Emprendimiento.estado_verificacion == "aprobado")
    )

    if busqueda:
        patron = f"%{busqueda}%"
        query = query.filter(
            Producto.nombre.ilike(patron) |
            cast(Producto.descripcion, String).ilike(patron)
        )
    if precio_min is not None:
        query = query.filter(Producto.precio >= precio_min)
    if precio_max is not None:
        query = query.filter(Producto.precio <= precio_max)
    if id_categoria is not None:
        query = query.filter(Emprendimiento.id_categoria == id_categoria)

    total = query.count()
    items = query.order_by(Producto.fecha_creacion.desc())\
                 .offset((page - 1) * size).limit(size).all()

    return ProductoPublicListResponse(
        items=[
            ProductoPublicResponse(
                id_producto=p.id_producto,
                nombre=p.nombre,
                descripcion=p.descripcion,
                precio=float(p.precio) if p.precio else None,
                imagen_url=p.imagen_url,
                estado_stock=p.estado_stock,
                stock=p.stock or 0,
                negocio=NegocioInfo(
                    id_emprendimiento=p.emprendimiento.id_emprendimiento,
                    nombre=p.emprendimiento.nombre,
                    distrito=p.emprendimiento.distrito
                ) if p.emprendimiento else None
            )
            for p in items
        ],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size if total > 0 else 0
    )


@router.get("/{id_producto}", response_model=ProductoPublicResponse)
def obtener_producto(id_producto: int, db: Session = Depends(get_db)):
    prod = db.query(Producto).options(
        joinedload(Producto.emprendimiento)
    ).filter(
        Producto.id_producto == id_producto,
        Producto.activo == True
    ).first()

    if not prod:
        raise HTTPException(404, "Producto no encontrado")

    return ProductoPublicResponse(
        id_producto=prod.id_producto,
        nombre=prod.nombre,
        descripcion=prod.descripcion,
        precio=float(prod.precio) if prod.precio else None,
        imagen_url=prod.imagen_url,
        estado_stock=prod.estado_stock,
        negocio=NegocioInfo(
            id_emprendimiento=prod.emprendimiento.id_emprendimiento,
            nombre=prod.emprendimiento.nombre,
            distrito=prod.emprendimiento.distrito
        ) if prod.emprendimiento else None
    )

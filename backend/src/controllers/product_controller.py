from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from src.config.db import get_db_conn
from src.repositories.product_repository import ProductRepository
from src.repositories.business_repository import BusinessRepository

router = APIRouter()


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


@router.get("", response_model=ProductoPublicListResponse)
def listar_productos(
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1, le=50),
    busqueda: Optional[str] = None,
    precio_min: Optional[float] = None,
    precio_max: Optional[float] = None,
    id_categoria: Optional[int] = None,
    conn=Depends(get_db_conn),
):
    """
    Listado público de productos — filtra por negocio aprobado y no agotados.
    Como no hay un SP dedicado para este cruce, se obtienen negocios aprobados
    y luego sus productos. Para una app real, crear sp_GetProductsPublic.
    """
    biz_repo = BusinessRepository(conn)
    prod_repo = ProductRepository(conn)

    businesses = biz_repo.get_all(
        id_categoria=id_categoria, page=1, size=1000
    )
    biz_ids = [b["id_emprendimiento"] for b in businesses["items"]]

    all_items = []
    total = 0
    for bid in biz_ids:
        result = prod_repo.get_by_business(bid, page=1, size=1000)
        for p in result["items"]:
            if p.get("estado_stock") == "agotado":
                continue
            if busqueda and busqueda.lower() not in (p.get("nombre") or "").lower():
                continue
            if precio_min is not None and (p.get("precio") or 0) < precio_min:
                continue
            if precio_max is not None and (p.get("precio") or 0) > precio_max:
                continue
            biz = next((b for b in businesses["items"] if b["id_emprendimiento"] == bid), None)
            all_items.append(ProductoPublicResponse(
                id_producto=p["id_producto"],
                nombre=p["nombre"],
                descripcion=p.get("descripcion"),
                precio=float(p["precio"]) if p.get("precio") else None,
                imagen_url=p.get("imagen_url"),
                stock=p.get("stock") or 0,
                estado_stock=p["estado_stock"],
                negocio=NegocioInfo(
                    id_emprendimiento=biz["id_emprendimiento"] if biz else bid,
                    nombre=biz["nombre"] if biz else "",
                    distrito=biz.get("distrito") if biz else None,
                ) if biz else None,
            ))
            total += 1

    offset = (page - 1) * size
    paged = all_items[offset:offset + size]
    return ProductoPublicListResponse(
        items=paged,
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size if total > 0 else 0,
    )


@router.get("/{id_producto}", response_model=ProductoPublicResponse)
def obtener_producto(id_producto: int, conn=Depends(get_db_conn)):
    """Obtiene un producto por ID buscando en todos los negocios aprobados."""
    biz_repo = BusinessRepository(conn)
    prod_repo = ProductRepository(conn)

    businesses = biz_repo.get_all(page=1, size=1000)
    for b in businesses["items"]:
        result = prod_repo.get_by_business(b["id_emprendimiento"], page=1, size=1000)
        for p in result["items"]:
            if p["id_producto"] == id_producto and p.get("activo", True):
                return ProductoPublicResponse(
                    id_producto=p["id_producto"],
                    nombre=p["nombre"],
                    descripcion=p.get("descripcion"),
                    precio=float(p["precio"]) if p.get("precio") else None,
                    imagen_url=p.get("imagen_url"),
                    estado_stock=p["estado_stock"],
                    stock=p.get("stock") or 0,
                    negocio=NegocioInfo(
                        id_emprendimiento=b["id_emprendimiento"],
                        nombre=b["nombre"],
                        distrito=b.get("distrito"),
                    ),
                )

    raise HTTPException(404, "Producto no encontrado")

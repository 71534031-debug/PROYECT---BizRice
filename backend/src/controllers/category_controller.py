from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional

from src.config.db import get_db
from src.models.category import Categoria
from src.models.business import Emprendimiento

router = APIRouter()

# ─── Schemas ───────────────────────────────────────────────────────────────

class CategoryResponse(BaseModel):
    id_categoria: int
    nombre: str
    descripcion: Optional[str] = None
    icono_url: Optional[str] = None
    total_negocios: int

    class Config:
        from_attributes = True

class CategoriesListResponse(BaseModel):
    items: list[CategoryResponse]

# ─── Endpoints ─────────────────────────────────────────────────────────────

@router.get("", response_model=CategoriesListResponse)
def listar_categorias(db: Session = Depends(get_db)):
    categorias = db.query(
        Categoria,
        func.count(Emprendimiento.id_emprendimiento).label("total_negocios")
    ).outerjoin(
        Emprendimiento,
        (Emprendimiento.id_categoria == Categoria.id_categoria) &
        (Emprendimiento.estado_verificacion == "aprobado")
    ).group_by(Categoria.id_categoria, Categoria.nombre, Categoria.descripcion, Categoria.icono_url).order_by(Categoria.nombre).all()

    items = [
        CategoryResponse(
            id_categoria=cat.id_categoria,
            nombre=cat.nombre,
            descripcion=cat.descripcion,
            icono_url=cat.icono_url,
            total_negocios=total
        )
        for cat, total in categorias
    ]

    return CategoriesListResponse(items=items)

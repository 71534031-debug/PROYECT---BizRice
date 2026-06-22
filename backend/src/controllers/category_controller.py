from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from src.config.db import get_db_conn
from src.repositories.base_repository import BaseRepository

router = APIRouter()


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


@router.get("", response_model=CategoriesListResponse)
def listar_categorias(conn=Depends(get_db_conn)):
    repo = BaseRepository(conn)
    sql = """SELECT c.id_categoria, c.nombre, c.descripcion, c.icono_url,
                    COUNT(e.id_emprendimiento) AS total_emprendimientos
             FROM Categorias c
             LEFT JOIN Emprendimientos e ON c.id_categoria = e.id_categoria AND e.estado_verificacion = 'aprobado'
             GROUP BY c.id_categoria, c.nombre, c.descripcion, c.icono_url
             ORDER BY c.nombre ASC"""
    rows = repo.execute_sp(sql)
    items = [
        CategoryResponse(
            id_categoria=r["id_categoria"],
            nombre=r["nombre"],
            descripcion=r.get("descripcion"),
            icono_url=r.get("icono_url"),
            total_negocios=r.get("total_emprendimientos", 0),
        )
        for r in rows
    ]
    return CategoriesListResponse(items=items)

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from pydantic import BaseModel, EmailStr
from typing import Optional

from src.config.db import get_db_conn
from src.repositories.user_repository import UserRepository
from src.controllers.auth_controller import get_current_user

router = APIRouter()


class UserResponse(BaseModel):
    id_usuario: int
    nombre: str
    apellido: str
    correo: str
    rol: str
    estado: str
    avatar_url: str | None = None
    fecha_registro: str | None = None


class UserUpdateSchema(BaseModel):
    nombre: str | None = None
    apellido: str | None = None
    correo: EmailStr | None = None
    avatar_url: str | None = None


class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    size: int
    pages: int


class MessageResponse(BaseModel):
    message: str


@router.get("", response_model=UserListResponse)
def listar_usuarios_publicos(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=50),
    rol: str | None = None,
    conn=Depends(get_db_conn),
):
    user_repo = UserRepository(conn)
    rows = user_repo.execute_sp("sp_GetAllUsers", {
        "page": page, "size": size, "rol": rol, "estado": "activo",
    })

    if not rows:
        return UserListResponse(items=[], total=0, page=page, size=size, pages=0)

    meta = rows[0]
    items = [
        UserResponse(
            id_usuario=r["id_usuario"],
            nombre=r["nombre"],
            apellido=r["apellido"],
            correo=r["correo"],
            rol=r["rol"],
            estado=r["estado"],
            avatar_url=r.get("avatar_url"),
            fecha_registro=str(r.get("fecha_registro")) if r.get("fecha_registro") else None,
        )
        for r in rows
    ]
    return UserListResponse(
        items=items, total=meta.get("total", 0),
        page=meta.get("page", page), size=meta.get("size", size),
        pages=meta.get("pages", 0),
    )


@router.get("/{id_usuario}", response_model=UserResponse)
def obtener_usuario(id_usuario: int, conn=Depends(get_db_conn)):
    user_repo = UserRepository(conn)
    user = user_repo.get_by_id(id_usuario)
    if not user or user.get("estado") != "activo":
        raise HTTPException(404, "Usuario no encontrado")
    return _serialize_user(user)


@router.put("/profile", response_model=MessageResponse)
def actualizar_perfil(
    data: UserUpdateSchema,
    authorization: str = Header(None),
    conn=Depends(get_db_conn),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token requerido")
    user = get_current_user(authorization.split(" ")[1], conn)

    user_repo = UserRepository(conn)
    updates = {}

    if data.nombre is not None:
        updates["nombre"] = data.nombre.strip()
    if data.apellido is not None:
        updates["apellido"] = data.apellido.strip()
    if data.correo is not None:
        existe = user_repo.get_by_email(data.correo)
        if existe and existe.get("id_usuario") != user["id_usuario"]:
            raise HTTPException(400, "Este correo ya está en uso")
        updates["correo"] = data.correo
    if data.avatar_url is not None:
        updates["avatar_url"] = data.avatar_url

    if updates:
        cursor = conn.cursor()
        set_clause = ", ".join(f"{k}=?" for k in updates.keys())
        cursor.execute(f"UPDATE Usuarios SET {set_clause} WHERE id_usuario=?", list(updates.values()) + [user["id_usuario"]])
        cursor.close()
        conn.commit()

    return MessageResponse(message="Perfil actualizado correctamente")


@router.delete("/{id_usuario}", response_model=MessageResponse)
def eliminar_usuario(
    id_usuario: int,
    authorization: str = Header(None),
    conn=Depends(get_db_conn),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token requerido")
    current_user = get_current_user(authorization.split(" ")[1], conn)

    if current_user.get("rol") != "administrador" and current_user.get("id_usuario") != id_usuario:
        raise HTTPException(403, "No tienes permiso para eliminar este usuario")

    user_repo = UserRepository(conn)
    user = user_repo.get_by_id(id_usuario)
    if not user:
        raise HTTPException(404, "Usuario no encontrado")

    user_repo.update_status(id_usuario, "inactivo")
    conn.commit()
    return MessageResponse(message="Usuario desactivado correctamente")


def _serialize_user(u: dict) -> UserResponse:
    return UserResponse(
        id_usuario=u["id_usuario"],
        nombre=u["nombre"],
        apellido=u["apellido"],
        correo=u["correo"],
        rol=u["rol"],
        estado=u["estado"],
        avatar_url=u.get("avatar_url"),
        fecha_registro=str(u.get("fecha_registro")) if u.get("fecha_registro") else None,
    )

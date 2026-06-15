from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator
import re

from src.config.db import get_db
from src.models.user import Usuario
from src.controllers.auth_controller import get_current_user, pwd_context

router = APIRouter()

# ─── Schemas ───────────────────────────────────────────────────────────────

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

# ─── Endpoints ─────────────────────────────────────────────────────────────

@router.get("", response_model=UserListResponse)
def listar_usuarios_publicos(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=50),
    rol: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Usuario).filter(Usuario.estado == "activo")
    if rol:
        query = query.filter(Usuario.rol == rol)

    total = query.count()
    items = query.order_by(Usuario.fecha_registro.desc())\
                 .offset((page - 1) * size).limit(size).all()

    return UserListResponse(
        items=[_serialize_user(u) for u in items],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size if total > 0 else 0
    )


@router.get("/{id_usuario}", response_model=UserResponse)
def obtener_usuario(id_usuario: int, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(
        Usuario.id_usuario == id_usuario,
        Usuario.estado == "activo"
    ).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    return _serialize_user(user)


@router.put("/profile", response_model=MessageResponse)
def actualizar_perfil(
    data: UserUpdateSchema,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token requerido")
    user = get_current_user(authorization.split(" ")[1], db)

    if data.nombre is not None:
        user.nombre = data.nombre.strip()
    if data.apellido is not None:
        user.apellido = data.apellido.strip()
    if data.correo is not None:
        existe = db.query(Usuario).filter(
            Usuario.correo == data.correo,
            Usuario.id_usuario != user.id_usuario
        ).first()
        if existe:
            raise HTTPException(400, "Este correo ya está en uso")
        user.correo = data.correo
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url

    db.commit()
    return MessageResponse(message="Perfil actualizado correctamente")


@router.delete("/{id_usuario}", response_model=MessageResponse)
def eliminar_usuario(
    id_usuario: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token requerido")
    current_user = get_current_user(authorization.split(" ")[1], db)

    if current_user.rol != "administrador" and current_user.id_usuario != id_usuario:
        raise HTTPException(403, "No tienes permiso para eliminar este usuario")

    user = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")

    user.estado = "inactivo"
    db.commit()
    return MessageResponse(message="Usuario desactivado correctamente")


def _serialize_user(u: Usuario) -> UserResponse:
    return UserResponse(
        id_usuario=u.id_usuario,
        nombre=u.nombre,
        apellido=u.apellido,
        correo=u.correo,
        rol=u.rol,
        estado=u.estado,
        avatar_url=u.avatar_url,
        fecha_registro=str(u.fecha_registro) if u.fecha_registro else None
    )

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
import re
import logging

from src.config.db import get_db_conn
from src.config.settings import settings
from src.config.limiter import limiter
from src.repositories.user_repository import UserRepository

logger = logging.getLogger(__name__)

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class RegisterSchema(BaseModel):
    nombre: str
    apellido: str
    correo: EmailStr
    contrasena: str
    confirmar_contrasena: str

    @field_validator('contrasena')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Mínimo 8 caracteres')
        if not re.search(r'\d', v):
            raise ValueError('Debe contener al menos un número')
        return v


class LoginSchema(BaseModel):
    correo: EmailStr
    contrasena: str


class RefreshSchema(BaseModel):
    refresh_token: str


def create_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    to_encode.update({"exp": now + expires_delta, "iat": now})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


def get_current_user(token: str, conn):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    repo = UserRepository(conn)
    user = repo.get_by_id(int(payload.get("sub", 0)))
    if not user or user.get("estado") != "activo":
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user


def require_role(role: str):
    """Retorna una función dependency que verifica el rol"""
    def check_role(authorization: str = Header(None), conn=Depends(get_db_conn)):
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(401, "Token requerido")
        user = get_current_user(authorization.split(" ")[1], conn)
        if user.get("rol") != role:
            raise HTTPException(403, f"Acceso solo para {role}s")
        return user
    return check_role


@router.post("/register", status_code=201)
@limiter.limit("3/minute")
def register(request: Request, data: RegisterSchema, conn=Depends(get_db_conn)):
    if data.contrasena != data.confirmar_contrasena:
        raise HTTPException(400, "Las contraseñas no coinciden")

    repo = UserRepository(conn)
    existe = repo.get_by_email(data.correo)
    if existe:
        raise HTTPException(400, "Este correo ya tiene una cuenta registrada")

    user = repo.create({
        "nombre": data.nombre.strip(),
        "apellido": data.apellido.strip(),
        "correo": data.correo,
        "contrasena_hash": pwd_context.hash(data.contrasena),
        "rol": "emprendedor",
    })
    conn.commit()
    logger.info(f"Registro exitoso: {data.correo} (id={user.get('id_usuario')})")
    return _token_response(user)


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, data: LoginSchema, conn=Depends(get_db_conn)):
    repo = UserRepository(conn)
    user = repo.get_by_email(data.correo)
    if not user or not pwd_context.verify(data.contrasena, user.get("contrasena_hash", "")):
        logger.warning(f"Login fallido para {data.correo}")
        raise HTTPException(401, "Correo o contraseña incorrectos")
    if user.get("estado") == "suspendido":
        logger.warning(f"Login de cuenta suspendida: {data.correo}")
        raise HTTPException(403, "Tu cuenta está suspendida. Contacta al administrador.")
    logger.info(f"Login exitoso: {data.correo} (rol={user['rol']})")
    return _token_response(user)


@router.post("/refresh")
def refresh_token(data: RefreshSchema):
    payload = verify_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(401, "Refresh token inválido")
    access = create_token(
        {"sub": payload["sub"], "rol": payload["rol"], "type": "access"},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access, "token_type": "bearer"}


@router.get("/me")
def get_me(authorization: str = Header(None), conn=Depends(get_db_conn)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token requerido")
    user = get_current_user(authorization.split(" ")[1], conn)
    return {
        "id_usuario": user["id_usuario"],
        "nombre": user["nombre"],
        "apellido": user["apellido"],
        "correo": user["correo"],
        "rol": user["rol"],
        "estado": user["estado"],
        "avatar_url": user.get("avatar_url"),
    }


def _token_response(user: dict) -> dict:
    data = {"sub": str(user["id_usuario"]), "rol": user["rol"]}
    return {
        "access_token": create_token(
            {**data, "type": "access"},
            timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        ),
        "refresh_token": create_token(
            {**data, "type": "refresh"},
            timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        ),
        "token_type": "bearer",
        "user": {
            "id_usuario": user["id_usuario"],
            "nombre": user["nombre"],
            "apellido": user["apellido"],
            "correo": user["correo"],
            "rol": user["rol"],
            "avatar_url": user.get("avatar_url"),
        },
    }

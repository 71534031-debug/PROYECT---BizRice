from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
import re

from src.config.db import get_db
from src.config.settings import settings
from src.models.user import Usuario

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ─── Schemas ───────────────────────────────────────────────────────────────

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

# ─── Helpers JWT ───────────────────────────────────────────────────────────

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

def get_current_user(token: str, db: Session) -> Usuario:
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    user = db.query(Usuario).filter(
        Usuario.id_usuario == int(payload.get("sub", 0)),
        Usuario.estado == "activo"
    ).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

# ─── Dependency para verificar roles ──────────────────────────────────────

def require_role(role: str):
    """Retorna una función dependency que verifica el rol"""
    def check_role(authorization: str = Header(None), db: Session = Depends(get_db)):
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(401, "Token requerido")
        user = get_current_user(authorization.split(" ")[1], db)
        if user.rol != role:
            raise HTTPException(403, f"Acceso solo para {role}s")
        return user
    return check_role

# ─── Endpoints ─────────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    if data.contrasena != data.confirmar_contrasena:
        raise HTTPException(400, "Las contraseñas no coinciden")
    if db.query(Usuario).filter(Usuario.correo == data.correo).first():
        raise HTTPException(400, "Este correo ya tiene una cuenta registrada")

    user = Usuario(
        nombre=data.nombre.strip(),
        apellido=data.apellido.strip(),
        correo=data.correo,
        contrasena_hash=pwd_context.hash(data.contrasena),
        rol="emprendedor"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_response(user)

@router.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.correo == data.correo).first()
    if not user or not pwd_context.verify(data.contrasena, user.contrasena_hash):
        raise HTTPException(401, "Correo o contraseña incorrectos")
    if user.estado == "suspendido":
        raise HTTPException(403, "Tu cuenta está suspendida. Contacta al administrador.")
    return _token_response(user)

@router.post("/refresh")
def refresh_token(data: RefreshSchema):
    payload = verify_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(401, "Refresh token inválido")
    access = create_token(
        {"sub": payload["sub"], "rol": payload["rol"], "type": "access"},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access, "token_type": "bearer"}

@router.get("/me")
def get_me(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token requerido")
    token = authorization.split(" ")[1]
    user = get_current_user(token, db)
    return {
        "id_usuario": user.id_usuario,
        "nombre": user.nombre,
        "apellido": user.apellido,
        "correo": user.correo,
        "rol": user.rol,
        "estado": user.estado,
        "avatar_url": user.avatar_url
    }

def _token_response(user: Usuario) -> dict:
    data = {"sub": str(user.id_usuario), "rol": user.rol}
    return {
        "access_token":  create_token({**data, "type": "access"},
                         timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)),
        "refresh_token": create_token({**data, "type": "refresh"},
                         timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)),
        "token_type": "bearer",
        "user": {
            "id_usuario": user.id_usuario,
            "nombre":     user.nombre,
            "apellido":   user.apellido,
            "correo":     user.correo,
            "rol":        user.rol,
            "avatar_url": user.avatar_url
        }
    }

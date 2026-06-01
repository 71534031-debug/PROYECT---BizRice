# BizRise — Controllers (Backend)

## Concepto
Cada controller es UN archivo Python que contiene:
1. El router FastAPI (APIRouter)
2. Todos los schemas Pydantic del módulo
3. Toda la lógica de negocio
4. Todas las queries SQLAlchemy

NO hay services/ separado. NO hay repositories/ separado.
TODO en el controller correspondiente.

---

## backend/main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from src.config.settings import settings
from src.config.db import engine, Base

# Importar todos los modelos para que SQLAlchemy los registre
from src.models import user, business, category, product, review, rating, promotion, social_network

# Importar controllers (routers)
from src.controllers import (
    auth_controller,
    business_controller,
    category_controller,
    entrepreneur_controller,
    admin_controller
)

app = FastAPI(
    title="BizRise API",
    version="1.0.0",
    description="Directorio de emprendedores locales de Huancayo"
)

# CORS — permite llamadas desde el frontend HTML abierto con Live Server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir imágenes subidas
os.makedirs("uploads/negocios",  exist_ok=True)
os.makedirs("uploads/productos", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Registrar routers
app.include_router(auth_controller.router,         prefix="/api/v1/auth",         tags=["Autenticación"])
app.include_router(category_controller.router,     prefix="/api/v1/categories",   tags=["Categorías"])
app.include_router(business_controller.router,     prefix="/api/v1/businesses",   tags=["Emprendimientos"])
app.include_router(entrepreneur_controller.router, prefix="/api/v1/entrepreneur", tags=["Panel Emprendedor"])
app.include_router(admin_controller.router,        prefix="/api/v1/admin",        tags=["Panel Administrador"])

@app.on_event("startup")
def startup():
    # Crear tablas en SQL Server si no existen
    Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": "BizRise API corriendo", "docs": "/docs"}
```

---

## backend/src/controllers/auth_controller.py

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime, timedelta
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
    to_encode.update({"exp": datetime.utcnow() + expires_delta})
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
        {"sub": payload["sub"], "rol": payload["rol"]},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access, "token_type": "bearer"}

@router.get("/me")
def get_me(authorization: str = None, db: Session = Depends(get_db)):
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
```

---

## Patrón de los demás controllers

Cada controller sigue este patrón:

```python
# src/controllers/NOMBRE_controller.py

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from src.config.db import get_db
from src.models.MODELO import ModeloSQLAlchemy
from src.controllers.auth_controller import get_current_user, verify_token

router = APIRouter()

# ─── Schemas Pydantic (en el mismo archivo) ───────────────
class CreateSchema(BaseModel):
    campo1: str
    campo2: Optional[str] = None

class UpdateSchema(BaseModel):
    campo1: Optional[str] = None

# ─── Helper para obtener usuario desde header ─────────────
def get_user_from_header(authorization: str, db: Session):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token requerido")
    return get_current_user(authorization.split(" ")[1], db)

# ─── Endpoints ────────────────────────────────────────────
@router.get("/")
def listar(db: Session = Depends(get_db)):
    items = db.query(ModeloSQLAlchemy).all()
    return {"items": items}

@router.post("/", status_code=201)
def crear(
    data: CreateSchema,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user = get_user_from_header(authorization, db)
    # lógica de negocio aquí
    nuevo = ModeloSQLAlchemy(**data.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo
```

---

## Dependency para verificar roles

```python
# Agregar en auth_controller.py para reutilizar en otros controllers

from fastapi import Header

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

# Uso en entrepreneur_controller.py:
# @router.get("/business")
# def get_my_business(current_user = Depends(require_role("emprendedor")), db = Depends(get_db)):
#     ...

# Uso en admin_controller.py:
# @router.get("/stats")
# def get_stats(current_user = Depends(require_role("administrador")), db = Depends(get_db)):
#     ...
```

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sys

from src.config.settings import settings
from src.config.db import engine, Base, SessionLocal

# Importar todos los modelos para que SQLAlchemy los registre
from src.models import user, business, category, product, review, rating, promotion, social_network, sale

# Importar controllers (routers)
from src.controllers import (
    auth_controller,
    business_controller,
    category_controller,
    entrepreneur_controller,
    admin_controller,
    sale_controller,
    product_controller,
    users_controller
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
app.include_router(product_controller.router,      prefix="/api/v1/products",     tags=["Productos"])
app.include_router(entrepreneur_controller.router, prefix="/api/v1/entrepreneur", tags=["Panel Emprendedor"])
app.include_router(admin_controller.router,        prefix="/api/v1/admin",        tags=["Panel Administrador"])
app.include_router(sale_controller.router,         prefix="/api/v1/sales",        tags=["Ventas"])
app.include_router(users_controller.router,        prefix="/api/v1/users",        tags=["Usuarios"])

def auto_seed():
    """Seed automático al iniciar — fuerza recarga si existe data parcial."""
    try:
        from seed_full import seed
        print("🌱 Ejecutando seed automático (fuerza recarga)...")
        seed(force=True)
        print("✅ Seed automático completado.")
    except Exception as e:
        print(f"⚠️  Seed automático omitido: {e}")

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    auto_seed()

@app.get("/")
def root():
    return {"message": "BizRise API corriendo", "docs": "/docs"}

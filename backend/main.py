import os
import sys
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from src.config.settings import settings
from src.config.limiter import limiter
from src.config.db import engine, Base, SessionLocal

from src.models import user, business, category, product, review, rating, promotion, social_network, sale

from src.controllers import (
    auth_controller, business_controller, category_controller,
    entrepreneur_controller, admin_controller, sale_controller,
    product_controller, users_controller
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response


app = FastAPI(
    title="BizRise API",
    version="1.0.0",
    description="Directorio de emprendedores locales de Huancayo",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info(f"CORS allowed origins: {settings.ORIGINS_LIST}")
app.add_middleware(SecurityHeadersMiddleware)

os.makedirs("uploads/negocios", exist_ok=True)
os.makedirs("uploads/productos", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth_controller.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(category_controller.router, prefix="/api/v1/categories", tags=["Categorías"])
app.include_router(business_controller.router, prefix="/api/v1/businesses", tags=["Emprendimientos"])
app.include_router(product_controller.router, prefix="/api/v1/products", tags=["Productos"])
app.include_router(entrepreneur_controller.router, prefix="/api/v1/entrepreneur", tags=["Panel Emprendedor"])
app.include_router(admin_controller.router, prefix="/api/v1/admin", tags=["Panel Administrador"])
app.include_router(sale_controller.router, prefix="/api/v1/sales", tags=["Ventas"])
app.include_router(users_controller.router, prefix="/api/v1/users", tags=["Usuarios"])


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Error no manejado en {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor. Intenta nuevamente en unos minutos."},
    )


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db_sanitized = settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else settings.DATABASE_URL
    logger.info(f"Conectado a PostgreSQL: {db_sanitized}")
    logger.info(f"Tablas creadas/verificadas en PostgreSQL")


@app.get("/")
def root():
    return {"message": "BizRise API corriendo", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok", "app": "BizRise API"}

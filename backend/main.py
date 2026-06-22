import os
import sys
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from src.config.settings import settings
from src.config.limiter import limiter
from src.config.db import engine, Base, connection_pool

from src.models import user, business, category, product, review, rating, promotion, social_network, sale

from src.controllers import (
    auth_controller, business_controller, category_controller,
    entrepreneur_controller, admin_controller, sale_controller,
    product_controller, users_controller
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


class CORSSecureMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return Response(status_code=200, headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Max-Age": "86400",
            })
        try:
            response = await call_next(request)
        except Exception as exc:
            logger.error(f"Error no manejado en {request.url.path}: {exc}")
            response = JSONResponse(
                status_code=500,
                content={"detail": "Error interno del servidor."},
            )
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
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

app.add_middleware(CORSSecureMiddleware)
logger.info("CORS: permitiendo todos los orígenes")

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


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db_sanitized = settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else settings.DATABASE_URL
    logger.info(f"Conectado a PostgreSQL: {db_sanitized}")
    logger.info(f"Tablas creadas/verificadas en PostgreSQL")

    try:
        conn = connection_pool.getconn()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM Emprendimientos")
        count = cursor.fetchone()[0]
        cursor.close()
        connection_pool.putconn(conn)
        if count == 0:
            logger.info("BD vacía — ejecutando seed automático...")
            seed_path = os.path.join(os.path.dirname(__file__), "src", "database", "neon_seeds.sql")
            with open(seed_path, "r", encoding="utf-8") as f:
                sql = f.read()
            conn2 = connection_pool.getconn()
            try:
                cur = conn2.cursor()
                cur.execute(sql)
                conn2.commit()
                cur.close()
                logger.info("Seed automático completado exitosamente")
            except Exception as e:
                conn2.rollback()
                logger.warning(f"Seed automático falló (BD ya puede tener datos parciales): {e}")
            finally:
                connection_pool.putconn(conn2)
        else:
            logger.info(f"BD ya tiene datos ({count} emprendimientos) — saltando seed")
    except Exception as e:
        logger.warning(f"No se pudo verificar/seed la BD: {e}")


@app.get("/")
def root():
    return {"message": "BizRise API corriendo", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok", "app": "BizRise API"}

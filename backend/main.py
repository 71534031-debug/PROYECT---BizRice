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


def _run_seed():
    conn = connection_pool.getconn()
    try:
        cur = conn.cursor()

        # Categorías
        categorias = [
            (1, 'Gastronomía', 'Restaurantes, cafeterías y comida típica'),
            (2, 'Textilería y Moda', 'Ropa, telas, confecciones y accesorios'),
            (3, 'Artesanía', 'Productos artesanales y arte tradicional'),
            (4, 'Servicios', 'Servicios profesionales y personales'),
            (5, 'Turismo', 'Agencias y experiencias turísticas'),
            (6, 'Tecnología', 'Soluciones digitales y desarrollo'),
            (7, 'Belleza', 'Cuidado personal, estética y cosmética'),
            (8, 'Agricultura', 'Productos agrícolas y derivados'),
            (9, 'Hogar', 'Decoración, muebles y artículos para el hogar'),
        ]
        for c in categorias:
            cur.execute("""INSERT INTO Categorias (id_categoria, nombre, descripcion)
                           VALUES (%s, %s, %s) ON CONFLICT (id_categoria) DO NOTHING""", c)

        # Usuarios
        usuarios = [
            ('Admin', 'BizRise', 'admin@bizrise.pe', '$2b$12$OhIry1VsJ6IMSi2g13Rx1.Caq4g0JX.c2Egwn4h.d7sYfR0Lo27KG', 'administrador'),
            ('Pedro', 'Huamán', 'emprendedor@bizrise.pe', '$2b$12$06vPY4xP.Jhak93JWMztOeP2GWZAFpxb/R98KzF5DSmjPgfHfx8wC', 'emprendedor'),
            ('Lucía', 'Mendoza', 'cliente@bizrise.pe', '$2b$12$my8GvV2aU0UckjJNcsHu.eOItrGJaa9Qdtaz0m20GDgNVbZIhouZ2', 'visitante'),
            ('Marco Antonio', 'Solís Ríos', 'marco.solis@email.com', '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
            ('Elena', 'Poma Villanueva', 'elena.poma@email.com', '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
            ('Juan Carlos', 'Huamán Torre', 'juan.huaman@email.com', '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
            ('Roberto', 'Quispe Malpartida', 'roberto.quispe@email.com', '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
            ('Carmen Rosa', 'Lazo Flores', 'carmen.lazo@email.com', '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
            ('Diego', 'Ramos Apolinario', 'diego.ramos@email.com', '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
            ('Silvia', 'Castro Ore', 'silvia.castro@email.com', '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
            ('Miguel Ángel', 'Torres Vega', 'miguel.torres@email.com', '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
            ('Ana María', 'Benites Cano', 'ana.benites@email.com', '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
            ('Pedro Pablo', 'García Ruiz', 'pedro.garcia@email.com', '$2b$12$QaKYPmSc6X3i4AYxASXlpuidCD6TfYWkHk2Jys7uIvXIlDmjxsjzq', 'emprendedor'),
        ]
        for u in usuarios:
            cur.execute("""INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol)
                           VALUES (%s, %s, %s, %s, %s) ON CONFLICT (correo) DO NOTHING""", u)

        conn.commit()

        # Obtener IDs
        cur.execute("SELECT id_usuario FROM Usuarios WHERE correo = 'marco.solis@email.com'")
        uid_marco = cur.fetchone()[0]
        cur.execute("SELECT id_usuario FROM Usuarios WHERE correo = 'elena.poma@email.com'")
        uid_elena = cur.fetchone()[0]
        cur.execute("SELECT id_usuario FROM Usuarios WHERE correo = 'juan.huaman@email.com'")
        uid_juan = cur.fetchone()[0]
        cur.execute("SELECT id_usuario FROM Usuarios WHERE correo = 'roberto.quispe@email.com'")
        uid_roberto = cur.fetchone()[0]
        cur.execute("SELECT id_usuario FROM Usuarios WHERE correo = 'carmen.lazo@email.com'")
        uid_carmen = cur.fetchone()[0]
        cur.execute("SELECT id_usuario FROM Usuarios WHERE correo = 'diego.ramos@email.com'")
        uid_diego = cur.fetchone()[0]
        cur.execute("SELECT id_usuario FROM Usuarios WHERE correo = 'silvia.castro@email.com'")
        uid_silvia = cur.fetchone()[0]
        cur.execute("SELECT id_usuario FROM Usuarios WHERE correo = 'miguel.torres@email.com'")
        uid_miguel = cur.fetchone()[0]
        cur.execute("SELECT id_usuario FROM Usuarios WHERE correo = 'ana.benites@email.com'")
        uid_ana = cur.fetchone()[0]
        cur.execute("SELECT id_usuario FROM Usuarios WHERE correo = 'pedro.garcia@email.com'")
        uid_pedro = cur.fetchone()[0]

        # Emprendimientos
        img_base = 'https://placehold.co/800x500/6f42c1/ffffff'
        emprendimientos = [
            (uid_marco, 1, 'Café Central Huancayo', 'Cafetería especializada en granos de altura del Valle del Mantaro.', '964123456', 'Calle Real 450', 'Huancayo', '08:00', '21:00', f'{img_base}?text=Cafe+Central+Huancayo'),
            (uid_elena, 2, 'Textiles Mantaro', 'Confecciones artesanales con lana de alpaca seleccionada.', '964234567', 'Jr. Loreto 234', 'El Tambo', None, None, f'{img_base}?text=Textiles+Mantaro'),
            (uid_juan, 3, 'Artesanías del Valle', 'Arte tradicional del Valle del Mantaro. Piezas únicas hechas a mano.', '964345678', 'Av. Ferrocarril 567', 'Chilca', None, None, f'{img_base}?text=Artesanias+del+Valle'),
            (uid_pedro, 1, 'Restaurante El Mirador', 'Tradición y modernidad en cada plato. La mejor vista del Valle.', '964456789', 'Jr. Ayacucho 123', 'Huancayo', '12:00', '22:00', f'{img_base}?text=Restaurante+El+Mirador'),
            (uid_roberto, 6, 'TechSolutions Huancayo', 'Desarrollo web, apps móviles y soporte técnico para empresas locales.', '964567890', 'Av. Giráldez 890', 'El Tambo', None, None, f'{img_base}?text=TechSolutions+Huancayo'),
            (uid_carmen, 5, 'Turismo Aventura Junín', 'Tours por Huancaya, Nor Yauyos, Reserva de Junín.', '964678901', 'Calle Piura 456', 'Huancayo', None, None, f'{img_base}?text=Turismo+Aventura+Junin'),
            (uid_diego, 1, 'Panadería San Agustín', 'Pan artesanal horneado cada mañana con recetas tradicionales.', '964789012', 'Jr. Puno 789', 'San Agustín', '06:00', '20:00', f'{img_base}?text=Panaderia+San+Agustin'),
            (uid_silvia, 4, 'Estudio Contable Castro', 'Servicios contables, tributarios y laborales para MYPES.', '964890123', 'Av. Huancavelica 234', 'Huancayo', None, None, f'{img_base}?text=Estudio+Contable+Castro'),
            (uid_miguel, 4, 'Vivero Los Andes', 'Plantas ornamentales, frutales y medicinales. Jardinería.', '964901234', 'Carretera Central Km 5', 'Pilcomayo', None, None, f'{img_base}?text=Vivero+Los+Andes'),
            (uid_ana, 2, 'Moda Andina Boutique', 'Ropa con diseños andinos contemporáneos para la mujer moderna.', '964012345', 'Jr. Lima 567', 'Huancayo', None, None, f'{img_base}?text=Moda+Andina+Boutique'),
        ]
        biz_ids = []
        for e in emprendimientos:
            uid, cid, nom, desc, tel, dir_, dist, ha, hc, img = e
            cur.execute("""INSERT INTO Emprendimientos (id_usuario, id_categoria, nombre, descripcion, telefono, direccion, distrito, horario_apertura, horario_cierre, estado_verificacion, imagen_portada_url)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s::time, %s::time, 'aprobado', %s)
                           RETURNING id_emprendimiento""", e)
            biz_ids.append(cur.fetchone()[0])

        conn.commit()

        # Productos por negocio (con imágenes placeholder)
        pimg = 'https://placehold.co/400x400/eeeeee/6f42c1'
        productos = [
            (biz_ids[0], 'Latte de la Casa', 'Café latte con leche vaporizada', 12.00, 50, 'disponible', f'{pimg}?text=Latte'),
            (biz_ids[0], 'Tostado Especial', 'Café tostado artesanal 250g', 16.50, 30, 'disponible', f'{pimg}?text=Tostado'),
            (biz_ids[0], 'Cheesecake de Maracuyá', 'Porción de cheesecake', 8.00, 20, 'disponible', f'{pimg}?text=Cheesecake'),
            (biz_ids[1], 'Manta Huancaína Premium', 'Manta artesanal de alpaca premium', 120.00, 15, 'bajo_stock', f'{pimg}?text=Manta'),
            (biz_ids[1], 'Chalina de Alpaca', 'Chalina suave de alpaca', 65.00, 25, 'disponible', f'{pimg}?text=Chalina'),
            (biz_ids[1], 'Guantes Artesanales', 'Guantes tejidos a mano', 35.00, 40, 'disponible', f'{pimg}?text=Guantes'),
            (biz_ids[2], 'Mate Burilado Grande', 'Mate burilado tamaño grande', 85.00, 10, 'bajo_stock', f'{pimg}?text=Mate+Burilado'),
            (biz_ids[2], 'Retablo Ayacuchano', 'Retablo artesanal tradicional', 150.00, 5, 'bajo_stock', f'{pimg}?text=Retablo'),
            (biz_ids[2], 'Cerámica Decorativa', 'Cerámica pintada a mano', 45.00, 20, 'disponible', f'{pimg}?text=Ceramica'),
            (biz_ids[3], 'Pachamanca Familiar', 'Pachamanca para 4 personas', 85.00, 10, 'disponible', f'{pimg}?text=Pachamanca'),
            (biz_ids[3], 'Trucha al Vapor', 'Trucha fresca del Mantaro', 35.00, 20, 'disponible', f'{pimg}?text=Trucha'),
            (biz_ids[3], 'Caldo de Gallina', 'Caldo de gallina de corral', 18.00, 30, 'disponible', f'{pimg}?text=Caldo+Gallina'),
            (biz_ids[4], 'Diseño Web', 'Desarrollo web responsive', 800.00, 999, 'disponible', f'{pimg}?text=Diseno+Web'),
            (biz_ids[4], 'App Móvil', 'Desarrollo de aplicación móvil', 2500.00, 999, 'disponible', f'{pimg}?text=App+Movil'),
            (biz_ids[5], 'Tour Huancaya 2 días', 'Tour completo 2d/1n', 250.00, 50, 'disponible', f'{pimg}?text=Tour+Huancaya'),
            (biz_ids[5], 'City Tour Huancayo', 'City Tour medio día', 45.00, 100, 'disponible', f'{pimg}?text=City+Tour'),
            (biz_ids[5], 'Tour Reserva Junín', 'Tour Reserva Nacional', 180.00, 50, 'disponible', f'{pimg}?text=Reserva+Junin'),
            (biz_ids[6], 'Pan de Masa Madre', 'Pan artesanal 500g', 4.00, 100, 'disponible', f'{pimg}?text=Pan+Masa+Madre'),
            (biz_ids[6], 'Torta de Zanahoria', 'Torta con glaseado', 25.00, 15, 'bajo_stock', f'{pimg}?text=Torta'),
            (biz_ids[6], 'Empanadas', 'Empanadas de horno surtidas', 3.00, 80, 'disponible', f'{pimg}?text=Empanadas'),
            (biz_ids[7], 'Contabilidad Mensual', 'Servicio contable mensual', 200.00, 999, 'disponible', f'{pimg}?text=Contabilidad'),
            (biz_ids[7], 'Declaración Anual', 'Declaración anual', 350.00, 999, 'disponible', f'{pimg}?text=DT+Anual'),
            (biz_ids[7], 'Planillas', 'Gestión planillas mensuales', 150.00, 999, 'disponible', f'{pimg}?text=Planillas'),
            (biz_ids[8], 'Planta Ornamental', 'Planta en maceta', 15.00, 200, 'disponible', f'{pimg}?text=Planta'),
            (biz_ids[8], 'Frutal Injertado', 'Árbol frutal injertado', 35.00, 50, 'disponible', f'{pimg}?text=Frutal'),
            (biz_ids[8], 'Servicio Jardinería', 'Jardinería completo', 120.00, 999, 'disponible', f'{pimg}?text=Jardineria'),
            (biz_ids[9], 'Vestido Andino', 'Vestido con diseños andinos', 180.00, 10, 'bajo_stock', f'{pimg}?text=Vestido+Andino'),
            (biz_ids[9], 'Cartera Artesanal', 'Cartera tejida a mano', 95.00, 15, 'disponible', f'{pimg}?text=Cartera'),
            (biz_ids[9], 'Blusa Bordada', 'Blusa con bordados tradicionales', 75.00, 20, 'disponible', f'{pimg}?text=Blusa'),
        ]
        for p in productos:
            cur.execute("""INSERT INTO Productos (id_emprendimiento, nombre, descripcion, precio, stock, estado_stock, imagen_url)
                           VALUES (%s, %s, %s, %s, %s, %s, %s)""", p)

        # Promociones
        cur.execute("""INSERT INTO Promociones (id_emprendimiento, titulo, descripcion, fecha_inicio, fecha_fin, estado)
                       VALUES (%s, %s, %s, CURRENT_DATE, CURRENT_DATE + 90, 'activa')""",
                    (biz_ids[0], '2x1 en Americanos los martes', 'Todos los martes, 2x1 en Americanos'))
        cur.execute("""INSERT INTO Promociones (id_emprendimiento, titulo, descripcion, fecha_inicio, fecha_fin, estado)
                       VALUES (%s, %s, %s, CURRENT_DATE, CURRENT_DATE + 60, 'activa')""",
                    (biz_ids[1], '20% dscto en mantas', 'Descuento especial en mantas huancaínas'))

        conn.commit()

        # Clientes para reseñas
        cur.execute("SELECT id_usuario FROM Usuarios WHERE rol = 'visitante' ORDER BY id_usuario LIMIT 10")
        clientes = [r[0] for r in cur.fetchall()]

        reseñas = [
            (clientes[0], biz_ids[0], 'Excelente café, el ambiente es muy acogedor.', 5),
            (clientes[1], biz_ids[0], 'Buen café, pero el servicio puede mejorar.', 4),
            (clientes[2], biz_ids[0], 'Los precios son razonables y la atención es buena.', 4),
            (clientes[3], biz_ids[0], 'Me encanta el latte de la casa.', 5),
            (clientes[0], biz_ids[1], 'Las chalinas son de muy buena calidad.', 4),
            (clientes[1], biz_ids[1], 'Hermosos textiles, la lana es suave y cálida.', 5),
            (clientes[4], biz_ids[1], 'Buenos productos, pero precios elevados.', 3),
            (clientes[0], biz_ids[2], 'Piezas únicas, el retablo es una obra de arte.', 5),
            (clientes[2], biz_ids[2], 'Artesanía de primera calidad, muy recomendado.', 4),
            (clientes[5], biz_ids[2], 'Los mates burilados son hermosos.', 5),
            (clientes[3], biz_ids[3], 'La pachamanca es deliciosa, la vista increíble.', 5),
            (clientes[6], biz_ids[3], 'Buena atención, la trucha al vapor es mi favorito.', 4),
            (clientes[1], biz_ids[3], 'El caldo de gallina es como el de mi abuela.', 5),
            (clientes[4], biz_ids[4], 'Excelente servicio de desarrollo web.', 5),
            (clientes[7], biz_ids[4], 'Buen soporte técnico, responden rápido.', 4),
            (clientes[5], biz_ids[5], 'El tour a Huancaya fue increíble.', 5),
            (clientes[8], biz_ids[5], 'Guías muy conocedores, aprendí mucho.', 4),
            (clientes[0], biz_ids[5], 'City tour muy completo.', 4),
            (clientes[6], biz_ids[6], 'El pan de masa madre es el mejor.', 5),
            (clientes[3], biz_ids[6], 'Las empanadas son deliciosas.', 4),
            (clientes[7], biz_ids[7], 'Asesoría contable muy clara y profesional.', 5),
            (clientes[4], biz_ids[7], 'Buen servicio contable, precios justos.', 4),
            (clientes[1], biz_ids[7], 'Me resolvieron todas mis dudas tributarias.', 5),
            (clientes[8], biz_ids[8], 'Las plantas son de excelente calidad.', 4),
            (clientes[5], biz_ids[8], 'Compré un frutal injertado, creció hermoso.', 5),
            (clientes[9], biz_ids[9], 'El vestido andino es hermoso, gran calidad.', 5),
            (clientes[6], biz_ids[9], 'Diseños únicos, fusión de tradición y moda.', 5),
            (clientes[3], biz_ids[9], 'La cartera artesanal es preciosa.', 5),
        ]
        for r in reseñas:
            cli_id, biz_id, contenido, punt = r
            cur.execute("""INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido)
                           VALUES (%s, %s, %s)""", (cli_id, biz_id, contenido))
            cur.execute("""INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion)
                           VALUES (%s, %s, %s) ON CONFLICT DO NOTHING""", (cli_id, biz_id, punt))

        conn.commit()
        cur.close()
        logger.info("Seed automático completado exitosamente")
    except Exception as e:
        conn.rollback()
        logger.warning(f"Seed automático falló: {e}")
        import traceback
        logger.warning(traceback.format_exc())
    finally:
        connection_pool.putconn(conn)


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
            _run_seed()
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

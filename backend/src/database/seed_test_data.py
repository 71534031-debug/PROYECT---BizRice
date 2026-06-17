"""
BIZRISE — Seed de datos de prueba
==================================
Inserta 1 admin, 10 emprendedores con negocio/productos/promos,
10 clientes y reseñas usando repositories + bcrypt.

Ejecutar desde backend/:
    python src/database/seed_test_data.py
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import pyodbc
from passlib.hash import bcrypt
from datetime import date, timedelta
from src.config.settings import settings
from src.repositories import UserRepository, BusinessRepository, ProductRepository, PromotionRepository, ReviewRepository


def get_conn():
    driver = settings.DB_DRIVER
    conn_str = (
        f"DRIVER={{{driver}}};"
        f"SERVER={settings.DB_SERVER};"
        f"DATABASE={settings.DB_NAME};"
        f"UID={settings.DB_USER};"
        f"PWD={settings.DB_PASSWORD}"
    )
    return pyodbc.connect(conn_str, autocommit=True)


def seed():
    conn = get_conn()
    user_repo = UserRepository(conn)
    biz_repo = BusinessRepository(conn)
    prod_repo = ProductRepository(conn)
    promo_repo = PromotionRepository(conn)
    review_repo = ReviewRepository(conn)

    ADMIN_HASH = bcrypt.hash("Admin123!")
    USER_HASH = bcrypt.hash("Pass123!")

    cursor = conn.cursor()
    cursor.execute("SELECT id_categoria, nombre FROM Categorias")
    cat_map = {}
    for row in cursor.fetchall():
        cat_map[str(row[1])] = int(row[0])
    cursor.close()

    def cat_id(name):
        cid = cat_map.get(name)
        if not cid:
            raise ValueError(f"Categoria '{name}' no encontrada en BD")
        return cid

    created_users = 0
    created_businesses = 0
    created_products = 0
    created_promos = 0
    created_reviews = 0

    # ── 1. Verificar / Crear Administrador ──────────────────────────────
    admin = user_repo.get_by_email("admin@bizrise.pe")
    if not admin:
        user_repo.create({
            "nombre": "Admin",
            "apellido": "BizRise",
            "correo": "admin@bizrise.pe",
            "contrasena_hash": ADMIN_HASH,
            "rol": "administrador"
        })
        admin = user_repo.get_by_email("admin@bizrise.pe")
        created_users += 1
        print("  OK Admin creado (admin@bizrise.pe / Admin123!)")

    # ── 2. Emprendedores ────────────────────────────────────────────────
    emprendedores = [
        {
            "nombre": "Marco Antonio", "apellido": "Solís Ríos",
            "correo": "marco.solis@email.com",
            "negocio": {
                "nombre": "Café Central Huancayo",
                "categoria_nombre": "Gastronomía",
                "descripcion": "Cafetería especializada en granos de altura del Valle del Mantaro. Ambiente acogedor para trabajar y reunirse.",
                "telefono": "964123456",
                "distrito": "Huancayo",
                "direccion": "Calle Real 450",
                "horario_apertura": "08:00",
                "horario_cierre": "21:00"
            },
            "productos": [
                ("Latte de la Casa", "Café latte con leche vaporizada", 12.00, 50),
                ("Tostado Especial", "Café tostado artesanal 250g", 16.50, 30),
                ("Cheesecake de Maracuyá", "Porción de cheesecake con maracuyá", 8.00, 20),
            ],
            "promos": [
                ("2x1 en Americanos los martes", "Todos los martes, 2x1 en Americanos", "activa", 90),
            ]
        },
        {
            "nombre": "Elena", "apellido": "Poma Villanueva",
            "correo": "elena.poma@email.com",
            "negocio": {
                "nombre": "Textiles Mantaro",
                "categoria_nombre": "Textilería y Moda",
                "descripcion": "Confecciones artesanales con lana de alpaca seleccionada de la región Junín. Diseños tradicionales modernizados.",
                "telefono": "964234567",
                "distrito": "El Tambo",
                "direccion": "Jr. Loreto 234",
            },
            "productos": [
                ("Manta Huancaína Premium", "Manta artesanal de lana de alpaca premium", 120.00, 15),
                ("Chalina de Alpaca", "Chalina suave de alpaca", 65.00, 25),
                ("Guantes Artesanales", "Guantes tejidos a mano", 35.00, 40),
            ],
            "promos": [
                ("20% de descuento en mantas", "Descuento especial en mantas huancaínas", "activa", 60),
            ]
        },
        {
            "nombre": "Juan Carlos", "apellido": "Huamán Torre",
            "correo": "juan.huaman@email.com",
            "negocio": {
                "nombre": "Artesanías del Valle",
                "categoria_nombre": "Artesanía",
                "descripcion": "Arte tradicional del Valle del Mantaro. Piezas únicas hechas a mano representando la cultura Wanka.",
                "telefono": "964345678",
                "distrito": "Chilca",
                "direccion": "Av. Ferrocarril 567",
            },
            "productos": [
                ("Mate Burilado Grande", "Mate burilado hecho a mano tamaño grande", 85.00, 10),
                ("Retablo Ayacuchano", "Retablo artesanal tradicional", 150.00, 5),
                ("Cerámica Decorativa", "Cerámica pintada a mano", 45.00, 20),
            ],
            "promos": []
        },
        {
            "nombre": "Lucía", "apellido": "Mendoza Carhuas",
            "correo": "lucia.mendoza@email.com",
            "negocio": {
                "nombre": "Restaurante El Mirador",
                "categoria_nombre": "Gastronomía",
                "descripcion": "Tradición y modernidad en cada plato. La mejor vista del Valle del Mantaro con sabores auténticos de Junín.",
                "telefono": "964456789",
                "distrito": "Huancayo",
                "direccion": "Jr. Ayacucho 123",
                "horario_apertura": "12:00",
                "horario_cierre": "22:00"
            },
            "productos": [
                ("Pachamanca Familiar", "Pachamanca para 4 personas", 85.00, 10),
                ("Trucha al Vapor", "Trucha fresca del Mantaro al vapor", 35.00, 20),
                ("Caldo de Gallina", "Caldo de gallina de corral", 18.00, 30),
                ("Chicha Morada", "Chicha morada artesanal 1L", 5.00, 50),
            ],
            "promos": []
        },
        {
            "nombre": "Roberto", "apellido": "Quispe Malpartida",
            "correo": "roberto.quispe@email.com",
            "negocio": {
                "nombre": "TechSolutions Huancayo",
                "categoria_nombre": "Tecnología",
                "descripcion": "Desarrollo web, aplicaciones móviles y soporte técnico para empresas locales. Soluciones digitales a medida.",
                "telefono": "964567890",
                "distrito": "El Tambo",
                "direccion": "Av. Giráldez 890",
            },
            "productos": [
                ("Diseño Web", "Diseño y desarrollo web responsive", 800.00, 999),
                ("App Móvil", "Desarrollo de aplicación móvil", 2500.00, 999),
                ("Soporte Mensual", "Soporte técnico mensual", 150.00, 999),
            ],
            "promos": []
        },
        {
            "nombre": "Carmen Rosa", "apellido": "Lazo Flores",
            "correo": "carmen.lazo@email.com",
            "negocio": {
                "nombre": "Turismo Aventura Junín",
                "categoria_nombre": "Turismo",
                "descripcion": "Tours por los atractivos de Junín: Huancaya, Nor Yauyos, Reserva de Junín. Guías certificados y transporte incluido.",
                "telefono": "964678901",
                "distrito": "Huancayo",
                "direccion": "Calle Piura 456",
            },
            "productos": [
                ("Tour Huancaya 2 días", "Tour completo a Huancaya 2 días/1 noche", 250.00, 50),
                ("City Tour Huancayo", "City Tour por Huancayo medio día", 45.00, 100),
                ("Tour Reserva de Junín", "Tour a la Reserva Nacional de Junín", 180.00, 50),
            ],
            "promos": []
        },
        {
            "nombre": "Diego", "apellido": "Ramos Apolinario",
            "correo": "diego.ramos@email.com",
            "negocio": {
                "nombre": "Panadería San Agustín",
                "categoria_nombre": "Gastronomía",
                "descripcion": "Pan artesanal horneado cada mañana con recetas tradicionales de Huancayo. Masa madre y granos locales.",
                "telefono": "964789012",
                "distrito": "San Agustín",
                "direccion": "Jr. Puno 789",
                "horario_apertura": "06:00",
                "horario_cierre": "20:00"
            },
            "productos": [
                ("Pan de Masa Madre", "Pan artesanal de masa madre 500g", 4.00, 100),
                ("Torta de Zanahoria", "Torta de zanahoria con glaseado", 25.00, 15),
                ("Empanadas", "Empanadas de horno surtidas", 3.00, 80),
            ],
            "promos": []
        },
        {
            "nombre": "Silvia", "apellido": "Castro Ore",
            "correo": "silvia.castro@email.com",
            "negocio": {
                "nombre": "Estudio Contable Castro",
                "categoria_nombre": "Servicios",
                "descripcion": "Servicios contables, tributarios y laborales para MYPES y emprendedores de Huancayo. Asesoría personalizada.",
                "telefono": "964890123",
                "distrito": "Huancayo",
                "direccion": "Av. Huancavelica 234",
            },
            "productos": [
                ("Contabilidad Mensual", "Servicio de contabilidad mensual", 200.00, 999),
                ("Declaración Anual", "Declaración anual de impuestos", 350.00, 999),
                ("Planillas", "Gestión de planillas mensuales", 150.00, 999),
            ],
            "promos": []
        },
        {
            "nombre": "Miguel Ángel", "apellido": "Torres Vega",
            "correo": "miguel.torres@email.com",
            "negocio": {
                "nombre": "Vivero Los Andes",
                "categoria_nombre": "Servicios",
                "descripcion": "Plantas ornamentales, frutales y medicinales del centro del Perú. Servicio de jardinería y paisajismo.",
                "telefono": "964901234",
                "distrito": "Pilcomayo",
                "direccion": "Carretera Central Km 5",
            },
            "productos": [
                ("Planta Ornamental", "Planta ornamental en maceta", 15.00, 200),
                ("Frutal Injertado", "Árbol frutal injertado", 35.00, 50),
                ("Servicio Jardinería", "Servicio de jardinería completo", 120.00, 999),
            ],
            "promos": []
        },
        {
            "nombre": "Ana María", "apellido": "Benites Cano",
            "correo": "ana.benites@email.com",
            "negocio": {
                "nombre": "Moda Andina Boutique",
                "categoria_nombre": "Textilería y Moda",
                "descripcion": "Ropa y accesorios con diseños andinos contemporáneos. Fusión de tradición y tendencia para la mujer moderna.",
                "telefono": "964012345",
                "distrito": "Huancayo",
                "direccion": "Jr. Lima 567",
            },
            "productos": [
                ("Vestido Andino", "Vestido con diseños andinos contemporáneos", 180.00, 10),
                ("Cartera Artesanal", "Cartera tejida a mano", 95.00, 15),
                ("Blusa Bordada", "Blusa con bordados tradicionales", 75.00, 20),
            ],
            "promos": []
        },
    ]

    # ── 3. Clientes ─────────────────────────────────────────────────────
    clientes = [
        ("Ricardo", "Mendoza Alanya", "cliente1@email.com"),
        ("Patricia", "Flores Romero", "cliente2@email.com"),
        ("José Luis", "Paredes Vega", "cliente3@email.com"),
        ("María Elena", "Quispe Torres", "cliente4@email.com"),
        ("Carlos Andrés", "Ramos Soto", "cliente5@email.com"),
        ("Sofía Valentina", "Cruz Mendoza", "cliente6@email.com"),
        ("Fernando Alexis", "Huamán Ríos", "cliente7@email.com"),
        ("Gabriela Lucía", "Poma Vargas", "cliente8@email.com"),
        ("Andrés Felipe", "Lazo Carhuas", "cliente9@email.com"),
        ("Daniela Rosaura", "Torres Ore", "cliente10@email.com"),
    ]

    # ── 4. Reseñas ──────────────────────────────────────────────────────
    reseñas_pool = [
        (1, 1, "Excelente café, el ambiente es muy acogedor. Ideal para trabajar.", 5),
        (2, 1, "Buen café, pero el servicio puede mejorar los fines de semana.", 4),
        (3, 1, "Los precios son razonables y la atención es buena.", 4),
        (4, 1, "Me encanta el latte de la casa, muy recomendado.", 5),
        (1, 2, "Las chalinas son de muy buena calidad, compré una para regalo.", 4),
        (2, 2, "Hermosos textiles, la lana de alpaca es suave y cálida.", 5),
        (5, 2, "Buenos productos, pero los precios son un poco elevados.", 3),
        (1, 3, "Piezas únicas, el retablo que compré es una obra de arte.", 5),
        (3, 3, "Artesanía de primera calidad, muy recomendado.", 4),
        (6, 3, "Los mates burilados son hermosos, volveré por más.", 5),
        (4, 4, "La pachamanca es deliciosa, la vista del local es increíble.", 5),
        (7, 4, "Buena atención, la trucha al vapor es mi plato favorito.", 4),
        (2, 4, "El caldo de gallina es como el de mi abuela, delicioso.", 5),
        (5, 5, "Excelente servicio de desarrollo web, muy profesionales.", 5),
        (8, 5, "Buen soporte técnico, responden rápido a las solicitudes.", 4),
        (3, 5, "El diseño web que hicieron para mi negocio es espectacular.", 5),
        (6, 6, "El tour a Huancaya fue increíble, paisajes maravillosos.", 5),
        (9, 6, "Guías muy conocedores, aprendí mucho sobre la región.", 4),
        (1, 6, "City tour muy completo, conocí lugares que no sabía que existían.", 4),
        (7, 7, "El pan de masa madre es el mejor de Huancayo, siempre compro aquí.", 5),
        (4, 7, "Las empanadas son deliciosas y frescas cada mañana.", 4),
        (10, 7, "La torta de zanahoria es espectacular, muy recomendada.", 5),
        (8, 8, "Asesoría contable muy clara y profesional, me ayudaron mucho.", 5),
        (5, 8, "Buen servicio contable, precios justos para emprendedores.", 4),
        (2, 8, "Me resolvieron todas mis dudas tributarias, muy agradecido.", 5),
        (9, 9, "Las plantas son de excelente calidad, el servicio de jardinería también.", 4),
        (6, 9, "Compré un frutal injertado y creció hermoso, muy recomendado.", 5),
        (3, 9, "Buena variedad de plantas ornamentales, precios accesibles.", 4),
        (10, 10, "El vestido andino es hermoso, la tela es de gran calidad.", 5),
        (7, 10, "Diseños únicos, me encanta la fusión de tradición y moda.", 5),
        (4, 10, "La cartera artesanal es preciosa, todas me preguntan dónde la compré.", 5),
    ]

    # ── Ejecución ───────────────────────────────────────────────────────
    try:
        # Insertar clientes (roles: visitante)
        for nombre, apellido, correo in clientes:
            existing = user_repo.get_by_email(correo)
            if not existing:
                user_repo.create({
                    "nombre": nombre,
                    "apellido": apellido,
                    "correo": correo,
                    "contrasena_hash": USER_HASH,
                    "rol": "visitante"
                })
                created_users += 1
                print(f"  OK Cliente creado ({correo} / Pass123!)")
            else:
                print(f"  -> Cliente ya existe ({correo})")

        # Insertar emprendedores + negocios + productos + promos
        for idx, emp in enumerate(emprendedores):
            correo = emp["correo"]
            user = user_repo.get_by_email(correo)
            if not user:
                user = user_repo.create({
                    "nombre": emp["nombre"],
                    "apellido": emp["apellido"],
                    "correo": correo,
                    "contrasena_hash": USER_HASH,
                    "rol": "emprendedor"
                })
                user = user_repo.get_by_email(correo)
                created_users += 1
                print(f"  OK Emprendedor creado ({correo} / Pass123!)")
            else:
                print(f"  -> Emprendedor ya existe ({correo})")

            id_usuario = user["id_usuario"]

            # Verificar si ya tiene negocio
            existing_biz = biz_repo.get_by_user(id_usuario)
            if existing_biz:
                biz_id = existing_biz["id_emprendimiento"]
                print(f"    -> Negocio ya existe: {existing_biz['nombre']}")
            else:
                biz_data = emp["negocio"]
                biz = biz_repo.create({
                    "id_usuario": id_usuario,
                    "id_categoria": cat_id(biz_data["categoria_nombre"]),
                    "nombre": biz_data["nombre"],
                    "descripcion": biz_data["descripcion"],
                    "telefono": biz_data["telefono"],
                    "direccion": biz_data["direccion"],
                    "distrito": biz_data["distrito"],
                })
                biz = biz_repo.get_by_user(id_usuario)
                biz_id = biz["id_emprendimiento"]

                # Actualizar horario si existe
                if "horario_apertura" in biz_data:
                    cursor = conn.cursor()
                    cursor.execute("""
                        UPDATE Emprendimientos
                        SET horario_apertura = ?, horario_cierre = ?
                        WHERE id_emprendimiento = ?
                    """, biz_data["horario_apertura"], biz_data["horario_cierre"], biz_id)
                    cursor.close()

                created_businesses += 1
                print(f"    OK Negocio creado: {biz_data['nombre']}")

            # Insertar productos
            for prod_nombre, prod_desc, prod_precio, prod_stock in emp["productos"]:
                existing_prods = prod_repo.get_by_business(biz_id, size=100)
                if any(p["nombre"] == prod_nombre for p in existing_prods.get("items", [])):
                    continue
                prod_repo.create(biz_id, {
                    "nombre": prod_nombre,
                    "descripcion": prod_desc,
                    "precio": prod_precio,
                    "stock": prod_stock,
                    "estado_stock": "disponible" if prod_stock >= 999 else ("bajo_stock" if prod_stock < 20 else "disponible"),
                })
                created_products += 1
            print(f"    OK {len(emp['productos'])} productos insertados")

            # Insertar promociones
            for promo_titulo, promo_desc, promo_estado, promo_dias in emp["promos"]:
                existing_promos = promo_repo.get_by_business(biz_id)
                if any(p["titulo"] == promo_titulo for p in existing_promos):
                    continue
                hoy = date.today()
                promo_repo.create(biz_id, {
                    "titulo": promo_titulo,
                    "descripcion": promo_desc,
                    "fecha_inicio": hoy.isoformat(),
                    "fecha_fin": (hoy + timedelta(days=promo_dias)).isoformat(),
                    "estado": promo_estado,
                })
                created_promos += 1
            if emp["promos"]:
                print(f"    OK {len(emp['promos'])} promociones insertadas")

        # Insertar reseñas
        # Mapear IDs de emprendedores a sus negocios
        negocio_ids = {}
        for emp in emprendedores:
            user = user_repo.get_by_email(emp["correo"])
            if user:
                biz = biz_repo.get_by_user(user["id_usuario"])
                if biz:
                    negocio_ids[emprendedores.index(emp) + 1] = biz["id_emprendimiento"]

        # Mapear IDs de clientes
        cliente_ids = {}
        for i, (_, _, correo) in enumerate(clientes):
            user = user_repo.get_by_email(correo)
            if user:
                cliente_ids[i + 1] = user["id_usuario"]

        for cliente_idx, negocio_idx, contenido, puntuacion in reseñas_pool:
            id_usuario = cliente_ids.get(cliente_idx)
            id_negocio = negocio_ids.get(negocio_idx)
            if id_usuario and id_negocio:
                try:
                    review_repo.create(id_usuario, id_negocio, contenido, puntuacion)
                    created_reviews += 1
                except Exception:
                    pass  # Puede existir unique constraint

        print(f"\n{'='*50}")
        print("RESUMEN:")
        print(f"  Usuarios creados:      {created_users}")
        print(f"  Negocios creados:      {created_businesses}")
        print(f"  Productos creados:     {created_products}")
        print(f"  Promociones creadas:   {created_promos}")
        print(f"  Reseñas creadas:       {created_reviews}")
        print(f"\nContraseña general: Pass123!")
        print(f"Admin: admin@bizrise.pe / Admin123!")
        print(f"{'='*50}")

    except Exception as e:
        print(f"ERROR: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    print("BizRise — Seed de datos de prueba\n")
    seed()

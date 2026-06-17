"""
BizRise — Asigna imagenes a todos los negocios y agrega negocios aprobados
en categorias que no tienen ninguno visible.
Ejecutar: python seed_fix_businesses.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from src.config.settings import settings

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
PASSWORD = pwd_ctx.hash("Test1234!")

APROBADOS = [
    {
        "nombre": "Daniela",
        "apellido": "Paredes",
        "correo": "daniela.paredes@test.pe",
        "negocio": "Centro de Bienestar Integral",
        "categoria": "Salud y Bienestar",
        "descripcion": "Masajes terapeuticos, yoga, meditacion y consultas de nutricion.",
        "telefono": "966111222",
        "direccion": "Av. Mariscal Castilla 890",
        "distrito": "Huancayo",
    },
    {
        "nombre": "Miguel",
        "apellido": "Cardenas",
        "correo": "miguel.cardenas@test.pe",
        "negocio": "Academia de Idiomas SpeakEasy",
        "categoria": "Educacion",
        "descripcion": "Cursos de ingles, portugues y quechua. Preparacion para examenes internacionales.",
        "telefono": "966333444",
        "direccion": "Jr. Cusco 345",
        "distrito": "El Tambo",
    },
    {
        "nombre": "Ana",
        "apellido": "Rojas",
        "correo": "ana.rojas@test.pe",
        "negocio": "Ferreteria El Constructor",
        "categoria": "Construccion y Ferreteria",
        "descripcion": "Venta de materiales de construccion, herramientas, pinturas y acabados.",
        "telefono": "966555666",
        "direccion": "Av. Circunvalacion 1200",
        "distrito": "Chilca",
    },
    {
        "nombre": "Jose",
        "apellido": "Inga",
        "correo": "jose.inga@test.pe",
        "negocio": "Transportes Rapidos Huancayo",
        "categoria": "Transporte",
        "descripcion": "Servicio de transporte de pasajeros a destinos regionales. Movilidad escolar.",
        "telefono": "966777888",
        "direccion": "Terminal Terrestre, Local 15",
        "distrito": "Huancayo",
    },
    {
        "nombre": "Carmen",
        "apellido": "Llanos",
        "correo": "carmen.llanos@test.pe",
        "negocio": "Zona de Juegos KidsFun",
        "categoria": "Entretenimiento",
        "descripcion": "Centro de entretenimiento infantil con juegos, area de cumpleanos y cafeteria.",
        "telefono": "966999000",
        "direccion": "Real Plaza Huancayo, 2do nivel",
        "distrito": "Huancayo",
    },
]

def main():
    conn_str = settings.DATABASE_URL
    engine = create_engine(conn_str, echo=False)
    created = 0

    with Session(engine) as session:
        # 1. Asignar fotos de picsum a todos los negocios que no tienen imagen
        rows = session.execute(
            text("SELECT id_emprendimiento, nombre FROM Emprendimientos WHERE imagen_portada_url IS NULL")
        ).fetchall()

        for row in rows:
            eid = row[0]
            ename = row[1]
            seed = ename.replace(" ", "-").lower()[:50]
            url = f"https://picsum.photos/seed/{seed}/800/400"
            session.execute(
                text("UPDATE Emprendimientos SET imagen_portada_url = :url WHERE id_emprendimiento = :eid"),
                {"url": url, "eid": eid},
            )
        session.commit()
        print(f"  >> {len(rows)} negocios actualizados con imagen de portada")

        # 2. Agregar 1 negocio aprobado por cada categoria nueva que no tenga ninguno
        for data in APROBADOS:
            cat_row = session.execute(
                text("SELECT id_categoria FROM Categorias WHERE nombre = :n"),
                {"n": data["categoria"]},
            ).fetchone()

            if not cat_row:
                print(f"  !! Categoria '{data['categoria']}' no existe, saltando")
                continue

            cat_id = cat_row[0]

            # Verificar si ya existe un negocio aprobado en esta categoria
            existing = session.execute(
                text("SELECT COUNT(*) FROM Emprendimientos WHERE id_categoria = :cid AND estado_verificacion = 'aprobado'"),
                {"cid": cat_id},
            ).fetchone()

            if existing and existing[0] > 0:
                print(f"  >> {data['categoria']} ya tiene negocios aprobados, saltando")
                continue

            # Verificar si el usuario ya existe
            user = session.execute(
                text("SELECT id_usuario FROM Usuarios WHERE correo = :c"),
                {"c": data["correo"]},
            ).fetchone()

            if user:
                uid = user[0]
                print(f"  >> Usuario {data['correo']} ya existe, reusando")
            else:
                session.execute(text("""
                    INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol, estado, fecha_registro)
                    VALUES (:nom, :ape, :cor, :pwd, 'emprendedor', 'activo', GETDATE())
                """), {
                    "nom": data["nombre"], "ape": data["apellido"],
                    "cor": data["correo"], "pwd": PASSWORD,
                })
                session.flush()
                user = session.execute(
                    text("SELECT id_usuario FROM Usuarios WHERE correo = :c"),
                    {"c": data["correo"]},
                ).fetchone()
                uid = user[0]

            seed = data["negocio"].replace(" ", "-").lower()[:50]
            img_url = f"https://picsum.photos/seed/{seed}/800/400"

            session.execute(text("""
                INSERT INTO Emprendimientos (id_usuario, id_categoria, nombre, descripcion, telefono, direccion, distrito, imagen_portada_url, estado_verificacion, fecha_registro)
                VALUES (:uid, :cat, :nom, :desc, :tel, :dir, :dis, :img, 'aprobado', GETDATE())
            """), {
                "uid": uid, "cat": cat_id,
                "nom": data["negocio"], "desc": data["descripcion"],
                "tel": data["telefono"], "dir": data["direccion"],
                "dis": data["distrito"], "img": img_url,
            })

            session.commit()
            created += 1
            print(f"  >> {data['negocio']} creado (aprobado) en {data['categoria']}")

    print(f"\n++ {created} nuevos negocios aprobados creados")
    print("   Todos los negocios tienen imagen de portada asignada")

if __name__ == "__main__":
    main()

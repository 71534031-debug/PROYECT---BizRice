"""
BizRise — Seed de 5 emprendedores con negocio PENDIENTE para pruebas.
Ejecutar con la BD ya existente: python seed_pending.py
Contraseña para todos: Test1234!
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from datetime import date
from passlib.context import CryptContext
from src.config.settings import settings

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
PASSWORD = pwd_ctx.hash("Test1234!")
import sys
sys.stdout.reconfigure(encoding='utf-8')

PENDIENTES = [
    {
        "nombre": "Carlos",
        "apellido": "Huaman",
        "correo": "carlos.huaman2@test.pe",
        "negocio": "Panaderia San Jorge",
        "categoria": "Salud y Bienestar",
        "descripcion": "Pan artesanal, tortas y pasteles por encargo. Delivery en Huancayo.",
        "telefono": "964112233",
        "direccion": "Jr. Real 456",
        "distrito": "Huancayo",
    },
    {
        "nombre": "Maria",
        "apellido": "Quispe",
        "correo": "maria.quispe@test.pe",
        "negocio": "Tejidos Warmi",
        "categoria": "Entretenimiento",
        "descripcion": "Ropa tejida a mano con lana de alpaca. Chompas, chalinas y guantes.",
        "telefono": "964445566",
        "direccion": "Av. Giraldez 780",
        "distrito": "El Tambo",
    },
    {
        "nombre": "Pedro",
        "apellido": "Lopez",
        "correo": "pedro.lopez@test.pe",
        "negocio": "Taller Mecanico Rapido",
        "categoria": "Construccion y Ferreteria",
        "descripcion": "Mantenimiento y reparacion de vehiculos menores. Cambio de aceite, frenos y diagnosis.",
        "telefono": "964778899",
        "direccion": "Carretera Central Km 5",
        "distrito": "Chilca",
    },
    {
        "nombre": "Rosa",
        "apellido": "Mendoza",
        "correo": "rosa.mendoza@test.pe",
        "negocio": "Clinica Dental Sonrisa",
        "categoria": "Salud y Bienestar",
        "descripcion": "Atencion dental general, limpieza, blanqueamiento y ortodoncia. Precios accesibles.",
        "telefono": "964990011",
        "direccion": "Psje. Los Olivos 123",
        "distrito": "Huancayo",
    },
    {
        "nombre": "Luis",
        "apellido": "Torres",
        "correo": "luis.torres@test.pe",
        "negocio": "Clases de Ingles Online",
        "categoria": "Educacion",
        "descripcion": "Clases virtuales de ingles basico a avanzado. Grupos reducidos y horarios flexibles.",
        "telefono": "965223344",
        "direccion": "Av. Ferrocarril 567",
        "distrito": "El Tambo",
    },
]

NUEVAS_CATEGORIAS = [
    "Salud y Bienestar",
    "Educacion",
    "Construccion y Ferreteria",
    "Transporte",
    "Entretenimiento",
]

def asegurar_categorias(session):
    ids = {}
    for nombre in NUEVAS_CATEGORIAS:
        row = session.execute(
            text("SELECT id_categoria FROM Categorias WHERE nombre = :n"), {"n": nombre}
        ).fetchone()
        if row:
            ids[nombre] = row[0]
        else:
            session.execute(
                text("INSERT INTO Categorias (nombre, descripcion) VALUES (:n, :d)"),
                {"n": nombre, "d": f"Categoria {nombre}"},
            )
            session.flush()
            row = session.execute(
                text("SELECT id_categoria FROM Categorias WHERE nombre = :n"), {"n": nombre}
            ).fetchone()
            ids[nombre] = row[0]
            print(f"   >> Categoria '{nombre}' creada (id={row[0]})")
    return ids

def main():
    engine = create_engine(settings.DATABASE_URL, echo=False)
    created = 0

    with Session(engine) as session:
        cat_ids = asegurar_categorias(session)
        session.commit()

        for p in PENDIENTES:
            exists = session.execute(
                text("SELECT id_usuario FROM Usuarios WHERE correo = :c"),
                {"c": p["correo"]}
            ).fetchone()

            if exists:
                print(f"   >> {p['correo']} ya existe - saltando")
                continue

            cat_id = cat_ids.get(p["categoria"])
            if not cat_id:
                print(f"   !! Categoria '{p['categoria']}' no encontrada, saltando")
                continue

            session.execute(text("""
                INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol, estado, fecha_registro)
                VALUES (:nom, :ape, :cor, :pwd, 'emprendedor', 'activo', NOW())
            """), {
                "nom": p["nombre"], "ape": p["apellido"],
                "cor": p["correo"], "pwd": PASSWORD,
            })
            session.flush()

            user_row = session.execute(
                text("SELECT id_usuario FROM Usuarios WHERE correo = :c"),
                {"c": p["correo"]}
            ).fetchone()
            uid = user_row[0]

            session.execute(text("""
                INSERT INTO Emprendimientos (id_usuario, id_categoria, nombre, descripcion, telefono, direccion, distrito, estado_verificacion, fecha_registro)
                VALUES (:uid, :cat, :nom, :desc, :tel, :dir, :dis, 'pendiente', NOW())
            """), {
                "uid": uid, "cat": cat_id,
                "nom": p["negocio"], "desc": p["descripcion"],
                "tel": p["telefono"], "dir": p["direccion"],
                "dis": p["distrito"],
            })

            session.commit()
            created += 1
            print(f"   >> {p['nombre']} {p['apellido']} - {p['negocio']} (pendiente)")

    print(f"\n++ {created} emprendedores con negocio pendiente creados")
    print("   Contrasena para todos: Test1234!")
    print("   Inicia sesion como admin y ve a Solicitudes para aprobar/rechazar.")

if __name__ == "__main__":
    main()

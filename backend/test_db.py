"""Temporary script to check DB state"""
from src.config.db import engine
from sqlalchemy import text

with engine.connect() as conn:
    print("=== Tables ===")
    tables = conn.execute(text("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='dbo' ORDER BY TABLE_NAME"))
    for t in tables:
        print(f"  {t[0]}")

    print("\n=== Users ===")
    users = conn.execute(text("SELECT id_usuario, nombre, apellido, correo, rol, estado FROM Usuarios"))
    for u in users:
        print(f"  ID={u[0]}, {u[1]} {u[2]}, {u[3]}, rol={u[4]}, estado={u[5]}")

    print("\n=== Categories ===")
    cats = conn.execute(text("SELECT id_categoria, nombre FROM Categorias"))
    for c in cats:
        print(f"  ID={c[0]}, {c[1]}")

    print("\n=== Businesses ===")
    count = conn.execute(text("SELECT COUNT(*) FROM Emprendimientos")).scalar()
    print(f"  Total: {count}")

    print("\n=== Test login query ===")
    user = conn.execute(
        text("SELECT id_usuario, nombre, correo, contrasena_hash, rol, estado FROM Usuarios WHERE correo = :correo"),
        {"correo": "admin@bizrise.pe"}
    ).first()
    if user:
        print(f"  Found admin user: {user.nombre}, hash len={len(user.contrasena_hash)}")
    else:
        print("  Admin user NOT FOUND!")

print("\nDone!")

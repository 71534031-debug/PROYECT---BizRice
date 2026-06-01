from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

ADMIN_EMAIL = "admin@bizrise.pe"
ADMIN_PASS = "Admin123!"

def _get_admin_token():
    res = client.post("/api/v1/auth/login", json={
        "correo": ADMIN_EMAIL,
        "contrasena": ADMIN_PASS
    })
    return res.json()["access_token"]

def _auth_header():
    return {"Authorization": f"Bearer {_get_admin_token()}"}

def test_stats():
    res = client.get("/api/v1/admin/stats", headers=_auth_header())
    assert res.status_code == 200, res.text
    data = res.json()
    assert "total_negocios" in data
    assert "pendientes" in data
    assert "nuevos_usuarios_mes" in data
    assert "crecimiento_porcentaje" in data
    assert "solicitudes_recientes" in data
    assert "crecimiento_mensual" in data
    assert isinstance(data["solicitudes_recientes"], list)
    assert isinstance(data["crecimiento_mensual"], list)
    if data["solicitudes_recientes"]:
        s = data["solicitudes_recientes"][0]
        assert "id_emprendimiento" in s
        assert "nombre" in s
        assert "fecha_registro" in s

def test_list_businesses():
    res = client.get("/api/v1/admin/businesses", headers=_auth_header())
    assert res.status_code == 200, res.text
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert "pages" in data
    assert isinstance(data["items"], list)
    if data["items"]:
        b = data["items"][0]
        assert "id_emprendimiento" in b
        assert "nombre" in b
        assert "categoria" in b
        assert "propietario" in b
        assert "estado_verificacion" in b
        assert "fecha_registro" in b
        assert "nombre" in b["propietario"]
        assert "correo" in b["propietario"]

def test_list_businesses_filter_estado():
    res = client.get("/api/v1/admin/businesses?estado=pendiente", headers=_auth_header())
    assert res.status_code == 200, res.text
    for b in res.json()["items"]:
        assert b["estado_verificacion"] == "pendiente"

def test_list_businesses_pagination():
    res = client.get("/api/v1/admin/businesses?page=1&size=1", headers=_auth_header())
    assert res.status_code == 200
    data = res.json()
    assert data["size"] == 1
    assert data["page"] == 1

def test_list_users():
    res = client.get("/api/v1/admin/users", headers=_auth_header())
    assert res.status_code == 200, res.text
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert "pages" in data
    if data["items"]:
        u = data["items"][0]
        assert "id_usuario" in u
        assert "nombre" in u
        assert "apellido" in u
        assert "correo" in u
        assert "rol" in u
        assert "estado" in u
        assert "tiene_negocio" in u

def test_list_users_filter_rol():
    res = client.get("/api/v1/admin/users?rol=administrador", headers=_auth_header())
    assert res.status_code == 200, res.text
    for u in res.json()["items"]:
        assert u["rol"] == "administrador"

def test_create_user():
    import random
    suffix = random.randint(1000, 9999)
    email = f"admincreated{suffix}@example.com"
    res = client.post("/api/v1/admin/users", headers=_auth_header(), json={
        "nombre": "Created",
        "apellido": "User",
        "correo": email,
        "contrasena": "Secure123",
        "rol": "visitante"
    })
    assert res.status_code == 201, res.text
    assert "mensaje" in res.json() or "message" in res.json()

def test_create_user_duplicate():
    res = client.post("/api/v1/admin/users", headers=_auth_header(), json={
        "nombre": "Dup",
        "apellido": "Admin",
        "correo": ADMIN_EMAIL,
        "contrasena": "Secure123",
        "rol": "visitante"
    })
    assert res.status_code == 400

def test_unauthorized_access():
    res = client.get("/api/v1/admin/stats")
    assert res.status_code == 401
    res = client.get("/api/v1/admin/businesses")
    assert res.status_code == 401
    res = client.get("/api/v1/admin/users")
    assert res.status_code == 401

def test_non_admin_access():
    res = client.post("/api/v1/auth/login", json={
        "correo": "test@test.com",
        "contrasena": "Test1234"
    })
    token = res.json()["access_token"]
    res2 = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 403

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

ADMIN_EMAIL = "admin@bizrise.pe"
ADMIN_PASS = "Admin123!"
TEST_EMAIL = "test@test.com"
TEST_PASS = "Test1234"

def test_login_admin():
    res = client.post("/api/v1/auth/login", json={
        "correo": ADMIN_EMAIL,
        "contrasena": ADMIN_PASS
    })
    assert res.status_code == 200, res.text
    body = res.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"
    assert body["user"]["correo"] == ADMIN_EMAIL
    assert body["user"]["rol"] == "administrador"

def test_login_test_user():
    res = client.post("/api/v1/auth/login", json={
        "correo": TEST_EMAIL,
        "contrasena": TEST_PASS
    })
    assert res.status_code == 200, res.text
    body = res.json()
    assert "access_token" in body
    assert body["user"]["rol"] == "emprendedor"

def test_login_wrong_password():
    res = client.post("/api/v1/auth/login", json={
        "correo": ADMIN_EMAIL,
        "contrasena": "wrongpass1"
    })
    assert res.status_code == 401

def test_login_wrong_email():
    res = client.post("/api/v1/auth/login", json={
        "correo": "noexiste@correo.com",
        "contrasena": "SomePass1"
    })
    assert res.status_code == 401

def test_register():
    import random
    suffix = random.randint(1000, 9999)
    email = f"testuser{suffix}@example.com"
    res = client.post("/api/v1/auth/register", json={
        "nombre": "Test",
        "apellido": "User",
        "correo": email,
        "contrasena": "Secure123",
        "confirmar_contrasena": "Secure123"
    })
    assert res.status_code == 201, res.text
    body = res.json()
    assert "access_token" in body
    assert body["user"]["correo"] == email
    assert body["user"]["rol"] == "emprendedor"

def test_register_duplicate():
    res = client.post("/api/v1/auth/register", json={
        "nombre": "Dup",
        "apellido": "User",
        "correo": TEST_EMAIL,
        "contrasena": "Test1234",
        "confirmar_contrasena": "Test1234"
    })
    assert res.status_code == 400

def test_register_password_mismatch():
    res = client.post("/api/v1/auth/register", json={
        "nombre": "Test",
        "apellido": "User",
        "correo": "mismatch@example.com",
        "contrasena": "Secure123",
        "confirmar_contrasena": "Different1"
    })
    assert res.status_code == 400

def test_register_weak_password():
    res = client.post("/api/v1/auth/register", json={
        "nombre": "Test",
        "apellido": "User",
        "correo": "weak@example.com",
        "contrasena": "short",
        "confirmar_contrasena": "short"
    })
    assert res.status_code == 422

def test_me_valid_token():
    res = client.post("/api/v1/auth/login", json={
        "correo": ADMIN_EMAIL,
        "contrasena": ADMIN_PASS
    })
    token = res.json()["access_token"]
    res2 = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 200, res2.text
    me = res2.json()
    assert me["correo"] == ADMIN_EMAIL
    assert me["rol"] == "administrador"
    assert "id_usuario" in me

def test_me_no_token():
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401

def test_me_invalid_token():
    res = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalidtoken123"})
    assert res.status_code == 401

def test_refresh_token():
    res = client.post("/api/v1/auth/login", json={
        "correo": ADMIN_EMAIL,
        "contrasena": ADMIN_PASS
    })
    refresh = res.json()["refresh_token"]
    res2 = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert res2.status_code == 200, res2.text
    assert "access_token" in res2.json()

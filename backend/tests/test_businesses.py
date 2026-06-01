from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_list_businesses_public():
    res = client.get("/api/v1/businesses")
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
        assert "puntuacion_promedio" in b
        assert "esta_abierto" in b

def test_list_businesses_pagination():
    res = client.get("/api/v1/businesses?page=1&size=2")
    assert res.status_code == 200
    data = res.json()
    assert data["size"] == 2
    assert data["page"] == 1

def test_list_businesses_filter_categoria():
    res = client.get("/api/v1/categories")
    cats = res.json()
    items = cats.get("items", cats)
    if items:
        cat_id = items[0]["id_categoria"]
        res2 = client.get(f"/api/v1/businesses?categoria={cat_id}")
        assert res2.status_code == 200
        for b in res2.json()["items"]:
            assert b["id_categoria"] == cat_id

def test_list_businesses_search():
    res = client.get("/api/v1/businesses?busqueda=test")
    assert res.status_code == 200

def test_get_business_detail():
    res = client.get("/api/v1/businesses")
    items = res.json().get("items", [])
    if not items:
        return
    bid = items[0]["id_emprendimiento"]
    res2 = client.get(f"/api/v1/businesses/{bid}")
    assert res2.status_code == 200, res2.text
    detail = res2.json()
    assert detail["id_emprendimiento"] == bid
    assert detail["nombre"]
    assert "categoria" in detail
    assert "propietario" in detail
    assert "puntuacion_promedio" in detail
    assert "redes_sociales" in detail
    assert "promociones_activas" in detail

def test_get_business_not_found():
    res = client.get("/api/v1/businesses/99999")
    assert res.status_code == 404

def test_get_business_products():
    res = client.get("/api/v1/businesses")
    items = res.json().get("items", [])
    if not items:
        return
    bid = items[0]["id_emprendimiento"]
    res2 = client.get(f"/api/v1/businesses/{bid}/products")
    assert res2.status_code == 200, res2.text
    data = res2.json()
    assert "items" in data
    assert "total" in data

def test_get_business_reviews():
    res = client.get("/api/v1/businesses")
    items = res.json().get("items", [])
    if not items:
        return
    bid = items[0]["id_emprendimiento"]
    res2 = client.get(f"/api/v1/businesses/{bid}/reviews")
    assert res2.status_code == 200, res2.text
    data = res2.json()
    assert "items" in data
    assert "distribucion_estrellas" in data
    assert "puntuacion_promedio" in data

def test_get_categories():
    res = client.get("/api/v1/categories")
    assert res.status_code == 200, res.text
    data = res.json()
    items = data.get("items", data)
    assert len(items) >= 1
    cat = items[0]
    assert "id_categoria" in cat
    assert "nombre" in cat

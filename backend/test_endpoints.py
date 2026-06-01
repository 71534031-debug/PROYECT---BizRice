"""Test endpoints directly, capturing full error tracebacks"""
import sys
import traceback
import json

# Start the app
import uvicorn
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("=" * 60)
print("TEST 1: ROOT")
print("=" * 60)
try:
    r = client.get("/")
    print(f"Status: {r.status_code}")
    print(f"Body: {r.json()}")
except Exception as e:
    traceback.print_exc()

print()
print("=" * 60)
print("TEST 2: LOGIN")
print("=" * 60)
try:
    r = client.post("/api/v1/auth/login", json={
        "correo": "admin@bizrise.pe",
        "contrasena": "Admin123!"
    })
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"OK! Token: {data['access_token'][:30]}...")
        print(f"User: {data['user']}")
    else:
        print(f"Error body: {r.text}")
        print(f"Error detail: {r.json()}")
except Exception as e:
    traceback.print_exc()

print()
print("=" * 60)
print("TEST 3: CATEGORIES")
print("=" * 60)
try:
    r = client.get("/api/v1/categories")
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"OK! Items: {len(data.get('items', []))}")
        for cat in data.get('items', []):
            print(f"  - {cat['nombre']} ({cat['total_negocios']})")
    else:
        print(f"Error body: {r.text}")
except Exception as e:
    traceback.print_exc()

print()
print("=" * 60)
print("TEST 4: BAD LOGIN")
print("=" * 60)
try:
    r = client.post("/api/v1/auth/login", json={
        "correo": "admin@bizrise.pe",
        "contrasena": "wrongpassword"
    })
    print(f"Status: {r.status_code}")
    print(f"Body: {r.json()}")
except Exception as e:
    traceback.print_exc()

print()
print("DONE!")

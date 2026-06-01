# BizRise — Directorio de Emprendedores Locales de Huancayo

Sistema web de directorio inteligente que conecta emprendedores locales de Huancayo con sus clientes.
Proyecto académico — Curso: Ingeniería Web, Universidad Continental 2026.
**Autor:** Anccasi Espinoza, Jorge Lennon

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + CSS3 + JavaScript puro |
| Framework UI | Bootstrap 5.3 (CDN) |
| Iconos | Bootstrap Icons (CDN) |
| Backend | Python 3.14+ + FastAPI |
| ORM | SQLAlchemy 2.0 (mssql+pyodbc) |
| Base de Datos | SQL Server 2022 Developer (Docker) |
| Driver BD | pyodbc 5 |
| Autenticación | JWT (python-jose + passlib + bcrypt) |
| Tests | pytest + httpx (31 tests, 100% passing) |

---

## Frontend — 14 páginas

| Módulo | Páginas |
|--------|---------|
| **Públicas** | Home, Directorio, Categorías, Perfil de Negocio |
| **Autenticación** | Login, Registro |
| **Emprendedor** | Dashboard, Mi Negocio, Productos, Promociones, Configuración |
| **Admin** | Dashboard, Solicitudes, Usuarios |

Cada página tiene su propio `.html` + `.css` + `.js`. 4 componentes reutilizables (navbar, footer, 2 sidebars).
Punto de entrada único: `http://localhost:5500/` → `frontend/index.html` → redirige a Home.

---

## Backend — 35 endpoints

| Módulo | Endpoints | Controller |
|--------|-----------|------------|
| Autenticación | 4 | `auth_controller.py` |
| Categorías | 1 | `category_controller.py` |
| Directorio Público | 5 | `business_controller.py` |
| Panel Emprendedor | 16 | `entrepreneur_controller.py` |
| Panel Admin | 9 | `admin_controller.py` |

8 modelos SQLAlchemy: Usuario, Categoría, Emprendimiento, Producto, Comentario, Valoración, Promoción, RedSocial.

---

## Base de Datos — SQL Server

8 tablas: Usuarios, Categorias, Emprendimientos, Productos, Comentarios, Valoraciones, Promociones, RedesSociales.
Seed data: 6 categorías + 1 admin (admin@bizrise.pe / Admin123!).

### Credenciales de prueba

| Rol | Correo | Contraseña | Creado por |
|-----|--------|-----------|------------|
| Administrador | `admin@bizrise.pe` | `Admin123!` | seeds.sql |
| Emprendedor | `emprendedor@bizrise.pe` | `Emprendedor1!` | Script de inicialización |
| Cliente | `cliente@bizrise.pe` | `Cliente1!` | Script de inicialización |

> **Nota:** El emprendedor `emprendedor@bizrise.pe` no tiene negocio registrado. Debe crearlo en "Mi Negocio" tras iniciar sesión.
> El rol `cliente` solo puede ver páginas públicas (Home, Directorio, Categorías, Perfil de Negocio).

---

## Instalación y ejecución

### Backend
```bash
cd backend
pip install -r requirements.txt
# Configurar .env con datos de SQL Server
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
python -m http.server 5500
```
Luego abrir `http://localhost:5500/` en el navegador.
El `index.html` redirige automáticamente a Home (`/pages/home/home.html`).

---

## Documentación del proyecto

| Archivo | Propósito |
|---------|-----------|
| `CLAUDE.md` | Reglas de desarrollo obligatorias |
| `PROGRESO_PROYECTO.md` | Estado detallado + matriz de navegación E2E |
| `PROJECT-TREE.md` | Estructura de archivos |
| `API-INVENTORY.md` | Inventario de endpoints |
| `FRONTEND-INVENTORY.md` | Inventario de páginas |
| `BACKEND-CONTROLLERS.md` | Documentación de controllers |
| `RELEASE-NOTES.md` | Notas de liberación v1.0.0 |
| `TEST-REPORT.md` | Reporte de tests (31/31) |
| `FINAL-AUDIT.md` | Auditoría final de calidad |
| `docs/` | Arquitectura, ADRs, especificaciones |

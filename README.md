# BizRise — Plataforma Web para Emprendedores Locales de Huancayo

Sistema web de directorio inteligente que conecta emprendedores locales de Huancayo con sus clientes. Permite buscar, explorar y promocionar negocios locales organizados por categorías.

Proyecto académico — Curso: Ingeniería Web, Universidad Continental 2026.

**Autor:** Anccasi Espinoza, Jorge Lennon.
**Docente:** Taipe Miranda, Gino Joel.

---

## Stack Tecnológico Actual

### Frontend
- Angular (versión más reciente) con Standalone Components
- TypeScript estricto
- Bootstrap 5.3 instalado via NPM
- Bootstrap Icons via NPM
- Angular Signals para estado reactivo
- Angular Reactive Forms con validadores custom
- HttpClient con interceptores JWT automáticos
- Lazy loading en todas las rutas
- RxJS debounceTime y distinctUntilChanged para el buscador

### Backend
- Python 3.11+
- FastAPI 0.110+
- pyodbc 5.0+ como driver de conexión a SQL Server
- SQLAlchemy 2.0 solo para crear tablas al inicio (NO para queries)
- python-jose para JWT (access token 30 min, refresh token 7 días)
- passlib[bcrypt] para hash de contraseñas
- python-multipart para upload de imágenes
- pydantic-settings para variables de entorno
- Arquitectura: controllers/ + repositories/ con Stored Procedures

### Base de datos
- SQL Server 2019+ (corriendo en Docker)
- Conexión via pyodbc directo (NO SQLAlchemy ORM para queries)
- TODAS las operaciones usan Stored Procedures
- 8 tablas: Usuarios, Categorias, Emprendimientos, Productos, Comentarios, Valoraciones, Promociones, RedesSociales
- 27+ Stored Procedures para todas las operaciones CRUD

---

## Arquitectura

3 capas:
- **Capa 1:** Angular + Bootstrap 5 → puerto 4200
- **Capa 2:** Python FastAPI → puerto 8000
- **Capa 3:** SQL Server en Docker → puerto 1433

### Flujo de datos

```
Angular Component → Service (Signal) → HttpClient → FastAPI Controller
→ Repository.execute_sp() → SQL Server SP → JSON Response
→ Signal actualiza UI automáticamente
```

---

## Estructura de carpetas

```
frontend/
├── src/app/
│   ├── core/
│   │   ├── guards/           auth.guard, role.guard, no-auth.guard
│   │   ├── interceptors/     auth.interceptor, error.interceptor
│   │   ├── services/         auth.service, api.service
│   │   └── models/           user, business, product, category, review
│   ├── shared/
│   │   └── components/       navbar, footer, business-card,
│   │                         star-rating, loading-spinner, pagination
│   └── features/
│       ├── public/           home, directory, categories, business-profile
│       ├── auth/             login, register
│       ├── entrepreneur/     dashboard, my-business, products,
│       │                     promotions, settings
│       └── admin/            dashboard, requests, users
├── src/styles/
│   ├── _variables.scss       $primary: #6f42c1 (morado BizRise)
│   └── styles.scss
└── angular.json

backend/
├── src/
│   ├── config/
│   │   ├── settings.py       variables de entorno con pydantic-settings
│   │   └── db.py             conexión pyodbc directa
│   ├── models/               SQLAlchemy solo para create_all al inicio
│   ├── controllers/          routers FastAPI + schemas Pydantic + lógica
│   ├── repositories/
│   │   ├── base_repository.py    execute_sp() via pyodbc
│   │   ├── user_repository.py
│   │   ├── business_repository.py
│   │   ├── product_repository.py
│   │   ├── review_repository.py
│   │   ├── promotion_repository.py
│   │   └── category_repository.py
│   └── database/
│       ├── schema.sql            CREATE TABLE de las 8 tablas
│       ├── seeds.sql             categorías y admin inicial
│       └── stored_procedures.sql todos los SPs
├── uploads/
│   ├── negocios/
│   └── productos/
├── main.py
├── .env
└── requirements.txt
```

---

## Usuarios del sistema

| Rol | Acceso |
|-----|--------|
| **Visitante** | Sin login, solo lectura del directorio público |
| **Emprendedor** | Login, gestiona su negocio, productos y promociones |
| **Administrador** | Login, aprueba negocios y gestiona usuarios |

---

## Rutas de la aplicación

### Públicas (sin login)

| Ruta | Descripción |
|------|-------------|
| `/` | Home con buscador y negocios destacados |
| `/directorio` | Directorio con filtros y paginación |
| `/categorias` | Explorar por categorías |
| `/negocio/:id` | Perfil público del negocio |

### Autenticación

| Ruta | Descripción |
|------|-------------|
| `/auth/login` | Iniciar sesión |
| `/auth/register` | Registrarse como emprendedor |

### Panel Emprendedor (requiere login + rol emprendedor)

| Ruta | Descripción |
|------|-------------|
| `/entrepreneur/dashboard` | Métricas del negocio |
| `/entrepreneur/my-business` | Editar información del negocio |
| `/entrepreneur/products` | Gestionar productos |
| `/entrepreneur/promotions` | Gestionar promociones |
| `/entrepreneur/settings` | Cambiar contraseña y notificaciones |

### Panel Administrador (requiere login + rol administrador)

| Ruta | Descripción |
|------|-------------|
| `/admin/dashboard` | Métricas globales de la plataforma |
| `/admin/requests` | Aprobar o rechazar negocios |
| `/admin/users` | Gestionar usuarios |

---

## Endpoints de la API

| Módulo | Métodos | Ruta |
|--------|---------|------|
| Auth | POST | `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/refresh` |
| Auth | GET | `/api/v1/auth/me` |
| Categorías | GET | `/api/v1/categories` |
| Directorio | GET | `/api/v1/businesses` (filtros: busqueda, categoria, distrito, orden, page, size) |
| Directorio | GET | `/api/v1/businesses/:id` |
| Directorio | GET | `/api/v1/businesses/:id/products` |
| Directorio | GET | `/api/v1/businesses/:id/reviews` |
| Directorio | POST | `/api/v1/businesses/:id/reviews` |
| Emprendedor | GET/POST/PUT | `/api/v1/entrepreneur/business` |
| Emprendedor | POST | `/api/v1/entrepreneur/business/image` |
| Emprendedor | GET/POST/PUT/DELETE | `/api/v1/entrepreneur/products` |
| Emprendedor | GET/POST/PUT/DELETE | `/api/v1/entrepreneur/promotions` |
| Emprendedor | GET | `/api/v1/entrepreneur/stats` |
| Emprendedor | PUT | `/api/v1/entrepreneur/settings/password` |
| Admin | GET | `/api/v1/admin/stats` |
| Admin | GET/PUT | `/api/v1/admin/businesses` (approve, reject) |
| Admin | GET/PUT/DELETE | `/api/v1/admin/users` (suspend, activate) |

---

## Instalación y uso

### Prerequisitos

- Node.js 18+
- Python 3.11+
- SQL Server en Docker o local
- ODBC Driver 17 for SQL Server instalado en el sistema

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# editar .env con los datos de SQL Server
# ejecutar schema.sql y stored_procedures.sql en SQL Server
uvicorn main:app --reload --port 8000
```

Documentación API: [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend

```bash
cd frontend
npm install
ng serve --port 4200 --open
```

Abrir: [http://localhost:4200](http://localhost:4200)

### Variables de entorno (.env)

```env
DB_SERVER=localhost
DB_NAME=BizRiseDB
DB_USER=sa
DB_PASSWORD=TuPassword123!
DB_DRIVER=ODBC Driver 17 for SQL Server
SECRET_KEY=clave_secreta_larga_cambiar_en_produccion
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ALLOWED_ORIGINS=http://localhost:4200
```

### requirements.txt

```
fastapi==0.110.0
uvicorn[standard]==0.27.1
sqlalchemy==2.0.28
pyodbc==5.0.1
pydantic==2.6.3
pydantic-settings==2.2.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.1
python-multipart==0.0.9
```

---

## Decisiones técnicas clave

| Decisión | Razón |
|----------|-------|
| Angular en lugar de HTML puro | Requisito del docente |
| Stored Procedures en lugar de ORM directo | Requisito del docente |
| Repositories con execute_sp() | Separa acceso a datos de la lógica de negocio |
| Angular Signals | Estado reactivo más simple que RxJS BehaviorSubjects |
| Validación doble capa | Angular (UX) + Python Pydantic (seguridad) |
| Bootstrap 5 via NPM | Mejor integración con el build de Angular |
| SQL Server en Docker | Facilita configuración del entorno de desarrollo |

---

## Funcionalidades implementadas

- Directorio público con búsqueda (debounce 400ms), filtros y paginación
- Autenticación JWT con renovación automática de tokens
- Panel emprendedor: gestión de negocio, productos, promociones y configuración
- Panel administrador: aprobar/rechazar negocios, gestionar usuarios
- Validación de fechas en promociones (no acepta fechas pasadas)
- Soft delete en productos (activo=0, no se elimina de la BD)
- Upload de imágenes para negocios y productos
- Sistema de reseñas y valoraciones (1 por usuario por negocio)
- Cálculo automático de puntuación promedio
- Estado Abierto/Cerrado calculado en tiempo real según horario
- Responsive mobile con Bootstrap Offcanvas para sidebars

---

## Documentación del proyecto

| Archivo | Propósito |
|---------|-----------|
| `CLAUDE.md` | Reglas de desarrollo obligatorias |
| `PROMPTS.md` | Prompts de trabajo para Claude Code |
| `docs/architecture/ARCHITECTURE.md` | Arquitectura del sistema |
| `docs/architecture/DATABASE-SCHEMA.md` | Esquema de base de datos y SPs |
| `docs/architecture/BACKEND-CONTROLLERS.md` | Patrón de controllers y repositories |
| `docs/architecture/FRONTEND-STRUCTURE.md` | Estructura del frontend Angular |
| `docs/decisions/ADR-001-stack-tecnologico.md` | Decisiones técnicas registradas |

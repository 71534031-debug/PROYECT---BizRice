# BizRise — Arquitectura del Sistema

## Stack Tecnológico

### Frontend
| Tecnología | Uso |
|---|---|
| Angular (última versión) | Framework SPA — Standalone Components |
| Bootstrap 5.3 (NPM) | Framework CSS — OBLIGATORIO |
| Bootstrap Icons (NPM) | Íconos — OBLIGATORIO |
| TypeScript estricto | Lenguaje |
| Angular Signals | Estado reactivo |
| Reactive Forms | Formularios con validadores custom |
| HttpClient + interceptores | Llamadas HTTP + JWT |

### Backend
| Tecnología | Uso |
|---|---|
| Python 3.11+ | Lenguaje principal |
| FastAPI | Framework REST API |
| pyodbc | Driver Python → SQL Server (directo, sin ORM) |
| SQLAlchemy 2.0 | Solo para crear tablas al inicio |
| python-jose | JWT tokens |
| passlib[bcrypt] | Hash contraseñas |
| python-multipart | Upload de imágenes |
| python-dotenv | Variables de entorno |

### Base de datos
| Tecnología | Uso |
|---|---|
| SQL Server 2019+ | Motor principal — OBLIGATORIO |
| Docker | Contenedor SQL Server |
| pyodbc | Conexión Python-SQL Server |

---

## Arquitectura 3 Capas

```
┌──────────────────────────────────────────────────┐
│   CAPA 1: PRESENTACIÓN (Frontend)                │
│   Angular + Bootstrap 5.3 NPM + Signals          │
│   Puerto: 4200 (ng serve)                        │
│   Standalone Components + Lazy Loading           │
└───────────────────────┬──────────────────────────┘
                        │ HTTP REST / JSON
                        │ Authorization: Bearer <JWT>
┌───────────────────────▼──────────────────────────┐
│   CAPA 2: LÓGICA DE NEGOCIO (Backend)            │
│   Python + FastAPI                               │
│   Puerto: 8000 — /api/v1/...                     │
│   Controllers: router + schemas Pydantic + lógica│
│   Repositories: execute_sp() → pyodbc directo    │
└───────────────────────┬──────────────────────────┘
                        │ EXEC sp_name @param=?
                        │ pyodbc driver
┌───────────────────────▼──────────────────────────┐
│   CAPA 3: DATOS (Base de datos)                  │
│   SQL Server 2019+ en Docker                     │
│   Puerto: 1433 — Base: BizRiseDB                 │
│   TODAS las operaciones via Stored Procedures    │
└──────────────────────────────────────────────────┘
```

---

## Estructura completa del proyecto

```
bizrise/
│
├── frontend/                        ← bizrise-frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── guards/          ← auth.guard.ts (adminGuard, entrepreneurGuard)
│   │   │   │   ├── interceptors/    ← JWT interceptor funcional
│   │   │   │   ├── services/        ← servicios con Signals
│   │   │   │   └── models/          ← interfaces TypeScript
│   │   │   ├── shared/
│   │   │   │   └── components/      ← componentes reutilizables
│   │   │   ├── public/              ← landing, directorio, perfil, categorías
│   │   │   ├── auth/                ← login, registro
│   │   │   ├── entrepreneur/        ← dashboard, mi negocio, productos, promos, settings
│   │   │   ├── admin/               ← dashboard, solicitudes, usuarios
│   │   │   ├── app.routes.ts        ← rutas con lazy loading + guards
│   │   │   └── app.config.ts        ← providers (HttpClient, interceptor)
│   │   ├── styles/
│   │   │   ├── _variables.scss      ← $primary: #6f42c1
│   │   │   └── styles.scss          ← global CSS + override Bootstrap
│   │   └── environments/
│   ├── angular.json
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── settings.py          ← variables de entorno
│   │   │   └── db.py                ← conexión pyodbc DIRECTA (NO SQLAlchemy Session)
│   │   ├── models/                  ← SQLAlchemy solo para crear tablas
│   │   ├── controllers/             ← router + schemas Pydantic + lógica
│   │   │   ├── auth_controller.py
│   │   │   ├── category_controller.py
│   │   │   ├── business_controller.py
│   │   │   ├── entrepreneur_controller.py
│   │   │   ├── admin_controller.py
│   │   │   └── users_controller.py
│   │   ├── repositories/            ← BaseRepository + por entidad
│   │   │   ├── base_repository.py   ← execute_sp(), execute_sp_multi(), execute_sp_single()
│   │   │   ├── user_repository.py
│   │   │   ├── business_repository.py
│   │   │   ├── product_repository.py
│   │   │   ├── review_repository.py
│   │   │   ├── promotion_repository.py
│   │   │   └── category_repository.py
│   │   └── database/
│   │       ├── schema.sql           ← CREATE TABLE de todas las tablas
│   │       ├── seeds.sql            ← INSERT de datos iniciales
│   │       └── stored_procedures.sql ← CREATE OR ALTER de todos los SPs
│   ├── data/
│   │   ├── raw/
│   │   └── backups/
│   ├── tests/
│   ├── uploads/
│   │   ├── negocios/
│   │   └── productos/
│   ├── main.py                      ← punto de entrada FastAPI
│   ├── .env
│   └── requirements.txt
│
└── docs/
    ├── CLAUDE.md
    ├── architecture/
    │   └── ARCHITECTURE.md
    ├── specs/
    ├── decisions/
    ├── api/
    └── components/
```

---

## Flujo de datos (end-to-end)

```
Angular Component
    │
    ▼
Service (Signal) ← estado reactivo
    │
    ▼
HttpClient (con JWT interceptor)
    │  POST/GET/PUT/DELETE → /api/v1/...
    ▼
FastAPI Controller
    │  valida con Pydantic schema
    ▼
Repository.execute_sp("sp_name", {params})
    │  construye: EXEC sp_name @param1=?, @param2=?
    ▼
pyodbc cursor.execute(query, values)
    │
    ▼
SQL Server Stored Procedure
    │
    ▼
ResultSet → list[dict]
    │
    ▼
Repository retorna dicts
    │
    ▼
Controller serializa con Pydantic response_model
    │
    ▼
HTTP Response JSON
    │
    ▼
Service actualiza Signal
    │
    ▼
UI se actualiza automáticamente (reactividad)
```

---

## Reglas clave de la arquitectura

1. **Base de datos**: TODAS las operaciones CRUD pasan por Stored Procedures. NUNCA SQL inline en Python ni SQLAlchemy ORM en controllers.

2. **Repositorios**: Cada entidad tiene su repositorio que hereda de `BaseRepository`. Los repositorios usan `execute_sp("sp_name", {params})` que construye `EXEC sp_name @param1=?, @param2=?` y retorna listas de diccionarios.

3. **Controladores**: Cada controller contiene `APIRouter` + schemas Pydantic (request/response) + lógica de negocio. No hay carpetas `services/` ni `routers/` separadas.

4. **Frontend**: Componentes standalone con lazy loading. Reactive Forms con validadores custom. Signals para estado reactivo. Interceptor funcional para JWT.

5. **Formularios y botones**: Toda acción muestra spinner, llama endpoint, ejecuta SP, actualiza Signal, actualiza UI, muestra Toast.

6. **Validaciones críticas**: Fechas de promociones validadas en frontend (custom validator) y backend (Pydantic field_validator). Búsqueda con debounce 400ms y query params en URL.

---

## Puertos

| Servicio | Puerto |
|---|---|
| Frontend (ng serve) | `http://localhost:4200` |
| Backend (uvicorn) | `http://localhost:8000` |
| SQL Server (Docker) | `localhost:1433` |

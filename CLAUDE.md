# CLAUDE.md — Reglas obligatorias para Claude Code
# Leer este archivo ANTES de escribir cualquier línea de código

## Proyecto
BizRise — Plataforma web de directorio de emprendedores locales en Huancayo, Perú.
Curso: Ingeniería Web — Universidad Continental 2026.
Autor: Anccasi Espinoza, Jorge Lennon.

---

## FRONTEND: Angular Standalone + Bootstrap NPM

- Angular versión más reciente con Standalone Components
- Bootstrap 5.3 instalado via NPM (no CDN)
- Bootstrap Icons via NPM
- TypeScript estricto
- Angular Signals para estado reactivo
- HttpClient con interceptores JWT
- Reactive Forms con validadores custom
- Lazy loading en todas las rutas
- Color primario #6f42c1 en _variables.scss sobreescribiendo $primary de Bootstrap

---

## BACKEND: Python + FastAPI + Stored Procedures

```
backend/
├── src/
│   ├── config/         ← configuración y conexión a BD (db.py, settings.py)
│   ├── models/         ← modelos SQLAlchemy (solo para crear tablas al inicio)
│   ├── controllers/    ← router FastAPI + schemas Pydantic + lógica de negocio
│   ├── repositories/   ← heredan BaseRepository, usan execute_sp() con pyodbc directo
│   └── database/       ← stored_procedures.sql con CREATE OR ALTER, schema.sql, seeds.sql
├── data/
│   ├── raw/
│   └── backups/
├── tests/
├── main.py
├── .env
├── requirements.txt
└── README.md
```

### Reglas de backend:
- NUNCA queries SQLAlchemy ORM directas — todo pasa por Stored Procedures
- Los modelos SQLAlchemy solo se usan para crear las tablas al inicio
- NUNCA SQL inline en Python — siempre EXEC sp_name via execute_sp()
- NUNCA usar carpetas services/, routers/ separados
- Cada controller contiene: APIRouter + schemas Pydantic + lógica de negocio
- Cada repository hereda BaseRepository y llama execute_sp("sp_name", {params})

---

## BASE DE DATOS: SQL Server 2019+ en Docker

- Motor: SQL Server 2019+ (corriendo en Docker)
- Driver Python: pyodbc — OBLIGATORIO
- TODAS las operaciones usan Stored Procedures
- Connection string: `mssql+pyodbc://user:pass@server/BizRiseDB?driver=ODBC+Driver+17+for+SQL+Server`
- NUNCA usar SQLite, NUNCA usar PostgreSQL

---

## FLUJO DE DATOS obligatorio

```
Angular Component → Service (Signal) → HttpClient → FastAPI Controller → Repository.execute_sp() → SQL Server SP → Response → Signal actualiza UI
```

---

## REGLA de botones y formularios

Toda acción debe:
1. Mostrar Spinner mientras carga
2. Llamar al endpoint
3. Ejecutar el SP
4. Actualizar el Signal
5. Actualizar la UI sin recargar
6. Mostrar Toast de éxito o error

---

## VALIDACIONES ya corregidas (mantener)

### Promociones (fechas):
- `fecha_inicio` no puede ser anterior a hoy
- `fecha_fin` debe ser posterior a `fecha_inicio`
- Validar en Angular (validador custom Reactive Forms) Y en Python (field_validator Pydantic)

### Buscador del directorio:
- Debounce de 400ms
- Actualiza query params de la URL sin recargar
- Busca en nombre Y descripción con LIKE en el SP

---

## Autenticación JWT

- Librería: python-jose[cryptography]
- Hash contraseñas: passlib[bcrypt]
- Access token: 30 minutos
- Refresh token: 7 días
- Frontend: guardar en localStorage, enviar en header Authorization: Bearer <token> via interceptor

---

## Puertos

- Frontend: http://localhost:4200 (ng serve)
- Backend: http://localhost:8000
- SQL Server: localhost:1433

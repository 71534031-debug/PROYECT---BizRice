# ADR-001 — Stack Tecnológico BizRise

## Estado: APROBADO

---

## Frontend

### Framework: Angular 17+ con Standalone Components
**Decisión:** Usar Angular con la nueva API de Standalone Components (sin NgModules).

### Estilos: Bootstrap 5.3 — OBLIGATORIO
**Decisión:** Bootstrap 5 es el framework CSS principal del proyecto.

**Reglas de uso obligatorias:**
- Usar el sistema de grid de Bootstrap (`container`, `row`, `col-*`) para todos los layouts
- Usar clases utilitarias de Bootstrap (`d-flex`, `p-3`, `mb-4`, `text-center`, etc.)
- Usar componentes Bootstrap para: botones, formularios, tarjetas, modales, alertas, navbar, badges, tablas
- Usar Bootstrap Icons para todos los íconos (`<i class="bi bi-..."></i>`)
- Las variables SCSS de Bootstrap se pueden sobreescribir en `styles/_variables.scss`

**Componentes Bootstrap que SE USARÁN en BizRise:**
```
Navbar          → barra de navegación principal y paneles
Cards           → tarjetas de negocios en el directorio
Badges          → estado de verificación, categorías, stock
Forms           → login, registro, formularios de negocio y productos
Modals          → confirmaciones, detalles de producto
Alerts          → mensajes de éxito, error, advertencia
Buttons         → todas las acciones del sistema
Pagination      → directorio de negocios
Spinner         → loading states
Toast           → notificaciones temporales
Table           → panel admin (usuarios, solicitudes)
Tabs            → perfil de negocio (productos, reseñas)
Accordion       → preguntas frecuentes, horarios
Carousel        → imágenes del negocio (futuro)
Progress        → métricas del dashboard
Dropdown        → menú de usuario, filtros
```

**Instalación Bootstrap en Angular:**
```bash
npm install bootstrap bootstrap-icons
```

```json
// angular.json — agregar en styles y scripts
"styles": [
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "node_modules/bootstrap-icons/font/bootstrap-icons.css",
  "src/styles/styles.scss"
],
"scripts": [
  "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"
]
```

---

## Backend

### Framework: FastAPI (Python 3.11+)
**Decisión:** FastAPI sobre Django/Flask por: rendimiento, tipado con Pydantic, Swagger automático, y mejor integración con SQLAlchemy async.

### Base de datos: SQL Server 2019+
**Decisión:** SQL Server es el motor de base de datos obligatorio del proyecto.

### Driver Python → SQL Server: pyodbc
**Decisión:** Usar `pyodbc` como driver ODBC para la conexión Python-SQL Server.

**Por qué pyodbc:**
- Driver oficial y más estable para SQL Server en Python
- Compatible con SQLAlchemy mediante el dialecto `mssql+pyodbc`
- Soporta SQL Server en Windows, Linux y macOS
- Requiere tener instalado "ODBC Driver 17 for SQL Server" en el sistema

**Instalación:**
```bash
pip install pyodbc sqlalchemy[mssql] fastapi uvicorn
pip install python-jose[cryptography] passlib[bcrypt] python-dotenv
pip install python-multipart alembic pydantic-settings
```

**Prerequisito del sistema:**
Instalar Microsoft ODBC Driver 17 for SQL Server:
- Windows: Descargar desde Microsoft
- Ubuntu: `sudo apt-get install msodbcsql17`

### ORM: SQLAlchemy 2.0+
**Decisión:** SQLAlchemy como ORM principal con dialecto `mssql+pyodbc`.

**Connection string:**
```
mssql+pyodbc://usuario:password@servidor/BizRiseDB?driver=ODBC+Driver+17+for+SQL+Server
```

### Migraciones: Alembic
**Decisión:** Alembic para versionar cambios en el esquema de SQL Server.

---

## Paleta de colores BizRise

Basada en los prototipos del documento (morado/púrpura como color principal):

```scss
// src/styles/_variables.scss
// Sobreescribir variables Bootstrap ANTES de importar Bootstrap

$primary:   #6f42c1;  // Morado BizRise (color principal)
$secondary: #6c757d;  // Gris neutro
$success:   #198754;  // Verde — negocios aprobados
$danger:    #dc3545;  // Rojo — rechazados, eliminar
$warning:   #ffc107;  // Amarillo — pendiente
$info:      #0dcaf0;  // Cyan — información

// Colores custom BizRise
$bizrise-purple-dark:  #5a32a3;
$bizrise-purple-light: #8b5cf6;
$bizrise-bg-hero:      #f8f5ff;  // Fondo secciones hero
```

---

## Estructura de carpetas Angular (detalle)

```
src/app/
├── core/                    # Servicios singleton, guards, interceptores
│   ├── guards/
│   │   ├── auth.guard.ts          # Verifica si está autenticado
│   │   ├── role.guard.ts          # Verifica rol específico
│   │   └── no-auth.guard.ts       # Redirige si ya está logueado
│   ├── interceptors/
│   │   ├── auth.interceptor.ts    # Agrega Bearer token a requests
│   │   └── error.interceptor.ts   # Manejo global de errores HTTP
│   ├── services/
│   │   ├── auth.service.ts        # Login, logout, estado auth
│   │   ├── token.service.ts       # Guardar/leer JWT en localStorage
│   │   └── api.service.ts         # Base URL y métodos HTTP genéricos
│   └── models/                    # Interfaces TypeScript
│       ├── user.model.ts
│       ├── business.model.ts
│       ├── product.model.ts
│       ├── category.model.ts
│       ├── review.model.ts
│       └── pagination.model.ts
│
├── shared/                  # Componentes reutilizables en toda la app
│   └── components/
│       ├── navbar/          # Barra de navegación con Bootstrap Navbar
│       ├── footer/          # Footer con Bootstrap grid
│       ├── business-card/   # Tarjeta de negocio con Bootstrap Card
│       ├── star-rating/     # Estrellas con Bootstrap Icons
│       ├── loading-spinner/ # Bootstrap Spinner
│       └── alert-message/   # Bootstrap Alert
│
└── features/                # Módulos por funcionalidad
    ├── public/              # Sin autenticación requerida
    │   ├── home/
    │   ├── directory/
    │   ├── categories/
    │   └── business-profile/
    ├── auth/                # Login y registro
    │   ├── login/
    │   └── register/
    ├── entrepreneur/        # ROL: emprendedor
    │   ├── dashboard/
    │   ├── my-business/
    │   ├── products/
    │   ├── promotions/
    │   └── settings/
    └── admin/               # ROL: administrador
        ├── dashboard/
        ├── requests/
        └── users/
```

---

## Estructura de carpetas FastAPI (detalle)

```
backend/app/
├── api/v1/routers/      # Endpoints REST — solo reciben y devuelven JSON
├── core/                # Config, security, dependencias
├── db/                  # Conexión y sesión de BD (pyodbc + SQLAlchemy)
├── models/              # Modelos SQLAlchemy (tablas SQL Server)
├── schemas/             # Schemas Pydantic (validación request/response)
├── services/            # Lógica de negocio
├── repositories/        # Acceso a datos (queries SQLAlchemy)
└── main.py              # Entry point FastAPI + CORS + routers
```

**Flujo de una request:**
```
Request HTTP → Router → Service → Repository → SQLAlchemy → pyodbc → SQL Server
Response     ← Router ← Service ← Repository ← SQLAlchemy ← pyodbc ← SQL Server
```

# BizRise — Arquitectura del Sistema

## Stack Tecnológico DEFINITIVO

### Frontend
| Tecnología | Uso |
|---|---|
| HTML5 puro | Estructura de cada página |
| CSS3 puro | Estilos por página (archivo separado) |
| JavaScript puro (ES6+) | Lógica por página (archivo separado) |
| Bootstrap 5.3 (CDN) | Framework CSS — OBLIGATORIO |
| Bootstrap Icons (CDN) | Íconos — OBLIGATORIO |
| fetch() nativo | Llamadas HTTP al backend |

### Backend
| Tecnología | Uso |
|---|---|
| Python 3.11+ | Lenguaje principal |
| FastAPI | Framework REST API |
| SQLAlchemy 2.0 | ORM |
| pyodbc | Driver Python → SQL Server |
| python-jose | JWT tokens |
| passlib[bcrypt] | Hash contraseñas |
| python-multipart | Upload de imágenes |
| python-dotenv | Variables de entorno |

### Base de datos
| Tecnología | Uso |
|---|---|
| SQL Server 2019+ | Motor principal — OBLIGATORIO |
| pyodbc | Conexión Python-SQL Server |

---

## Estructura completa del proyecto

```
bizrise/
│
├── frontend/
│   ├── pages/
│   │   ├── home/
│   │   │   ├── home.html
│   │   │   ├── home.css
│   │   │   └── home.js
│   │   ├── directory/
│   │   │   ├── directory.html
│   │   │   ├── directory.css
│   │   │   └── directory.js
│   │   ├── categories/
│   │   │   ├── categories.html
│   │   │   ├── categories.css
│   │   │   └── categories.js
│   │   ├── business-profile/
│   │   │   ├── business-profile.html
│   │   │   ├── business-profile.css
│   │   │   └── business-profile.js
│   │   ├── auth/
│   │   │   ├── login.html
│   │   │   ├── login.css
│   │   │   ├── login.js
│   │   │   ├── register.html
│   │   │   ├── register.css
│   │   │   └── register.js
│   │   ├── entrepreneur/
│   │   │   ├── dashboard.html
│   │   │   ├── dashboard.css
│   │   │   ├── dashboard.js
│   │   │   ├── my-business.html
│   │   │   ├── my-business.css
│   │   │   ├── my-business.js
│   │   │   ├── products.html
│   │   │   ├── products.css
│   │   │   ├── products.js
│   │   │   ├── promotions.html
│   │   │   ├── promotions.css
│   │   │   ├── promotions.js
│   │   │   ├── settings.html
│   │   │   ├── settings.css
│   │   │   └── settings.js
│   │   └── admin/
│   │       ├── dashboard.html
│   │       ├── dashboard.css
│   │       ├── dashboard.js
│   │       ├── requests.html
│   │       ├── requests.css
│   │       ├── requests.js
│   │       ├── users.html
│   │       ├── users.css
│   │       └── users.js
│   │
│   ├── components/                    ← HTML reutilizable (incluido via JS)
│   │   ├── navbar/
│   │   │   ├── navbar.html
│   │   │   ├── navbar.css
│   │   │   └── navbar.js
│   │   ├── footer/
│   │   │   ├── footer.html
│   │   │   ├── footer.css
│   │   │   └── footer.js
│   │   └── business-card/
│   │       ├── business-card.html
│   │       ├── business-card.css
│   │       └── business-card.js
│   │
│   └── assets/
│       ├── css/
│       │   └── global.css             ← variables CSS, estilos compartidos
│       ├── js/
│       │   ├── api.js                 ← funciones fetch base
│       │   └── auth.js                ← manejo de JWT localStorage
│       └── images/
│           └── placeholder.jpg
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.py                  ← conexión SQLAlchemy + pyodbc
│   │   │   └── settings.py            ← variables de entorno
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── business.py
│   │   │   ├── category.py
│   │   │   ├── product.py
│   │   │   ├── review.py
│   │   │   ├── rating.py
│   │   │   ├── promotion.py
│   │   │   └── social_network.py
│   │   ├── controllers/
│   │   │   ├── auth_controller.py     ← router + lógica autenticación
│   │   │   ├── business_controller.py ← router + lógica directorio público
│   │   │   ├── category_controller.py ← router + lógica categorías
│   │   │   ├── entrepreneur_controller.py ← router + lógica panel emprendedor
│   │   │   └── admin_controller.py    ← router + lógica panel administrador
│   │   └── database/
│   │       ├── schema.sql             ← CREATE TABLE de todas las tablas
│   │       └── seeds.sql              ← INSERT de datos iniciales
│   ├── data/
│   │   ├── raw/
│   │   └── backups/
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_businesses.py
│   │   └── test_admin.py
│   ├── uploads/                       ← imágenes subidas
│   │   ├── negocios/
│   │   └── productos/
│   ├── main.py                        ← punto de entrada FastAPI
│   ├── .env
│   ├── .env.example
│   ├── requirements.txt
│   └── README.md
│
└── docs/                              ← documentación del proyecto
    ├── CLAUDE.md
    ├── specs/
    ├── architecture/
    ├── decisions/
    ├── api/
    └── components/
```

---

## Arquitectura 3-Tier

```
┌──────────────────────────────────────────────┐
│   CAPA 1: PRESENTACIÓN (Frontend)            │
│   HTML5 + CSS3 + JS puro + Bootstrap 5 CDN  │
│   Archivos .html / .css / .js separados      │
│   fetch() para llamadas al backend           │
└─────────────────┬────────────────────────────┘
                  │ HTTP REST / JSON
                  │ Authorization: Bearer <JWT>
┌─────────────────▼────────────────────────────┐
│   CAPA 2: LÓGICA DE NEGOCIO (Backend)        │
│   Python 3.11 + FastAPI                      │
│   Puerto: 8000 — /api/v1/...                 │
│   controllers/ contiene router + lógica      │
└─────────────────┬────────────────────────────┘
                  │ SQLAlchemy ORM
                  │ pyodbc driver
┌─────────────────▼────────────────────────────┐
│   CAPA 3: DATOS (Base de datos)              │
│   SQL Server 2019+                           │
│   Puerto: 1433 — Base: BizRiseDB             │
└──────────────────────────────────────────────┘
```

---

## Cómo se cargan los componentes HTML en JS puro

Cada página incluye el navbar y footer dinámicamente via JS:

```javascript
// En cada página .js, al inicio:
async function loadComponent(id, path) {
  const res = await fetch(path);
  const html = await res.text();
  document.getElementById(id).innerHTML = html;
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponent('navbar-container', '../../components/navbar/navbar.html');
  await loadComponent('footer-container', '../../components/footer/footer.html');
});
```

```html
<!-- En cada página .html -->
<div id="navbar-container"></div>
<!-- contenido de la página -->
<div id="footer-container"></div>
```

---

## Protección de páginas privadas (JS puro)

```javascript
// Al inicio de CADA página privada (entrepreneur/*, admin/*):
function checkAuth(requiredRole) {
  const token = localStorage.getItem('bizrise_access_token');
  const user = JSON.parse(localStorage.getItem('bizrise_user') || 'null');
  
  if (!token || !user) {
    window.location.href = '../../pages/auth/login.html';
    return false;
  }
  if (requiredRole && user.rol !== requiredRole) {
    window.location.href = '../../pages/home/home.html';
    return false;
  }
  return true;
}

// Uso en dashboard del emprendedor:
checkAuth('emprendedor');

// Uso en panel admin:
checkAuth('administrador');
```

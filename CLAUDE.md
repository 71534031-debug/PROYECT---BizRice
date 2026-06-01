# CLAUDE.md — Reglas obligatorias para Claude Code
# Leer este archivo ANTES de escribir cualquier línea de código

## Proyecto
BizRise — Plataforma web de directorio de emprendedores locales en Huancayo, Perú.
Curso: Ingeniería Web — Universidad Continental 2026.
Autor: Anccasi Espinoza, Jorge Lennon.

---

## REGLA 1 — FRONTEND: HTML + CSS + JS puros y separados

El frontend NO usa Angular, NO usa React, NO usa TypeScript, NO usa Vue.
El frontend ES:
- HTML5 puro (.html)
- CSS3 puro (.css) — UN archivo CSS por página o componente
- JavaScript puro (.js) — UN archivo JS por página o componente
- Bootstrap 5.3 via CDN para todos los estilos y componentes
- Bootstrap Icons via CDN para todos los íconos
- fetch() nativo para llamadas al backend (no axios, no jQuery)

### Estructura de cada página:
```
pagina/
├── pagina.html   ← solo estructura HTML5, sin estilos inline
├── pagina.css    ← solo estilos CSS de esa página
└── pagina.js     ← solo lógica JS de esa página
```

### Bootstrap CDN que va en TODOS los HTML:
```html
<!-- En el <head> -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">

<!-- Antes del </body> -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
```

### CSS global compartido:
```
frontend/assets/css/global.css  ← variables CSS, estilos compartidos de todas las páginas
```

### JS global compartido:
```
frontend/assets/js/api.js       ← URL base del backend y función fetch() base
frontend/assets/js/auth.js      ← manejo de tokens JWT en localStorage
```

### REGLAS de CSS:
- NUNCA escribir estilos en el atributo style="" del HTML
- SIEMPRE usar clases Bootstrap primero
- Solo escribir CSS custom cuando Bootstrap no lo resuelve
- El color primario BizRise es #6f42c1 (morado), definido en global.css como variable

### REGLAS de JS:
- NUNCA escribir JS dentro de etiquetas <script> en el HTML
- SIEMPRE en archivo .js separado
- Usar fetch() para llamadas a la API
- Usar async/await (no .then().catch() anidados)
- Guardar tokens en localStorage con claves: 'bizrise_access_token', 'bizrise_refresh_token', 'bizrise_user'

---

## REGLA 2 — BACKEND: Python + FastAPI con estructura de carpetas específica

```
backend/
├── src/
│   ├── config/         ← configuración y conexión a BD (db.py, settings.py)
│   ├── models/         ← modelos SQLAlchemy (tablas SQL Server)
│   ├── controllers/    ← lógica de negocio + routers FastAPI
│   └── database/       ← scripts SQL de creación de tablas y seeds
├── data/
│   ├── raw/
│   └── backups/
├── tests/
├── main.py             ← punto de entrada FastAPI
├── .env
├── requirements.txt
└── README.md
```

### NUNCA usar:
- services/ (la lógica va en controllers/)
- repositories/ (las queries van en controllers/)
- routers/ separado (los routers van dentro de controllers/)

### Cada controller es un archivo que contiene:
1. El router FastAPI (APIRouter)
2. Las funciones de lógica de negocio
3. Las queries SQLAlchemy a SQL Server

---

## REGLA 3 — Base de datos: SQL Server + pyodbc

- Motor: SQL Server 2019+
- Driver Python: pyodbc — OBLIGATORIO
- ORM: SQLAlchemy con dialecto mssql+pyodbc
- Connection string: `mssql+pyodbc://user:pass@server/BizRiseDB?driver=ODBC+Driver+17+for+SQL+Server`
- NUNCA usar SQLite, NUNCA usar PostgreSQL

---

## REGLA 4 — Autenticación JWT

- Librería: python-jose[cryptography]
- Hash contraseñas: passlib[bcrypt]
- Access token: 30 minutos
- Refresh token: 7 días
- En JS: guardar en localStorage, enviar en header Authorization: Bearer <token>

---

## REGLA 5 — Color y diseño

- Color primario: #6f42c1 (morado BizRise)
- Definir como variable CSS: --bizrise-primary: #6f42c1;
- Usar btn-primary, text-primary, bg-primary de Bootstrap (sobreescribir con CSS)
- Bootstrap Icons para TODOS los íconos (bi bi-*)

---

## Puertos
- Frontend: abrir directamente los .html en el navegador O usar Live Server en VSCode
- Backend: http://localhost:8000
- SQL Server: localhost:1433

---

## Llamadas API desde JS (patrón estándar)
```javascript
// En cada archivo .js, importar desde api.js
const API_URL = 'http://localhost:8000/api/v1';

async function apiGet(endpoint) {
  const token = localStorage.getItem('bizrise_access_token');
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function apiPost(endpoint, data) {
  const token = localStorage.getItem('bizrise_access_token');
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
```

# AGENT.md — Reglas de Arquitectura para Agentes de IA

## Proyecto
BizRise — Plataforma web de directorio de emprendedores locales en Huancayo, Perú.
Curso: Ingeniería Web — Universidad Continental 2026.
Autor: Anccasi Espinoza, Jorge Lennon.

---

## 1. Separación estricta de capas

- El directorio `/frontend` debe ser independiente del `/backend`.
- Nunca modificar archivos del frontend cuando el cambio solicitado sea únicamente backend.
- Nunca modificar archivos del backend cuando el cambio solicitado sea únicamente frontend.
- Solo modificar ambos lados cuando el requerimiento indique explícitamente integración completa.

---

## 2. Reglas Frontend

Si el cambio solicitado pertenece al frontend:

### Rutas permitidas
```
/frontend/**
/frontend/index.html
/frontend/pages/**
/frontend/components/**
/frontend/assets/css/**
/frontend/assets/js/**
/frontend/assets/images/**
```

### Acciones permitidas
- Diseño UI/UX
- Componentes HTML/CSS/JS
- Formularios
- Navegación
- Validaciones visuales
- Consumo de APIs existentes (solo fetch a endpoints ya creados)
- Optimización visual

### Prohibido
- Cambiar lógica de negocio del backend
- Cambiar modelos SQLAlchemy
- Modificar base de datos
- Editar controladores backend (`backend/src/controllers/`)
- Crear endpoints nuevos en el backend
- Modificar `backend/main.py`

---

## 3. Reglas Backend

Si el cambio solicitado pertenece al backend:

### Rutas permitidas
```
/backend/**
/backend/main.py
/backend/src/**
/backend/src/config/**
/backend/src/models/**
/backend/src/controllers/**
/backend/src/database/**
/backend/tests/**
/backend/requirements.txt
/backend/.env
```

### Acciones permitidas
- API y endpoints
- Controladores
- Servicios (lógica de negocio en controllers/)
- Base de datos (modelos, migraciones, seeds)
- Validaciones del lado servidor
- Seguridad y autenticación
- Optimización del servidor

### Prohibido
- Modificar HTML (`*.html`)
- Modificar CSS (`*.css`)
- Modificar JS visual (`frontend/pages/*.js`, `frontend/components/*.js`)
- Alterar diseño del frontend
- Modificar `frontend/assets/js/api.js`
- Modificar `frontend/assets/js/auth.js`

---

## 4. Directorios protegidos (nunca eliminar)

```
/frontend
/backend
/backend/src
/backend/src/config
/backend/src/models
/backend/src/controllers
/backend/src/database
/frontend/pages
/frontend/components
/frontend/assets
```

---

## 5. Regla de Confirmación

Antes de realizar cambios, el agente DEBE indicar:

```
Área detectada: [Frontend / Backend / FullStack]
Archivos a modificar:
  - ruta/archivo1
  - ruta/archivo2
Archivos protegidos (no tocados):
  - ruta/archivo3
  - ruta/archivo4
```

Si detecta impacto cruzado (frontend y backend), debe esperar confirmación explícita antes de proceder.

---

## 6. Regla de Seguridad

- Nunca eliminar carpetas.
- Nunca renombrar módulos principales.
- Nunca alterar estructura sin autorización.
- Mantener compatibilidad con el código existente.
- Crear backups antes de cambios grandes.

---

## 7. Formato de Trabajo

Cada modificación debe reportar:

1. **Objetivo** — ¿Qué se resolvió?
2. **Archivos modificados** — Lista exacta de archivos tocados
3. **Archivos NO modificados** — Lista de archivos protegidos que se omitieron
4. **Riesgo del cambio** — Alto / Medio / Bajo
5. **Resultado esperado** — ¿Qué debería pasar después del cambio?

---

## 8. Referencia rápida de estructura del proyecto

```
BizRice/
├── frontend/                     # Frontend (HTML + CSS + JS puro)
│   ├── index.html
│   ├── assets/
│   │   ├── css/global.css
│   │   ├── js/api.js
│   │   ├── js/auth.js
│   │   └── images/
│   ├── components/               # Componentes reutilizables
│   │   ├── navbar/
│   │   ├── footer/
│   │   ├── admin-sidebar/
│   │   └── entrepreneur-sidebar/
│   └── pages/                    # Páginas del sitio
│       ├── home/
│       ├── auth/ (login, register)
│       ├── directory/
│       ├── business-profile/
│       ├── categories/
│       ├── entrepreneur/ (dashboard, my-business, products, promotions, settings)
│       └── admin/ (dashboard, users, requests)
├── backend/                      # Backend (Python + FastAPI)
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   ├── src/
│   │   ├── config/ (db.py, settings.py)
│   │   ├── models/ (SQLAlchemy)
│   │   ├── controllers/ (FastAPI routers)
│   │   └── database/ (SQL scripts)
│   ├── tests/
│   └── data/
├── docs/
│   ├── specs/
│   └── decisions/
├── CLAUDE.md                     # Reglas para Claude Code
└── AGENT.md                      # Este archivo — Reglas para agentes de IA
```

---

## 9. Compatibilidad con CLAUDE.md

Este archivo complementa a `CLAUDE.md`. En caso de conflicto:
- `AGENT.md` prevalece para decisiones de arquitectura y separación de capas.
- `CLAUDE.md` prevalece para convenciones técnicas (Bootstrap, FastAPI, JWT, etc.).

# AGENT.md — BizRise Project Summary

> Última actualización: 15 Jun 2026

---

## Estado General del Proyecto

El frontend clásico (HTML/CSS/JS puro, Bootstrap 5.3 CDN) está **completo y funcional** con todas las páginas integradas. El backend FastAPI está completo con rutas, modelos, seeds y autenticación JWT.

Se inició la **migración a Angular 21** (standalone components) como nueva arquitectura frontend. La migración está en fase inicial (solo scaffold del proyecto).

---

## Hito 1 — Rediseño página de Inicio (home)

**Archivos modificados:**
- `frontend/pages/home/home.html` — reemplazada completamente
- `frontend/pages/home/home.css` — reemplazado completamente
- `frontend/pages/home/home.js` — reemplazado completamente (lógica de datos y render)

**Cambios realizados:**
- Hero section con gradiente morado y CTA
- "Negocios Destacados" con tarjetas que tienen borde superior naranja (`#fb923c`) y diseño limpio
- Flechas de navegación izquierda/derecha en las tarjetas destacadas
- "Categorías Populares" en grid con iconos Bootstrap
- Sección de estadísticas (emprendedores, categorías, visitas, ciudades)
- CTA final como tarjeta redondeada `rounded-4` dentro del container (no full-width)
- Footer con enlaces y copyright

---

## Hito 2 — Rediseño página de Categorías (categories)

**Archivos modificados:**
- `frontend/pages/categories/categories.html` — reemplazada completamente
- `frontend/pages/categories/categories.css` — reemplazado completamente
- `frontend/pages/categories/categories.js` — reemplazado completamente

**Cambios realizados:**
- Banner hero eliminado; header limpio con barra de búsqueda y título "Categorías"
- Sección "Colecciones Destacadas" con 4 tarjetas de icono + texto
- Tarjetas de categoría grandes (380px height) con imágenes full-bleed, overlay gradiente, badge de cantidad
- Imagen circular superpuesta en cada tarjeta de categoría
- Sección CTA final
- 9 categorías: Gastronomía, Textilería, Artesanía, Servicios, Turismo, Tecnología, Belleza, Agricultura, Hogar

---

## Hito 3 — Imágenes de categorías descargadas

**Archivos creados (9 imágenes):**
```
frontend/assets/img/categories/
├── gastronomia.jpg   ~30KB  (300×300)
├── textileria.jpg    ~21KB  (300×300)
├── artesania.jpg     ~18KB  (300×300)
├── servicios.jpg     ~15KB  (300×300)
├── turismo.jpg       ~29KB  (300×300)
├── tecnologia.jpg    ~21KB  (300×300)
├── belleza.jpg       ~18KB  (300×300)
├── agricultura.jpg   ~19KB  (300×300)
└── hogar.jpg         ~21KB  (300×300)
```

Todas desde Unsplash (URLs directas `images.unsplash.com`), optimizadas para ~15-30KB cada una.

---

## Hito 4 — URLs de imágenes Google reemplazadas

**Archivos modificados:**
- `frontend/pages/categories/categories.js` — URLs Google AI → Unsplash
- `frontend/pages/home/home.js` — URLs Google AI → Unsplash

Las imágenes generadas por Google AI (`lh3.googleusercontent.com`) dejaron de funcionar. Se reemplazaron por URLs de Unsplash que devuelven contenido real.

---

## Hito 5 — Inicio de migración a Angular

**Comandos ejecutados:**
```
ng new bizrise-frontend --standalone --routing --style=scss
npm install bootstrap@5.3.3 bootstrap-icons
```

**Versiones:**
- Angular CLI: 21.2.8
- Node.js: 25.8.1 (warning "not LTS" pero funcional)
- Bootstrap: 5.3.3
- Bootstrap Icons: 1.13.1
- TypeScript: 5.9.2

**Archivos del proyecto Angular (`bizrise-frontend/`):**
- `angular.json` — config por defecto, solo `src/styles.scss` en styles
- `src/index.html` — placeholder, `<app-root></app-root>`
- `src/main.ts` — bootstrapApplication(App, appConfig)
- `src/styles.scss` — vacío (comentario por defecto)
- `src/app/app.ts` — componente standalone con RouterOutlet
- `src/app/app.html` — template por defecto de Angular (logo, enlaces)
- `src/app/app.scss` — vacío
- `src/app/app.config.ts` — solo provideRouter (routes vacío)
- `src/app/app.routes.ts` — Routes array vacío

**Pendiente de implementar en Angular:**
- Configurar `_variables.scss` con `$primary: #6f42c1` y Bootstrap import
- Agregar Bootstrap CSS/JS a `angular.json`
- Crear servicios: `api.service.ts`, `auth.service.ts`, `jwt.interceptor.ts`
- Crear componentes compartidos: `navbar`, `footer`
- Migrar todas las páginas como componentes lazy-loaded:
  - Home, Login, Register, Directory, Business Profile, Categories
  - Admin: Dashboard, Users, Businesses, Requests
  - Entrepreneur: Dashboard, My Business, Products, Promotions, Settings
- Reemplazar template placeholder de Angular con la app shell real

---

## Convenciones del proyecto (CLAUDE.md)

Recordatorio de reglas clave:
- **Frontend clásico:** HTML + CSS + JS puro, Bootstrap 5.3 CDN, Bootstrap Icons CDN
- **Frontend Angular (nuevo):** Standalone Components, SCSS, Bootstrap via npm
- **Backend:** Python FastAPI, SQL Server + pyodbc, SQLAlchemy, JWT
- **Color primario:** `#6f42c1` (morado BizRise) como `--bizrise-primary`
- **Puertos:** Frontend clásico en Live Server 5500, Angular en 4200, Backend en 8000
- **JWT:** `bizrise_access_token`, `bizrise_refresh_token`, `bizrise_user` en localStorage

---

## Hito 6 — Procedimientos Almacenados + Capa Repositorio

### 6a) Stored Procedures SQL Server (`backend/src/database/stored_procedures.sql`)

23 procedimientos almacenados creados:

**Usuarios (5):** `sp_RegisterUser`, `sp_GetUserByEmail`, `sp_GetUserById`, `sp_UpdateUserStatus`, `sp_ChangePassword`

**Emprendimientos (6):** `sp_GetBusinesses` (filtros: @busqueda, @id_categoria, @distrito, @orden, @page, @size + paginación OFFSET/FETCH y AVG de puntuación), `sp_GetBusinessById` (3 resultsets: negocio + redes + promos activas), `sp_CreateBusiness`, `sp_UpdateBusiness`, `sp_UpdateBusinessStatus`, `sp_GetBusinessByUserId`

**Productos (4):** `sp_GetProductsByBusiness`, `sp_CreateProduct` (límite 50), `sp_UpdateProduct`, `sp_DeleteProduct` (soft delete activo=0)

**Categorías (1):** `sp_GetCategories` (con COUNT de emprendimientos aprobados)

**Valoraciones (3):** `sp_GetReviewsByBusiness` (3 resultsets: distribución estrellas + reseñas paginadas + promedio), `sp_CreateReview` (transacción Comentarios + Valoraciones), `sp_GetRatingDistribution`

**Promociones (4):** `sp_GetPromotionsByBusiness` (auto-vencimiento), `sp_CreatePromotion` (límite 10 activas), `sp_UpdatePromotion`, `sp_DeletePromotion`

**Admin (3):** `sp_GetAdminStats` (4 resultsets: métricas + usuarios x 7 días + solicitudes pendientes + top 5), `sp_GetAllUsers`, `sp_GetAllBusinessesAdmin`

**Extra:** `sp_GetSalesByBusiness`

### 6b) Capa Repositorio (`backend/src/repositories/`)

6 archivos creados:

| Archivo | Clase | SPs que usa |
|---------|-------|-------------|
| `base_repository.py` | `BaseRepository` | `execute_sp()`, `execute_sp_single()`, `execute_sp_multi()` |
| `user_repository.py` | `UserRepository` | `sp_RegisterUser`, `sp_GetUserByEmail`, `sp_GetUserById`, `sp_UpdateUserStatus`, `sp_ChangePassword` |
| `business_repository.py` | `BusinessRepository` | `sp_GetBusinesses`, `sp_GetBusinessById`, `sp_GetBusinessByUserId`, `sp_CreateBusiness`, `sp_UpdateBusiness`, `sp_UpdateBusinessStatus`, `sp_GetAllBusinessesAdmin` |
| `product_repository.py` | `ProductRepository` | `sp_GetProductsByBusiness`, `sp_CreateProduct`, `sp_UpdateProduct`, `sp_DeleteProduct` |
| `review_repository.py` | `ReviewRepository` | `sp_GetReviewsByBusiness`, `sp_CreateReview`, `sp_GetRatingDistribution` |
| `promotion_repository.py` | `PromotionRepository` | `sp_GetPromotionsByBusiness`, `sp_CreatePromotion`, `sp_UpdatePromotion`, `sp_DeletePromotion` |

**`BaseRepository`** tiene 3 modos de ejecución:
- `execute_sp()` → lista de dicts (1 resultset)
- `execute_sp_single()` → primer dict o None
- `execute_sp_multi()` → lista de lista de dicts (múltiples resultsets)

### 6c) Controllers reescritos

Los 8 controllers fueron migrados de SQLAlchemy ORM a repositories + pyodbc:

| Controller | Cambio clave |
|------------|-------------|
| `auth_controller.py` | `get_db_conn` en lugar de `get_db`, `UserRepository` para queries, `get_current_user` retorna dict |
| `business_controller.py` | `BusinessRepository`, `ProductRepository`, `ReviewRepository` — SPs ya resuelven JOINs y AVGs |
| `entrepreneur_controller.py` | `BusinessRepository` + `ProductRepository` + `PromotionRepository` + `ReviewRepository` |
| `admin_controller.py` | `sp_GetAdminStats` multi-resultsets, `BusinessRepository`, `UserRepository` |
| `product_controller.py` | `ProductRepository` con búsqueda cruzada por `BusinessRepository` |
| `category_controller.py` | `BaseRepository.execute_sp("sp_GetCategories")` directamente |
| `users_controller.py` | `UserRepository` + `sp_GetAllUsers` |
| `sale_controller.py` | `sp_GetSalesByBusiness` |

**Patrón de dependencia:**
- `conn = Depends(get_db_conn)` inyecta conexión pyodbc directa
- `repo = UserRepository(conn)` / `BusinessRepository(conn)` etc.
- `conn.commit()` al final de cada operación de escritura
- `get_current_user(token, conn)` usa `UserRepository.get_by_id()` y retorna dict
- `require_role(role)` es una factory que retorna FastAPI dependency con `Depends(get_db_conn)`

**Cambios en `db.py`:**
- Se agregó `get_db_conn()` → genera conexión pyodbc con `DRIVER={...};SERVER=...;DATABASE=...;UID=...;PWD=...`
- `get_db()` (SQLAlchemy) se conserva para seed/scripts legacy

---

## Convenciones del proyecto (CLAUDE.md)

Recordatorio de reglas clave:
- **Frontend clásico:** HTML + CSS + JS puro, Bootstrap 5.3 CDN, Bootstrap Icons CDN
- **Frontend Angular (nuevo):** Standalone Components, SCSS, Bootstrap via npm
- **Backend:** Python FastAPI, SQL Server + pyodbc, **procedimientos almacenados** (vía capa repositorio), JWT
- **Capa datos:** `backend/src/repositories/` con `BaseRepository.execute_sp()` → NO SQLAlchemy ORM en controllers
- **Color primario:** `#6f42c1` (morado BizRise) como `--bizrise-primary`
- **Puertos:** Frontend clásico en Live Server 5500, Angular en 4200, Backend en 8000
- **JWT:** `bizrise_access_token`, `bizrise_refresh_token`, `bizrise_user` en localStorage

---

## Commits recientes (git log)

```
055b5fe feat: improve home, categories UI and update business flow
371a306 feat: add backend seeds, controllers, frontend integration and AGENT rules
031cab0 feat: initial BizRise full release - UX audit, images, navigation, CRUD fixes
```

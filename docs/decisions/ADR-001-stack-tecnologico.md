# ADR-001 — Stack Tecnológico BizRise

## Estado: APROBADO (actualizado)

---

## FRONTEND — Angular (última versión)

**Decisión:** Angular con Standalone Components.

**Razón del cambio desde HTML puro:** El docente pidió Angular explícitamente.

**Características obligatorias:**
- Standalone Components (sin NgModules)
- Signals para estado reactivo (en lugar de RxJS BehaviorSubjects)
- Reactive Forms con validadores custom
- Lazy loading en todas las rutas
- HttpClient con interceptores JWT funcionales
- TypeScript estricto

**Estilos:** Bootstrap 5.3 via NPM (no CDN) para mejor integración con el build de Angular.

```bash
npm install bootstrap@5.3.3 bootstrap-icons@1.11.3
```

```json
// angular.json
"styles": [
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "node_modules/bootstrap-icons/font/bootstrap-icons.css",
  "src/styles/styles.scss"
],
"scripts": [
  "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"
]
```

**Paleta de colores (src/styles/_variables.scss):**

```scss
$primary: #6f42c1;  // Morado BizRise — sobreescribe $primary de Bootstrap
$primary-rgb: 111, 66, 193;
$border-radius: 0.5rem;
```

---

## BACKEND — Python FastAPI

**Decisión:** FastAPI sobre Django/Flask (sin cambio).

**Razón:** Rendimiento, tipado con Pydantic, Swagger automático, integración con pyodbc.

---

## ACCESO A DATOS — Repositories con Stored Procedures

**Decisión:** Toda operación CRUD usa `execute_sp()` que llama a Stored Procedures de SQL Server.

**Razón del cambio desde SQLAlchemy ORM directo:** El docente pidió usar repository pattern con procedimientos almacenados.

**Reglas:**
- El ORM (SQLAlchemy) solo se usa para `Base.metadata.create_all()` al iniciar la app — crear tablas
- Toda operación de datos pasa por SPs: `EXEC sp_name @param1=?, @param2=?`
- Los repositories heredan `BaseRepository` y llaman `execute_sp()` con pyodbc directo
- NUNCA SQL inline en Python
- NUNCA SQLAlchemy ORM en controllers

**Estructura:**

```
repositories/
├── base_repository.py     ← execute_sp(), execute_sp_multi(), execute_sp_single()
├── user_repository.py
├── business_repository.py
├── product_repository.py
├── review_repository.py
├── promotion_repository.py
└── category_repository.py
```

**Conexión:** `get_db()` en `db.py` retorna una conexión pyodbc DIRECTA (NO SQLAlchemy Session).

---

## BASE DE DATOS — SQL Server con Stored Procedures

**Decisión:** SQL Server 2019+ en Docker (sin cambio en el motor).

**Cambio:** Ahora toda la lógica SQL está en Stored Procedures, no en el código Python.

**Archivo único de SPs:** `backend/src/database/stored_procedures.sql` con `CREATE OR ALTER`.

**Beneficio:** El SP puede optimizarse en SQL Server sin tocar el código Python.

**Lista de SPs por dominio:**
- **Usuarios:** sp_RegisterUser, sp_GetUserByEmail, sp_GetUserById, sp_UpdateUserStatus, sp_ChangePassword, sp_GetAllUsers
- **Categorías:** sp_GetCategories, sp_GetCategoryById
- **Emprendimientos:** sp_GetBusinesses, sp_GetBusinessById, sp_GetBusinessByUserId, sp_CreateBusiness, sp_UpdateBusiness, sp_UpdateBusinessImage, sp_UpdateBusinessStatus, sp_GetAllBusinessesAdmin, sp_CountBusinesses, sp_CountPendingBusinesses
- **Productos:** sp_GetProductsByBusiness, sp_GetProductById, sp_CreateProduct, sp_UpdateProduct, sp_DeleteProduct, sp_CountProductsByBusiness
- **Reseñas:** sp_GetReviewsByBusiness, sp_CreateReview, sp_GetRatingDistribution, sp_UserAlreadyReviewed
- **Promociones:** sp_GetPromotionsByBusiness, sp_GetPromotionById, sp_CreatePromotion, sp_UpdatePromotion, sp_DeletePromotion, sp_AutoExpirePromotions
- **Admin:** sp_GetAdminStats

---

## AUTENTICACIÓN — JWT con python-jose

**Decisión:** JWT con access/refresh tokens (sin cambio).

- Librería: python-jose[cryptography]
- Hash contraseñas: passlib[bcrypt]
- Access token: 30 minutos
- Refresh token: 7 días
- Angular interceptor agrega `Authorization: Bearer <token>` automáticamente

---

## ESTADO REACTIVO — Angular Signals

**Decisión:** Signals en lugar de BehaviorSubjects de RxJS.

**Razón:** Más simple, mejor rendimiento, integración nativa con Angular.

**Patrón en servicios:**

```typescript
items = signal<T[]>([]);
total = signal(0);
loading = signal(false);
error = signal<string | null>(null);
```

**Lectura en template:**

```html
@if (loading()) { <spinner> }
@for (item of items(); track item.id) { <card> }
```

---

## VALIDACIONES — Doble capa

**Decisión:** Toda validación crítica se valida en Angular (UX) Y en Python (seguridad).

**Validaciones obligatorias en ambos lados:**
- **Promociones:** `fecha_inicio` no anterior a hoy; `fecha_fin` posterior a `fecha_inicio`
- Angular: validadores custom `noPassedDateValidator` y `endDateAfterStartValidator`
- Python: `field_validator` de Pydantic

**Flujo de validación:**
1. Angular valida en el formulario → feedback instantáneo al usuario
2. Angular bloquea el submit si hay errores
3. Python (Pydantic schema) re-valida al recibir la request
4. El SP también puede validar con RAISERROR si es necesario

---

## Flujo de datos completo

```
Componente Angular
    ↓ llama a servicio
Servicio con Signals (loading=true)
    ↓ HttpClient con JWT interceptor
FastAPI Controller
    ↓ Repository.execute_sp("sp_name", {params})
pyodbc → EXEC sp_name @param=?
    ↓
SQL Server → ejecuta SP → resultset
    ↓
Repository retorna list[dict]
    ↓
Controller serializa con response_model Pydantic
    ↓
Servicio actualiza Signals (loading=false)
    ↓
Template renderiza reactivamente
```

---

## Puertos

| Servicio | Puerto |
|---|---|
| Frontend (ng serve) | `http://localhost:4200` |
| Backend (uvicorn) | `http://localhost:8000` |
| SQL Server (Docker) | `localhost:1433` |

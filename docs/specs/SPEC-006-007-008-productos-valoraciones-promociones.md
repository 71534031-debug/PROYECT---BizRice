# SPEC-006 — Gestión de Productos

## Descripción
CRUD completo de productos/servicios dentro del panel del emprendedor.

## Reglas de negocio
- Solo el propietario del emprendimiento puede gestionar sus productos
- Un producto debe tener al menos nombre y precio
- La imagen es opcional pero recomendada
- Estados de stock: `disponible` (verde), `bajo_stock` (amarillo), `agotado` (rojo)
- Al eliminar un producto se hace soft-delete (marcar como inactivo, no borrar de BD)
- Máximo 50 productos por emprendimiento

## Validaciones del formulario
```
nombre:      requerido, mínimo 3 chars, máximo 150 chars
descripcion: opcional, máximo 500 chars
precio:      requerido, número positivo, máximo 2 decimales, mínimo S/0.10
estado_stock: requerido, enum: disponible|bajo_stock|agotado
imagen:      opcional, JPG/PNG/WebP, máximo 2MB
```

## Endpoints API (ya en SPEC-004, aquí el detalle completo)
```
GET    /api/v1/entrepreneur/products?page=1&size=20&busqueda=cafe
POST   /api/v1/entrepreneur/products         (multipart/form-data)
GET    /api/v1/entrepreneur/products/{id}
PUT    /api/v1/entrepreneur/products/{id}    (multipart/form-data)
DELETE /api/v1/entrepreneur/products/{id}
```

## Modelo de respuesta producto
```json
{
  "id_producto": 1,
  "id_emprendimiento": 3,
  "nombre": "Latte de la Casa",
  "descripcion": "Espresso doble con leche cremosa de altura",
  "precio": 12.00,
  "imagen_url": "/uploads/productos/latte-casa.jpg",
  "estado_stock": "disponible",
  "fecha_creacion": "2024-10-12T10:30:00"
}
```

## Criterios de aceptación
- [ ] Se puede crear un producto con imagen
- [ ] Se puede crear un producto sin imagen (mostrar placeholder)
- [ ] El precio muestra siempre 2 decimales con prefijo S/
- [ ] El badge de stock cambia de color según el estado
- [ ] Al eliminar, aparece modal de confirmación Bootstrap
- [ ] Máximo 50 productos (mostrar alerta si se intenta agregar más)

---

# SPEC-007 — Valoraciones y Comentarios

## Descripción
Sistema de estrellas (1-5) y comentarios de texto para los emprendimientos.
Las valoraciones son únicas por usuario por negocio.

## Reglas de negocio
- Solo usuarios autenticados pueden valorar y comentar
- Un usuario puede dar solo 1 valoración por emprendimiento (UNIQUE constraint en BD)
- Pero puede dejar múltiples comentarios (en revisión — por ahora 1 por emprendimiento)
- La puntuación promedio se recalcula después de cada valoración
- Los comentarios no tienen aprobación previa (moderación futura)
- El administrador puede eliminar comentarios inapropiados

## Componente StarRating (Angular compartido)

```typescript
// shared/components/star-rating/star-rating.component.ts
// Props de entrada:
@Input() rating: number = 0;        // Puntuación actual (1-5)
@Input() readonly: boolean = false;  // true = solo mostrar, false = interactivo
@Input() size: 'sm' | 'md' | 'lg' = 'md';
@Output() ratingChange = new EventEmitter<number>();

// Template con Bootstrap Icons:
// bi-star-fill (amarillo) para estrellas llenas
// bi-star (gris) para estrellas vacías
// bi-star-half para media estrella (solo en modo readonly)
```

## Formulario de reseña (en business-profile)

```html
<div class="card mt-3" *ngIf="isAuthenticated && !userAlreadyReviewed">
  <div class="card-body">
    <h6 class="card-title">Escribe tu reseña</h6>
    <form [formGroup]="reviewForm" (ngSubmit)="submitReview()">
      <!-- Selector de estrellas -->
      <app-star-rating
        [readonly]="false"
        (ratingChange)="reviewForm.patchValue({puntuacion: $event})">
      </app-star-rating>

      <!-- Textarea Bootstrap -->
      <div class="mb-3 mt-2">
        <textarea
          formControlName="contenido"
          class="form-control"
          rows="3"
          placeholder="Cuéntanos tu experiencia...">
        </textarea>
        <div class="invalid-feedback">
          El comentario debe tener al menos 10 caracteres
        </div>
      </div>

      <button type="submit" class="btn btn-primary btn-sm"
              [disabled]="reviewForm.invalid || submitting">
        <span *ngIf="submitting" class="spinner-border spinner-border-sm me-1"></span>
        Publicar reseña
      </button>
    </form>
  </div>
</div>
```

## Distribución de estrellas (barra de progreso Bootstrap)

```html
<!-- Mostrar distribución 5★ a 1★ -->
<div *ngFor="let star of [5,4,3,2,1]" class="d-flex align-items-center gap-2 mb-1">
  <small>{{ star }}★</small>
  <div class="progress flex-grow-1" style="height: 8px">
    <div class="progress-bar bg-warning"
         [style.width.%]="getStarPercentage(star)">
    </div>
  </div>
  <small class="text-muted">{{ getStarCount(star) }}</small>
</div>
```

## Endpoints API
```
GET  /api/v1/businesses/{id}/reviews?page=1&size=5
  Response: { items, total, page, size, pages, distribucion_estrellas, puntuacion_promedio }

POST /api/v1/businesses/{id}/reviews
  Header: Authorization: Bearer <token>
  Body: { "contenido": "...", "puntuacion": 5 }
  Response 201: { "message": "Reseña publicada" }
  Response 400: { "detail": "Ya dejaste una reseña en este emprendimiento" }
  Response 401: { "detail": "Debes iniciar sesión para dejar una reseña" }

DELETE /api/v1/admin/reviews/{id}    (solo admin)
  Response 200: { "message": "Reseña eliminada" }
```

## Criterios de aceptación
- [ ] Las estrellas son interactivas al hacer hover en modo edición
- [ ] Un usuario no puede valorar dos veces el mismo negocio
- [ ] La puntuación promedio se actualiza inmediatamente tras valorar
- [ ] Visitante sin login ve botón "Inicia sesión para reseñar"
- [ ] La distribución de estrellas muestra porcentajes correctos

---

# SPEC-008 — Promociones

## Descripción
Los emprendedores pueden crear promociones temporales (ofertas, descuentos, combos)
visibles en su perfil público.

## Reglas de negocio
- Solo emprendedores con negocio `aprobado` pueden crear promociones
- Una promoción tiene fecha inicio y fecha fin opcionales
- Estados:
  - `activa`: fecha_fin >= hoy o sin fecha_fin
  - `vencida`: fecha_fin < hoy (se actualiza automáticamente)
  - `borrador`: creada pero no publicada aún
- Máximo 10 promociones activas simultáneas
- En el perfil público solo se muestran promociones con estado `activa`

## Validaciones
```
titulo:      requerido, mínimo 5 chars, máximo 150 chars
descripcion: opcional, máximo 300 chars
fecha_inicio: opcional, no puede ser fecha pasada
fecha_fin:   opcional, debe ser posterior a fecha_inicio
estado:      requerido, enum: activa|vencida|borrador
```

## UI en perfil público
```html
<!-- Sección promociones en perfil del negocio (solo si hay activas) -->
<div class="card mb-3" *ngFor="let promo of promocionesActivas">
  <div class="card-body">
    <div class="d-flex justify-content-between align-items-start">
      <h6 class="card-title text-primary">
        <i class="bi bi-tag-fill"></i> {{ promo.titulo }}
      </h6>
      <span class="badge bg-success">ACTIVA</span>
    </div>
    <p class="card-text small">{{ promo.descripcion }}</p>
    <small class="text-muted" *ngIf="promo.fecha_fin">
      <i class="bi bi-calendar3"></i>
      Válido hasta: {{ promo.fecha_fin | date:'dd/MM/yyyy' }}
    </small>
  </div>
</div>
```

## Endpoints API
```
GET    /api/v1/businesses/{id}/promotions          (público, solo activas)
GET    /api/v1/entrepreneur/promotions             (todas las del emprendedor)
POST   /api/v1/entrepreneur/promotions
  Body: { titulo, descripcion, fecha_inicio, fecha_fin, estado }
PUT    /api/v1/entrepreneur/promotions/{id}
DELETE /api/v1/entrepreneur/promotions/{id}
```

## Criterios de aceptación
- [ ] Solo se ven promociones activas en el perfil público
- [ ] El emprendedor puede crear, editar y eliminar sus promociones
- [ ] El sistema marca automáticamente como `vencida` si pasó la fecha_fin
- [ ] No se pueden crear más de 10 promociones activas
- [ ] El formulario valida que fecha_fin sea posterior a fecha_inicio

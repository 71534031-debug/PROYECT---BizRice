# BizRise — Componentes Angular

## Guía completa de componentes a crear
Todos los componentes son Standalone (Angular 17+).
Todos usan Bootstrap 5.3 para estilos.

---

## COMPONENTES COMPARTIDOS (shared/)

### 1. NavbarComponent
**Archivo:** `shared/components/navbar/navbar.component.ts`
**Descripción:** Barra de navegación principal usada en todas las páginas públicas.

**Comportamiento:**
- Logo "BizRise" en morado a la izquierda (text-primary fw-bold)
- Links: Home | Directorio | Categorías
- Barra de búsqueda Bootstrap (input-group) en el centro
- Botón "Ingresar" (btn-primary) a la derecha si NO está autenticado
- Si ESTÁ autenticado: dropdown Bootstrap con nombre del usuario, avatar (o iniciales), y opción "Mi Panel" + "Cerrar sesión"
- En móvil: Bootstrap Navbar Toggler (hamburguesa) que colapsa los links

```typescript
// Inputs/comportamiento:
// - Leer el estado de autenticación desde AuthService
// - Al hacer clic en "Ingresar" → navegar a /auth/login
// - Al hacer clic en nombre usuario → dropdown con opciones según rol
// - Rol emprendedor → "Mi Panel" lleva a /entrepreneur/dashboard
// - Rol administrador → "Mi Panel" lleva a /admin/dashboard
```

### 2. FooterComponent
**Archivo:** `shared/components/footer/footer.component.ts`
**Descripción:** Footer con Bootstrap grid de 4 columnas.

**Columnas:**
- Marca: Logo + descripción corta + íconos redes sociales
- Explorar: Links a Directorio, Categorías, Eventos
- Soporte: Links a Centro de Ayuda, Contacto, FAQ
- Legal: Links a Privacidad, Términos, Cookies
- Copyright al fondo: "© 2026 BizRise Huancayo. Todos los derechos reservados."

### 3. BusinessCardComponent
**Archivo:** `shared/components/business-card/business-card.component.ts`
**Descripción:** Tarjeta de negocio reutilizable en directorio y home.

```typescript
@Input() business: BusinessModel;
// Muestra: imagen portada, badge categoría, nombre, descripción (truncada 80 chars),
//          estrellas promedio, total valoraciones, distrito, estado abierto/cerrado
// Footer: botón "Ver Perfil" btn-outline-primary w-100
// Al hacer clic → navegar a /negocio/:id
```

### 4. StarRatingComponent
**Archivo:** `shared/components/star-rating/star-rating.component.ts`
**Descripción:** Selector/visualizador de estrellas 1-5.

```typescript
@Input() rating: number = 0;
@Input() readonly: boolean = true;
@Input() size: 'sm' | 'md' | 'lg' = 'md';
@Output() ratingChange = new EventEmitter<number>();
// Usa Bootstrap Icons: bi-star-fill (text-warning), bi-star, bi-star-half
// En modo interactivo: hover cambia el color de las estrellas
```

### 5. LoadingSpinnerComponent
**Archivo:** `shared/components/loading-spinner/loading-spinner.component.ts`

```html
<!-- Spinner Bootstrap centrado en la página -->
<div class="d-flex justify-content-center align-items-center py-5">
  <div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Cargando...</span>
  </div>
</div>
```

### 6. AlertMessageComponent
**Archivo:** `shared/components/alert-message/alert-message.component.ts`

```typescript
@Input() type: 'success' | 'danger' | 'warning' | 'info' = 'info';
@Input() message: string = '';
@Input() dismissible: boolean = true;
// Usa Bootstrap Alert con clase dinámica: alert-success, alert-danger, etc.
```

### 7. PaginationComponent
**Archivo:** `shared/components/pagination/pagination.component.ts`

```typescript
@Input() currentPage: number = 1;
@Input() totalPages: number = 1;
@Input() totalItems: number = 0;
@Output() pageChange = new EventEmitter<number>();
// Bootstrap Pagination con navegación anterior/siguiente y números de página
// Mostrar máximo 5 páginas visibles a la vez
```

---

## PÁGINAS PÚBLICAS (features/public/)

### 8. HomeComponent
**Ruta:** `/`
**Archivo:** `features/public/home/home.component.ts`

**Secciones a construir:**
```
1. Hero Section
   - Fondo: gradiente morado (usando Bootstrap + CSS custom mínimo)
   - Título grande blanco: "Descubre emprendedores locales en Huancayo"
   - Subtítulo: "Conectamos la fuerza del Valle del Mantaro con el futuro digital"
   - Input group Bootstrap: barra de búsqueda + select distrito + btn-light "Buscar ahora"
   - Al buscar → navegar a /directorio?busqueda=X&distrito=Y

2. Sección "Explora por Categoría"
   - Título + link "Ver todas →"
   - Row: 6 CategoryCards (col-4 col-md-2 cada una)
   - Cada card: ícono Bootstrap Icons grande + nombre categoría
   - Al hacer clic → /directorio?categoria=X

3. Sección "Negocios Destacados"
   - Cargar los 6 negocios más recientes aprobados (GET /businesses?size=6&orden=reciente)
   - Row de BusinessCard components (col-12 col-md-6 col-lg-4)

4. Sección CTA "Impulsa tu negocio con BizRise"
   - Fondo: bg-primary (morado)
   - Texto blanco
   - Botón "Registrar Negocio" btn-light → /auth/register
   - Botón "Iniciar con mi cuenta" btn-outline-light → /auth/login

5. Footer
```

### 9. DirectoryComponent
**Ruta:** `/directorio`
**Archivo:** `features/public/directory/directory.component.ts`

**Implementar:**
```typescript
// Query params: page, busqueda, categoria, distrito, orden
// Leer query params del URL al iniciar
// Actualizar URL cuando cambian los filtros (sin recargar página)
// Debounce 400ms en el input de búsqueda
// Limpiar filtros limpia también los query params del URL
```

### 10. CategoriesComponent
**Ruta:** `/categorias`
**Archivo:** `features/public/categories/categories.component.ts`
- Grid de 6 tarjetas grandes Bootstrap (col-12 col-md-6 col-lg-4)
- Imagen de fondo representativa, nombre y total de negocios
- Al hacer clic → /directorio?categoria=X

### 11. BusinessProfileComponent
**Ruta:** `/negocio/:id`
**Archivo:** `features/public/business-profile/business-profile.component.ts`
- Leer el id de la ruta con ActivatedRoute
- Cargar datos del negocio, productos y reseñas en paralelo (forkJoin)
- Sub-componentes: BusinessHero, BusinessProducts, BusinessReviews, BusinessContact

---

## MÓDULO AUTENTICACIÓN (features/auth/)

### 12. LoginComponent
**Ruta:** `/auth/login`

```typescript
// Reactive Form con:
// - correo: [required, email]
// - contrasena: [required, minLength(8)]
// Bootstrap validation: is-invalid cuando el campo se toca y tiene error
// Al submit exitoso: guardar tokens, redirigir según rol
// Bootstrap Alert danger si las credenciales son incorrectas
// Bootstrap Spinner en el botón mientras se procesa
```

### 13. RegisterComponent
**Ruta:** `/auth/register`

```typescript
// Reactive Form con:
// - nombre: [required, minLength(2)]
// - apellido: [required, minLength(2)]
// - correo: [required, email]
// - contrasena: [required, minLength(8), pattern con número]
// - confirmar_contrasena: [required, mustMatch('contrasena')]
// Validador custom: mustMatch para verificar que las contraseñas coincidan
```

---

## MÓDULO EMPRENDEDOR (features/entrepreneur/)

### 14. EntrepreneurLayoutComponent
**Archivo:** `features/entrepreneur/entrepreneur-layout.component.ts`
- Sidebar izquierda + router-outlet para el contenido
- En móvil: sidebar colapsable con Bootstrap Offcanvas

### 15. EntrepreneurDashboardComponent
**Ruta:** `/entrepreneur/dashboard`
- Cargar stats desde GET /entrepreneur/stats
- Mostrar métricas en Bootstrap Cards
- Lista de actividad reciente

### 16. MyBusinessComponent
**Ruta:** `/entrepreneur/my-business`
- Formulario con validación Reactive Forms
- Si no tiene negocio registrado: mostrar formulario de creación
- Si tiene negocio: mostrar formulario de edición con datos actuales
- Upload de imagen con preview Bootstrap

### 17. ProductListComponent + ProductFormComponent
**Ruta:** `/entrepreneur/products`
- Lista de productos + Modal Bootstrap para crear/editar
- Confirm dialog para eliminar

### 18. PromotionsComponent
**Ruta:** `/entrepreneur/promotions`
- CRUD de promociones con Bootstrap Cards y Modals

### 19. EntrepreneurSettingsComponent
**Ruta:** `/entrepreneur/settings`
- Formulario cambio de contraseña
- Switches de notificaciones (Bootstrap Form Switch)

---

## MÓDULO ADMINISTRADOR (features/admin/)

### 20. AdminLayoutComponent
**Archivo:** `features/admin/admin-layout.component.ts`
- Sidebar oscura (bg-dark) + router-outlet
- Badge contador de solicitudes pendientes en el link "Solicitudes"

### 21. AdminDashboardComponent
**Ruta:** `/admin/dashboard`
- Métricas globales + tabla de solicitudes recientes
- Acciones rápidas aprobar/rechazar desde la tabla

### 22. RequestsComponent
**Ruta:** `/admin/requests`
- Tabla Bootstrap con filtros y paginación
- Modales de confirmación para aprobar y rechazar

### 23. UsersComponent
**Ruta:** `/admin/users`
- Tabla Bootstrap con todos los usuarios
- Filtros por rol y estado
- Acciones suspender/activar

---

## SERVICIOS ANGULAR (core/services/)

### AuthService
```typescript
// Métodos:
login(correo, contrasena): Observable<AuthResponse>
register(datos): Observable<AuthResponse>
logout(): void
refreshToken(): Observable<TokenResponse>
getCurrentUser(): UserModel | null
isAuthenticated(): boolean
hasRole(rol: string): boolean
```

### BusinessService
```typescript
// Métodos:
getBusinesses(params): Observable<PaginatedResponse<Business>>
getBusinessById(id): Observable<Business>
getBusinessProducts(id, params): Observable<PaginatedResponse<Product>>
getBusinessReviews(id, params): Observable<PaginatedResponse<Review>>
submitReview(id, data): Observable<any>
```

### EntrepreneurService
```typescript
// Métodos:
getMyBusiness(): Observable<Business>
updateBusiness(data): Observable<any>
updateSchedule(horarios): Observable<any>
uploadBusinessImage(file): Observable<{imagen_url: string}>
getMyProducts(params): Observable<PaginatedResponse<Product>>
createProduct(formData): Observable<Product>
updateProduct(id, formData): Observable<Product>
deleteProduct(id): Observable<any>
getStats(): Observable<Stats>
```

### AdminService
```typescript
// Métodos:
getStats(): Observable<AdminStats>
getBusinesses(params): Observable<PaginatedResponse<Business>>
approveBusiness(id): Observable<any>
rejectBusiness(id, motivo): Observable<any>
getUsers(params): Observable<PaginatedResponse<User>>
suspendUser(id): Observable<any>
activateUser(id): Observable<any>
```

### CategoryService
```typescript
getCategories(): Observable<{items: Category[]}>
```

---

## MODELOS TYPESCRIPT (core/models/)

```typescript
// user.model.ts
export interface UserModel {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: 'visitante' | 'emprendedor' | 'administrador';
  estado: 'activo' | 'inactivo' | 'suspendido';
  avatar_url: string | null;
  fecha_registro: string;
}

// business.model.ts
export interface BusinessModel {
  id_emprendimiento: number;
  nombre: string;
  descripcion: string | null;
  telefono: string | null;
  direccion: string | null;
  distrito: string | null;
  horario_apertura: string | null;
  horario_cierre: string | null;
  esta_abierto: boolean;
  imagen_portada_url: string | null;
  estado_verificacion: 'pendiente' | 'aprobado' | 'rechazado';
  categoria: CategoryModel;
  puntuacion_promedio: number;
  total_valoraciones: number;
  redes_sociales: SocialNetwork[];
  promociones_activas: Promotion[];
}

// product.model.ts
export interface ProductModel {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen_url: string | null;
  estado_stock: 'disponible' | 'bajo_stock' | 'agotado';
}

// pagination.model.ts
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// auth.model.ts
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserModel;
}
```

---

## GUARDS (core/guards/)

```typescript
// auth.guard.ts — redirige a /auth/login si NO está autenticado
// no-auth.guard.ts — redirige a /entrepreneur/dashboard si YA está autenticado (para login/register)
// role.guard.ts — recibe rol requerido, redirige a / si no coincide
```

## INTERCEPTORS (core/interceptors/)

```typescript
// auth.interceptor.ts
// - Lee el access_token del TokenService
// - Agrega "Authorization: Bearer <token>" a TODA petición HTTP
// - Si recibe 401, intenta refresh token automáticamente
// - Si el refresh también falla, hace logout y redirige a /auth/login

// error.interceptor.ts
// - Captura errores HTTP globalmente
// - Muestra Bootstrap Toast con el mensaje de error
// - Para 500: "Error del servidor, intenta nuevamente"
// - Para 0 (sin conexión): "Sin conexión a internet"
```

# BizRise — Prompts de trabajo para Claude Code

## PROMPT INICIAL — Leer proyecto antes de tocar nada

```
Lee todos los archivos del proyecto actual.
Luego dime exactamente:
1. Qué versión de Angular está instalada
2. Si Bootstrap está en package.json y configurado en angular.json
3. Qué archivos existen en src/repositories/
4. Qué stored procedures existen en src/database/stored_procedures.sql
5. Qué componentes Angular están creados en features/
6. Qué errores hay al correr ng serve y uvicorn
No cambies nada, solo analiza y reporta.
```

---

## PROMPT A — Verificar backend completo

```
Verifica que el backend funciona correctamente:
1. Correr: uvicorn main:app --reload --port 8000
2. Abrir http://localhost:8000/docs y verificar que todos los endpoints aparecen
3. Verificar que src/repositories/ tiene: base_repository.py, user_repository.py,
   business_repository.py, product_repository.py, review_repository.py,
   promotion_repository.py, category_repository.py
4. Verificar que src/database/stored_procedures.sql tiene todos los SPs
5. Verificar que los controllers usan repositories y NO queries SQLAlchemy directas
6. Corregir cualquier error de importación o conexión que encuentres
7. Verificar que CORS está configurado para http://localhost:4200
```

---

## PROMPT B — Foundation Angular: Bootstrap + shell + rutas

```
Configura la base completa del frontend Angular:
1. Verificar que Bootstrap 5.3 y Bootstrap Icons están en package.json
   Si no: npm install bootstrap@5.3.3 bootstrap-icons@1.11.3
2. Configurar angular.json con Bootstrap CSS y JS en styles y scripts
3. Crear src/styles/_variables.scss con $primary: #6f42c1
4. Crear src/styles/styles.scss que importa _variables y estilos base del sidebar
5. Configurar app.config.ts con provideRouter y provideHttpClient con interceptores
6. Crear app.routes.ts con TODAS las rutas lazy:
   / → home, /directorio → directory, /categorias → categories,
   /negocio/:id → business-profile,
   /auth/login y /auth/register (canActivate: noAuthGuard),
   /entrepreneur/* (canActivate: authGuard + roleGuard emprendedor),
   /admin/* (canActivate: authGuard + roleGuard administrador)
7. Crear environments/environment.ts con apiUrl: http://localhost:8000/api/v1
```

---

## PROMPT C — Core Angular: servicios, guards, interceptores, modelos

```
Crea todo el módulo core/ de Angular:
1. Modelos en core/models/: user.model.ts, business.model.ts, product.model.ts,
   category.model.ts, review.model.ts, pagination.model.ts, auth.model.ts
2. AuthService con Signals: currentUser signal, login(), register(), logout(), refreshToken(),
   isAuthenticated(), hasRole()
3. ApiService base con: apiUrl desde environment, métodos get/post/put/delete genéricos
4. Guards: auth.guard.ts, no-auth.guard.ts, role.guard.ts
5. auth.interceptor.ts: agrega Bearer token, maneja 401 con refresh automático,
   si refresh falla hace logout y redirige a /auth/login
6. error.interceptor.ts: captura errores HTTP y muestra Bootstrap Toast
```

---

## PROMPT D — Componentes compartidos Angular

```
Crea todos los shared components con Bootstrap 5:
1. navbar: logo BizRise morado, links públicos, búsqueda input-group Bootstrap,
   botón Ingresar si no hay sesión, dropdown Bootstrap con nombre usuario si hay sesión,
   hamburguesa Bootstrap en móvil, routerLink a todas las secciones
2. footer: Bootstrap grid 4 columnas (Marca, Explorar, Soporte, Legal)
3. business-card: Bootstrap Card con imagen, badge categoría, nombre, estrellas,
   distrito, botón Ver Perfil, efecto hover con transform translateY
4. star-rating: Bootstrap Icons bi-star-fill/bi-star/bi-star-half,
   modo readonly y modo interactivo con hover
5. loading-spinner: Bootstrap spinner-border centrado en pantalla
6. pagination: Bootstrap Pagination component con inputs currentPage y totalPages
   y output pageChange
Todos standalone, todos usan Bootstrap 5 clases.
```

---

## PROMPT E — Páginas públicas: Home y Directorio

```
Crea home y directorio con Angular + Bootstrap 5:

HOME (/):
- Hero con gradiente morado, título, input-group búsqueda + select distrito + botón
- Al buscar: router.navigate a /directorio con queryParams
- Sección categorías: 6 cards Bootstrap col-4 col-md-2, cargar con CategoryService
- Sección negocios destacados: 6 cards col-12 col-md-6 col-lg-4, cargar con BusinessService
- Skeleton loader Bootstrap placeholder-glow mientras cargan los datos
- Sección CTA morada con 2 botones

DIRECTORIO (/directorio):
- Leer queryParams al iniciar (busqueda, categoria, distrito, orden, page)
- Sidebar col-lg-3: FormControl búsqueda con debounceTime(400) + distinctUntilChanged(),
  lista categorías Bootstrap, select distrito, select ordenamiento, botón limpiar filtros
- Al cambiar filtros: router.navigate con queryParamsHandling merge
- Grid col-lg-9: contador resultados signal, grid BusinessCard components, paginación
- @if(loading()) mostrar skeleton loaders Bootstrap placeholder-glow
- @if sin resultados: ilustración + texto + botón limpiar
```

---

## PROMPT F — Páginas públicas: Categorías y Perfil de Negocio

```
CATEGORÍAS (/categorias):
- Grid Bootstrap col-12 col-md-6 col-lg-4
- Cargar con CategoryService, al clic navegar a /directorio?categoria=id

PERFIL DE NEGOCIO (/negocio/:id):
- Leer id de ActivatedRoute params
- Cargar datos, productos y reseñas en paralelo con forkJoin
- Hero: imagen portada, badge verificado, nombre, estrellas, estado Abierto/Cerrado
- Estado Abierto/Cerrado: comparar hora actual con horario_apertura y horario_cierre
- Col-lg-8: descripción, horarios tabla Bootstrap, productos grid, reseñas lista
- Col-lg-4 sticky: card contacto, card ubicación con enlace Google Maps
- Distribución estrellas: Bootstrap progress bars con porcentajes
- Formulario reseña: solo si isAuthenticated(), Reactive Form con star-rating interactivo
- Validación: contenido mínimo 10 chars
- POST /businesses/id/reviews al enviar, Toast de éxito o error
```

---

## PROMPT G — Autenticación Angular

```
LOGIN (/auth/login):
- Bootstrap Card centrada vh-100
- Reactive Form: correo (required, email), contrasena (required, minLength 8)
- Bootstrap is-invalid al tocar campo con error + invalid-feedback
- Bootstrap Spinner en botón mientras loading()
- Al submit: authService.login(), redirigir según rol
- Bootstrap Alert danger si error de credenciales

REGISTER (/auth/register):
- Mismo diseño base
- Campos: nombre, apellido, correo, contrasena, confirmar_contrasena
- Validador custom mustMatch para contraseñas
- Al registrar exitosamente: redirigir a /entrepreneur/dashboard
```

---

## PROMPT H — Panel emprendedor completo

```
Layout entrepreneur-layout con sidebar Bootstrap + router-outlet.
Sidebar: logo, nav-links con Bootstrap Icons, routerLinkActive=active,
botón Cerrar Sesión, en móvil usar Bootstrap Offcanvas.

DASHBOARD (/entrepreneur/dashboard):
- 3 Bootstrap Cards métricas con signal de stats
- Lista actividad reciente
- Contador animado de 0 al valor real en 1 segundo

MY-BUSINESS (/entrepreneur/my-business):
- Reactive Form que carga datos actuales del negocio al iniciar
- Si no tiene negocio: Alert info con opción de crear
- Guardar cambios con PUT, Toast de confirmación
- Upload imagen con preview antes de subir

PRODUCTS (/entrepreneur/products):
- Grid productos Bootstrap, Bootstrap Modal para crear/editar
- Formulario en modal: nombre, descripcion, precio, estado_stock, imagen
- Soft delete con modal de confirmación
- Toast en cada operación

PROMOTIONS (/entrepreneur/promotions):
- Lista de promociones Bootstrap Cards
- Bootstrap Modal crear/editar con validación de fechas:
  fecha_inicio: noPassedDateValidator (no puede ser anterior a hoy)
  fecha_fin: noPassedDateValidator + endDateAfterStartValidator
  Mostrar Bootstrap invalid-feedback con el mensaje de error exacto
- Toast en cada operación

SETTINGS (/entrepreneur/settings):
- Cambio de contraseña con Reactive Form y validación mustMatch
- Bootstrap Form Switch para notificaciones
```

---

## PROMPT I — Panel administrador completo

```
Layout admin-layout con sidebar oscura bg-dark + router-outlet.
Badge contador solicitudes pendientes en el link Solicitudes.

DASHBOARD (/admin/dashboard):
- 3 métricas globales Bootstrap Cards
- Tabla Bootstrap solicitudes recientes con botones aprobar/rechazar directos
- Sección crecimiento mensual con barras CSS proporcionales

REQUESTS (/admin/requests):
- Filtros Bootstrap: search, select categoría, select estado
- Tabla Bootstrap responsive paginada
- Modal aprobar: confirmación simple
- Modal rechazar: textarea de motivo OBLIGATORIO (mínimo 20 chars)
- PUT approve/reject llama al SP correspondiente
- La fila se actualiza en la tabla sin recargar la página

USERS (/admin/users):
- Filtros: search, select rol, select estado
- Tabla Bootstrap con avatar iniciales, nombre, email, rol badge, estado badge, acciones
- Botón Suspender (activos) / Activar (suspendidos)
- Modal confirmación antes de cada acción
- No se puede suspender al propio admin logueado
```

---

## PROMPT J — Verificación final completa

```
Verifica que TODO el proyecto funciona de punta a punta:

BACKEND:
1. uvicorn main:app --reload → sin errores
2. Todos los endpoints en /docs responden
3. Los repositories usan execute_sp(), no ORM directo
4. CORS configurado para http://localhost:4200

FRONTEND:
1. ng serve → sin errores de compilación TypeScript
2. Sin errores en consola del navegador
3. Bootstrap 5 aplicado, color morado #6f42c1 visible
4. Guards protegen /entrepreneur/* y /admin/*
5. Interceptor agrega Bearer token

FLUJO COMPLETO DE PRUEBA:
- Registrar emprendedor → login → crear negocio → agregar producto →
  agregar promoción con fecha FUTURA (fecha pasada debe rechazarse) →
  cerrar sesión → login como admin → aprobar el negocio →
  verificar que aparece en directorio → buscarlo por nombre →
  ver su perfil con productos y promociones

BUGS YA CORREGIDOS verificar que siguen funcionando:
- Fechas en promociones: no acepta fechas pasadas
- Buscador: debounce 400ms, busca en nombre y descripción
- Todos los botones muestran spinner y toast

Corrige todo lo que encuentres roto y dame resumen final.
```

---

## PROMPT K — Desplegar stored procedures en BD

```
Ejecuta el archivo backend/src/database/stored_procedures.sql contra
la base de datos SQL Server.

Pasos:
1. Verificar que Docker está corriendo con SQL Server
2. Conectarse con pyodbc o sqlcmd a localhost:1433, base BizRiseDB
3. Ejecutar cada CREATE OR ALTER PROCEDURE del archivo
4. Verificar que todos los SPs se crearon:
   SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES
   WHERE ROUTINE_TYPE = 'PROCEDURE' ORDER BY ROUTINE_NAME
5. Reportar cuántos SPs se crearon y si hubo errores
```

---

## PROMPT L — Agregar nueva entidad (ej: backend)

```
Agrega una nueva entidad "X" al proyecto con el patrón establecido:

1. Crear tabla en schema.sql con todas las columnas y constraints
2. Crear stored procedures CRUD en stored_procedures.sql:
   sp_GetAllX, sp_GetXById, sp_CreateX, sp_UpdateX, sp_DeleteX
3. Crear modelo SQLAlchemy en src/models/x.py (solo para create_all)
4. Crear repositorio en src/repositories/x_repository.py
   que hereda BaseRepository y llama a los SPs
5. Crear controller en src/controllers/x_controller.py con:
   APIRouter + schemas Pydantic + endpoints que usan el repository
6. Registrar router en main.py
7. Verificar que el SP se ejecuta correctamente con curl o /docs

Sigue exactamente el mismo patrón de los controllers y repositories existentes.
```

---

## PROMPT M — Agregar nueva feature frontend

```
Agrega una nueva feature "X" al frontend Angular con el patrón establecido:

1. Crear carpeta src/app/features/x/ con component.ts, component.html, component.scss
2. Componente standalone con imports: CommonModule, ReactiveFormsModule, RouterLink
3. Service en core/services si no existe, con Signals:
   items = signal<T[]>([]), loading = signal(false), error = signal(null)
4. Llamadas HTTP con HttpClient desde environment.apiUrl
5. Template usa Bootstrap 5 clases exclusivamente
6. SCSS solo para casos que Bootstrap no cubre
7. Agregar ruta lazy en app.routes.ts
8. Formularios con Reactive Forms + validación is-invalid + submit spinner

Sigue exactamente el mismo patrón de los componentes existentes.
```

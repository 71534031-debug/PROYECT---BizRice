# SPEC-004 — Panel del Emprendedor

## Descripción
Panel privado para emprendedores autenticados. Permite gestionar su negocio,
productos, promociones y configuración de cuenta.

## Ruta base
`/entrepreneur/*` — Protegida por `role.guard.ts` (rol: emprendedor)

## Usuarios involucrados
- Emprendedor (autenticado)

---

## Estructura de navegación del panel

```
/entrepreneur/dashboard      → Panel de control (métricas)
/entrepreneur/my-business    → Información del negocio
/entrepreneur/products       → Gestión de productos
/entrepreneur/promotions     → Gestión de promociones
/entrepreneur/settings       → Configuración de cuenta
```

### Layout del panel (Bootstrap Sidebar)
```html
<!-- Estructura general de todas las páginas del panel -->
<div class="d-flex">
  <!-- Sidebar izquierda -->
  <nav class="sidebar bg-white border-end" style="width: 260px; min-height: 100vh">
    <div class="p-3 border-bottom">
      <span class="fw-bold text-primary fs-5">BizRise</span>
      <small class="d-block text-muted">Huancayo</small>
    </div>
    <ul class="nav flex-column p-2">
      <li class="nav-item">
        <a routerLink="/entrepreneur/dashboard" routerLinkActive="active"
           class="nav-link d-flex align-items-center gap-2">
          <i class="bi bi-grid"></i> Panel Control
        </a>
      </li>
      <li class="nav-item">
        <a routerLink="/entrepreneur/my-business" routerLinkActive="active"
           class="nav-link d-flex align-items-center gap-2">
          <i class="bi bi-shop"></i> Mi Negocio
        </a>
      </li>
      <li class="nav-item">
        <a routerLink="/entrepreneur/products" routerLinkActive="active"
           class="nav-link d-flex align-items-center gap-2">
          <i class="bi bi-box-seam"></i> Productos
        </a>
      </li>
      <li class="nav-item">
        <a routerLink="/entrepreneur/promotions" routerLinkActive="active"
           class="nav-link d-flex align-items-center gap-2">
          <i class="bi bi-megaphone"></i> Promociones
        </a>
      </li>
      <li class="nav-item">
        <a routerLink="/entrepreneur/settings" routerLinkActive="active"
           class="nav-link d-flex align-items-center gap-2">
          <i class="bi bi-gear"></i> Configuración
        </a>
      </li>
    </ul>
    <div class="p-3 border-top mt-auto">
      <button class="btn btn-outline-danger btn-sm w-100" (click)="logout()">
        <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
      </button>
    </div>
  </nav>

  <!-- Contenido principal -->
  <main class="flex-grow-1 p-4 bg-light">
    <router-outlet></router-outlet>
  </main>
</div>
```

---

## CU-001: Dashboard — Panel de Control

**Ruta:** `/entrepreneur/dashboard`

**Métricas a mostrar (Bootstrap Cards con íconos):**
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ VISITAS TOTALES │  │ CLICS EN PERFIL │  │ PRODUCTOS ACTIVOS│
│     1,482       │  │      324        │  │       48        │
│   +12% ↑        │  │    +5% ↑        │  │  Sin cambios    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Sección Actividad Reciente:**
- Lista Bootstrap con íconos de eventos recientes:
  - Nueva reseña recibida
  - Perfil verificado
  - Producto agregado
  - Nueva promoción activa

**Sección Banner CTA:**
- Card Bootstrap con fondo morado
- Texto: "¿Listo para expandir tu alcance?"
- Botones: "Crear Campaña" y "Explorar Guías"

**Endpoints API:**
```
GET /api/v1/entrepreneur/stats
  Response 200:
  {
    "visitas_totales": 1482,
    "visitas_incremento": 12,
    "clics_perfil": 324,
    "clics_incremento": 5,
    "productos_activos": 48,
    "estado_negocio": "aprobado",
    "actividad_reciente": [
      { "tipo": "resena", "mensaje": "Nueva reseña de Ricardo M.", "fecha": "2024-10-12T..." },
      { "tipo": "verificacion", "mensaje": "Perfil verificado", "fecha": "2024-10-11T..." }
    ]
  }
```

---

## CU-002: Mi Negocio

**Ruta:** `/entrepreneur/my-business`

**Formulario Bootstrap (Reactive Forms) con dos columnas:**

```
COLUMNA IZQUIERDA (col-lg-8):
├── Card "Información General"
│   ├── Input: Nombre del Negocio (requerido)
│   ├── Select Bootstrap: Categoría (requerido)
│   ├── Textarea: Biografía/Descripción (min 50 chars)
│   ├── Input: Teléfono
│   ├── Input: Dirección
│   ├── Select: Distrito (El Tambo, Huancayo, Chilca, etc.)
│   └── Botón "Guardar Cambios" btn-primary
│
├── Card "Horarios de Atención"
│   ├── Por cada día (Lunes a Domingo):
│   │   ├── Checkbox Bootstrap "Abierto"
│   │   ├── Input type="time" Apertura
│   │   └── Input type="time" Cierre
│   └── Botón "Guardar Horarios" btn-primary
│
└── Card "Imagen de Portada"
    ├── Preview imagen actual (img-fluid rounded)
    ├── Input type="file" (Bootstrap custom file)
    └── Botón "Subir imagen" btn-outline-primary

COLUMNA DERECHA (col-lg-4):
├── Card "Promociones Activas"
│   ├── Lista de promociones con Badge de estado
│   └── Botón "Nueva Promoción" btn-outline-primary
│
└── Card "Vista Previa del Perfil"
    └── Imagen del negocio en miniatura + nombre + badge categoría
```

**Endpoints API:**
```
GET /api/v1/entrepreneur/business
  Response 200: { datos completos del negocio del emprendedor autenticado }

PUT /api/v1/entrepreneur/business
  Header: Authorization: Bearer <token>
  Body: { nombre, id_categoria, descripcion, telefono, direccion, distrito }
  Response 200: { "message": "Negocio actualizado correctamente" }

PUT /api/v1/entrepreneur/business/schedule
  Body: {
    "horarios": [
      { "dia": "lunes", "abierto": true, "apertura": "08:00", "cierre": "20:00" },
      { "dia": "domingo", "abierto": false }
    ]
  }
  Response 200: { "message": "Horarios actualizados" }

POST /api/v1/entrepreneur/business/image
  Body: multipart/form-data { "imagen": File }
  Response 200: { "imagen_url": "/uploads/negocios/..." }
```

---

## CU-003: Gestión de Productos

**Ruta:** `/entrepreneur/products`

**Layout:**
```
- Header: "Gestión de Productos" + Botón "Añadir Nuevo Producto" btn-primary
- Search input Bootstrap para buscar en mis productos
- Grid de productos (col-12 col-md-6 col-lg-4):
  └── Card Bootstrap por producto:
      ├── Imagen del producto (card-img-top)
      ├── Badge estado stock (disponible=success, bajo_stock=warning, agotado=danger)
      ├── Nombre y precio en S/
      ├── Descripción breve
      └── Botones: "Editar" btn-outline-primary | "Eliminar" btn-outline-danger
- Card especial "+ Nuevo Producto" con borde punteado (dashed border)
```

**Modal Bootstrap para Agregar/Editar producto:**
```
Modal tamaño lg con Reactive Form:
├── Input: Nombre del producto (requerido)
├── Textarea: Descripción
├── Input type="number": Precio en S/ (step=0.01)
├── Select: Estado stock (disponible/bajo_stock/agotado)
├── Input file: Imagen del producto
│   └── Preview de imagen seleccionada
└── Footer Modal:
    ├── Botón "Cancelar" btn-secondary
    └── Botón "Guardar Producto" btn-primary
```

**Modal de confirmación para eliminar:**
```
Modal Bootstrap pequeño:
├── "¿Eliminar este producto?"
├── "Esta acción no se puede deshacer"
└── Botones: "Cancelar" btn-secondary | "Eliminar" btn-danger
```

**Endpoints API:**
```
GET /api/v1/entrepreneur/products
  Response 200: { "items": [...productos...], "total": 10 }

POST /api/v1/entrepreneur/products
  Body: multipart/form-data {
    nombre, descripcion, precio, estado_stock, imagen (File)
  }
  Response 201: { producto creado }

PUT /api/v1/entrepreneur/products/{id}
  Body: multipart/form-data { campos a actualizar }
  Response 200: { producto actualizado }

DELETE /api/v1/entrepreneur/products/{id}
  Response 200: { "message": "Producto eliminado" }
```

---

## CU-004: Gestión de Promociones

**Ruta:** `/entrepreneur/promotions`

**Layout:**
```
- Header + Botón "Nueva Promoción" btn-primary
- Lista Bootstrap de promociones con Card por cada una:
  ├── Título de la promoción
  ├── Descripción
  ├── Fechas: inicio → fin
  ├── Badge estado: activa=success, vencida=secondary, borrador=warning
  └── Botones: Editar | Eliminar
```

**Endpoints API:**
```
GET /api/v1/entrepreneur/promotions
POST /api/v1/entrepreneur/promotions
  Body: { titulo, descripcion, fecha_inicio, fecha_fin, estado }
PUT /api/v1/entrepreneur/promotions/{id}
DELETE /api/v1/entrepreneur/promotions/{id}
```

---

## CU-005: Configuración de Cuenta

**Ruta:** `/entrepreneur/settings`

**Sección 1 — Ajustes de cuenta:**
```
Card Bootstrap:
├── Input: Email de contacto (deshabilitado, solo lectura)
├── Sección Contraseña:
│   ├── Input: Contraseña actual
│   ├── Input: Nueva contraseña
│   ├── Input: Confirmar nueva contraseña
│   └── Botón "Cambiar contraseña" btn-primary
```

**Sección 2 — Preferencias de notificaciones:**
```
Card Bootstrap:
├── Form Switch Bootstrap:
│   ├── Email — "Resúmenes semanales y alertas de sistema" (ON por defecto)
│   └── WhatsApp — "Notificaciones instantáneas de pedidos" (OFF por defecto)
└── Botón "Guardar Cambios" btn-primary
```

**Endpoints API:**
```
PUT /api/v1/entrepreneur/settings/password
  Body: { contrasena_actual, nueva_contrasena, confirmar_contrasena }
  Response 200: { "message": "Contraseña actualizada" }
  Response 400: { "detail": "Contraseña actual incorrecta" }

PUT /api/v1/entrepreneur/settings/notifications
  Body: { email_notificaciones: bool, whatsapp_notificaciones: bool }
  Response 200: { "message": "Preferencias guardadas" }
```

---

## Reglas de negocio
- Un emprendedor solo puede tener 1 emprendimiento registrado
- Si su negocio está en estado `pendiente` o `rechazado`, mostrar banner Bootstrap Alert warning explicando el estado
- No puede agregar productos si el negocio no está `aprobado`
- Al cargar el panel, verificar siempre el estado actual del negocio

---

## Criterios de aceptación
- [ ] El sidebar muestra la página activa resaltada con routerLinkActive
- [ ] Las métricas del dashboard cargan desde el backend
- [ ] El formulario de Mi Negocio carga los datos actuales del emprendimiento
- [ ] Se pueden guardar cambios del negocio con Bootstrap Toast de confirmación
- [ ] Se pueden agregar productos con imagen mediante modal Bootstrap
- [ ] Se puede editar y eliminar productos con confirmación
- [ ] Se puede cambiar la contraseña con validación de coincidencia
- [ ] Los switches de notificaciones guardan el estado correctamente
- [ ] En móvil el sidebar se oculta y aparece con botón hamburguesa

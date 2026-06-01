# SPEC-002 — Directorio Público y Búsqueda

## Descripción
Módulo principal de exploración. Permite a cualquier visitante (sin login) buscar,
filtrar y explorar emprendimientos locales de Huancayo organizados por categorías.

## Usuarios involucrados
- Visitante (sin autenticación)
- Emprendedor (también puede navegar)

---

## Casos de uso

### CU-001: Ver directorio general
**Flujo:**
1. Usuario entra a `/directorio`
2. Sistema carga emprendimientos con `estado_verificacion = 'aprobado'`
3. Se muestran en tarjetas Bootstrap (Cards) de 3 columnas en desktop, 2 en tablet, 1 en móvil
4. Paginación: 12 negocios por página con componente Bootstrap Pagination

### CU-002: Buscar por palabra clave
**Flujo:**
1. Usuario escribe en barra de búsqueda
2. Sistema filtra por nombre del negocio o descripción (LIKE %término%)
3. Resultados se actualizan en tiempo real (debounce 400ms)
4. Si no hay resultados: mostrar mensaje Bootstrap Alert info

### CU-003: Filtrar por categoría
**Flujo:**
1. Usuario selecciona una categoría (Gastronomía, Textilería, etc.)
2. Sistema filtra emprendimientos por `id_categoria`
3. La categoría activa se resalta visualmente con Bootstrap Badge active

### CU-004: Filtrar por distrito
**Flujo:**
1. Usuario selecciona distrito del dropdown Bootstrap
2. Distritos disponibles: El Tambo, Huancayo, Chilca, San Agustín, Pilcomayo, Otros
3. Sistema filtra por campo `distrito` en tabla Emprendimientos

### CU-005: Ordenar resultados
**Flujo:**
1. Usuario selecciona orden en dropdown Bootstrap Select
2. Opciones: Mejor valorados, Más recientes, Nombre A-Z
3. Sistema reordena resultados

### CU-006: Ver categorías (página separada)
**Ruta:** `/categorias`
**Flujo:**
1. Sistema muestra las 6 categorías en tarjetas grandes con imagen
2. Al hacer clic en categoría → redirige a `/directorio?categoria=X`

---

## UI — Componentes Bootstrap requeridos

### Página Home (`/`)
```
- Hero section: Jumbotron custom con fondo morado degradado
  - Título: "Descubre emprendedores locales en Huancayo"
  - Barra de búsqueda: Input group Bootstrap (input + botón)
  - Dropdown: "Todo Huancayo" con distritos

- Sección Categorías:
  - Row con 6 Cards Bootstrap (col-6 col-md-4 col-lg-2)
  - Cada card: ícono Bootstrap Icons + nombre categoría

- Sección Negocios Destacados:
  - Row con BusinessCard components (col-12 col-md-6 col-lg-4)
  - Solo los 6 más recientes aprobados

- Sección CTA (Call to Action):
  - Fondo morado, texto blanco
  - Dos botones: "Registrar Negocio" (btn-light) y "Iniciar Sesión" (btn-outline-light)

- Footer Bootstrap: 4 columnas (Marca, Explorar, Soporte, Legal)
```

### Página Directorio (`/directorio`)
```
- Navbar Bootstrap fija arriba
- Sidebar de filtros (col-lg-3):
  - Search input Bootstrap
  - Lista de categorías con Bootstrap List Group
  - Dropdown de distritos
  - Select de ordenamiento
  - Botón "Limpiar filtros" btn-outline-secondary

- Grid de resultados (col-lg-9):
  - Counter: "X negocios encontrados" (text-muted)
  - Grid de BusinessCard components
  - Bootstrap Pagination al fondo
  - Bootstrap Spinner mientras carga
```

### Componente BusinessCard (compartido)
```html
<div class="card h-100 shadow-sm border-0">
  <img class="card-img-top" [src]="business.imagen_portada_url">
  <div class="card-body">
    <span class="badge bg-primary mb-2">{{ business.categoria }}</span>
    <h5 class="card-title">{{ business.nombre }}</h5>
    <p class="card-text text-muted small">{{ business.descripcion | truncate:80 }}</p>
    <div class="d-flex align-items-center gap-1">
      <!-- Estrellas con Bootstrap Icons -->
      <i class="bi bi-star-fill text-warning"></i>
      <span>{{ business.puntuacion_promedio }}</span>
      <span class="text-muted small">({{ business.total_valoraciones }})</span>
    </div>
    <small class="text-muted">
      <i class="bi bi-geo-alt"></i> {{ business.distrito }}
    </small>
  </div>
  <div class="card-footer bg-transparent">
    <a [routerLink]="['/negocio', business.id_emprendimiento]"
       class="btn btn-outline-primary w-100 btn-sm">
      Ver Perfil
    </a>
  </div>
</div>
```

---

## Endpoints API requeridos

```
GET /api/v1/businesses
  Query params:
    - page: int (default 1)
    - size: int (default 12)
    - busqueda: str (opcional)
    - categoria: int (opcional, id_categoria)
    - distrito: str (opcional)
    - orden: str (opcional: 'valoracion', 'reciente', 'nombre')

  Response 200:
  {
    "items": [
      {
        "id_emprendimiento": 1,
        "nombre": "Café del Valle",
        "descripcion": "...",
        "categoria": "Gastronomía",
        "id_categoria": 1,
        "distrito": "El Tambo",
        "imagen_portada_url": "/uploads/negocios/cafe-del-valle.jpg",
        "estado_verificacion": "aprobado",
        "puntuacion_promedio": 4.5,
        "total_valoraciones": 23,
        "horario_apertura": "08:00",
        "horario_cierre": "20:00"
      }
    ],
    "total": 45,
    "page": 1,
    "size": 12,
    "pages": 4
  }

GET /api/v1/categories
  Response 200:
  {
    "items": [
      { "id_categoria": 1, "nombre": "Gastronomía", "descripcion": "...", "total_negocios": 15 }
    ]
  }
```

---

## Reglas de negocio
- Solo mostrar emprendimientos con `estado_verificacion = 'aprobado'`
- La puntuación promedio se calcula en tiempo real desde tabla Valoraciones
- Si un negocio no tiene imagen, mostrar imagen placeholder con iniciales del nombre
- El campo búsqueda hace LIKE en nombre Y descripcion del emprendimiento

---

## Criterios de aceptación
- [ ] Visitante ve 12 negocios por página sin necesidad de login
- [ ] Búsqueda filtra por nombre y descripción con debounce
- [ ] Filtro por categoría funciona combinado con búsqueda
- [ ] Filtro por distrito funciona combinado con otros filtros
- [ ] Paginación navega correctamente entre páginas
- [ ] En móvil las tarjetas se muestran en 1 columna
- [ ] Spinner aparece mientras carga, desaparece al terminar
- [ ] Sin resultados muestra mensaje amigable

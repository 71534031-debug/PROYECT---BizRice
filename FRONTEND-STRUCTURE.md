# BizRise — Estructura Frontend (HTML + CSS + JS puros)

## Reglas fundamentales
- CADA página tiene 3 archivos: .html + .css + .js
- NUNCA estilos inline en el HTML
- NUNCA JS dentro de etiquetas <script> en el HTML
- Bootstrap 5.3 via CDN en todos los HTML
- Bootstrap Icons via CDN en todos los HTML
- fetch() para llamadas al backend

---

## Plantilla base para TODOS los archivos HTML

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BizRise — [Nombre de la página]</title>

  <!-- Bootstrap 5.3 CSS -->
  <link rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
  <!-- Bootstrap Icons -->
  <link rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
  <!-- CSS global BizRise -->
  <link rel="stylesheet" href="../../assets/css/global.css">
  <!-- CSS de esta página -->
  <link rel="stylesheet" href="./NOMBRE-PAGINA.css">
</head>
<body>

  <!-- Navbar (se carga dinámicamente via JS) -->
  <div id="navbar-container"></div>

  <!-- CONTENIDO PRINCIPAL DE LA PÁGINA AQUÍ -->
  <main>
    <!-- ... -->
  </main>

  <!-- Footer (se carga dinámicamente via JS) -->
  <div id="footer-container"></div>

  <!-- Bootstrap 5.3 JS Bundle -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <!-- JS global BizRise -->
  <script src="../../assets/js/api.js"></script>
  <script src="../../assets/js/auth.js"></script>
  <!-- JS de esta página -->
  <script src="./NOMBRE-PAGINA.js"></script>
</body>
</html>
```

---

## frontend/assets/css/global.css

```css
/* =============================================
   BIZRISE — CSS GLOBAL
   Variables, estilos compartidos en toda la app
   ============================================= */

/* Variables CSS */
:root {
  --bizrise-primary:       #6f42c1;
  --bizrise-primary-dark:  #5a32a3;
  --bizrise-primary-light: #8b5cf6;
  --bizrise-primary-bg:    #f3eeff;
  --bizrise-sidebar-width: 260px;
}

/* Sobreescribir color primario Bootstrap */
.btn-primary {
  background-color: var(--bizrise-primary);
  border-color: var(--bizrise-primary);
}
.btn-primary:hover {
  background-color: var(--bizrise-primary-dark);
  border-color: var(--bizrise-primary-dark);
}
.btn-outline-primary {
  color: var(--bizrise-primary);
  border-color: var(--bizrise-primary);
}
.btn-outline-primary:hover {
  background-color: var(--bizrise-primary);
  border-color: var(--bizrise-primary);
}
.text-primary  { color: var(--bizrise-primary) !important; }
.bg-primary    { background-color: var(--bizrise-primary) !important; }
.border-primary { border-color: var(--bizrise-primary) !important; }

/* Badge primario */
.badge.bg-primary { background-color: var(--bizrise-primary) !important; }

/* Links */
a { color: var(--bizrise-primary); }
a:hover { color: var(--bizrise-primary-dark); }

/* Navbar brand */
.navbar-brand {
  color: var(--bizrise-primary) !important;
  font-weight: 700;
  font-size: 1.4rem;
}

/* Card hover general */
.card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}
.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,.12) !important;
}

/* Sidebar paneles */
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  width: var(--bizrise-sidebar-width);
  min-width: var(--bizrise-sidebar-width);
}
.sidebar .nav-link {
  color: #495057;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.sidebar .nav-link:hover,
.sidebar .nav-link.active {
  background-color: var(--bizrise-primary-bg);
  color: var(--bizrise-primary);
  font-weight: 600;
}

/* Sidebar admin (oscura) */
.sidebar-dark .nav-link {
  color: rgba(255,255,255,0.8);
}
.sidebar-dark .nav-link:hover,
.sidebar-dark .nav-link.active {
  background-color: rgba(255,255,255,0.1);
  color: #fff;
}

/* Estrellas valoración */
.stars .bi-star-fill { color: #ffc107; }
.stars .bi-star      { color: #dee2e6; }
.stars .bi-star-half { color: #ffc107; }

/* Imagen portada negocio */
.business-cover {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 12px;
}

/* Placeholder sin imagen */
.img-placeholder {
  background: linear-gradient(135deg, #e8d5ff, #d4b8ff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bizrise-primary);
  font-size: 2rem;
  border-radius: 8px;
}

/* Toast container global */
#toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
}

/* Loading spinner overlay */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255,255,255,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
}

/* Producto card imagen */
.product-img {
  height: 160px;
  object-fit: cover;
}

/* Badge de stock */
.badge-disponible { background-color: #198754; }
.badge-bajo_stock { background-color: #ffc107; color: #000; }
.badge-agotado    { background-color: #dc3545; }
```

---

## frontend/assets/js/api.js

```javascript
/**
 * BIZRISE — API Helper
 * Funciones base para llamadas fetch() al backend
 */

const API_URL = 'http://localhost:8000/api/v1';

function getAuthHeaders() {
  const token = localStorage.getItem('bizrise_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function apiGet(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: getAuthHeaders()
  });
  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return apiGet(endpoint);
    redirectToLogin();
    return null;
  }
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error del servidor');
  }
  return response.json();
}

async function apiPost(endpoint, data) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return apiPost(endpoint, data);
    redirectToLogin();
    return null;
  }
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error del servidor');
  }
  return response.json();
}

async function apiPut(endpoint, data) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error del servidor');
  }
  return response.json();
}

async function apiDelete(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error del servidor');
  }
  return response.json();
}

async function apiPostForm(endpoint, formData) {
  const token = localStorage.getItem('bizrise_access_token');
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData  // FormData para imágenes
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al subir archivo');
  }
  return response.json();
}

async function tryRefreshToken() {
  const refresh = localStorage.getItem('bizrise_refresh_token');
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh })
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('bizrise_access_token', data.access_token);
    return true;
  } catch {
    return false;
  }
}

function redirectToLogin() {
  localStorage.removeItem('bizrise_access_token');
  localStorage.removeItem('bizrise_refresh_token');
  localStorage.removeItem('bizrise_user');
  window.location.href = '/frontend/pages/auth/login.html';
}

// Mostrar toast Bootstrap
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container')
    || (() => {
      const div = document.createElement('div');
      div.id = 'toast-container';
      div.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999';
      document.body.appendChild(div);
      return div;
    })();

  const id = 'toast-' + Date.now();
  const bgClass = type === 'success' ? 'text-bg-success'
                : type === 'danger'  ? 'text-bg-danger'
                : type === 'warning' ? 'text-bg-warning'
                : 'text-bg-info';

  container.insertAdjacentHTML('beforeend', `
    <div id="${id}" class="toast align-items-center ${bgClass} border-0 mb-2" role="alert">
      <div class="d-flex">
        <div class="toast-body fw-semibold">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto"
                data-bs-dismiss="toast"></button>
      </div>
    </div>
  `);

  const toastEl = document.getElementById(id);
  new bootstrap.Toast(toastEl, { delay: 3500 }).show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}
```

---

## frontend/assets/js/auth.js

```javascript
/**
 * BIZRISE — Auth Helper
 * Manejo de sesión JWT en el frontend
 */

function getCurrentUser() {
  const raw = localStorage.getItem('bizrise_user');
  return raw ? JSON.parse(raw) : null;
}

function isAuthenticated() {
  return !!localStorage.getItem('bizrise_access_token') && !!getCurrentUser();
}

function hasRole(role) {
  const user = getCurrentUser();
  return user?.rol === role;
}

/**
 * Llamar al inicio de páginas privadas.
 * Redirige si no está autenticado o no tiene el rol requerido.
 */
function requireAuth(requiredRole = null) {
  if (!isAuthenticated()) {
    window.location.href = '/frontend/pages/auth/login.html';
    return false;
  }
  if (requiredRole && !hasRole(requiredRole)) {
    window.location.href = '/frontend/pages/home/home.html';
    return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem('bizrise_access_token');
  localStorage.removeItem('bizrise_refresh_token');
  localStorage.removeItem('bizrise_user');
  window.location.href = '/frontend/pages/home/home.html';
}

function saveSession(data) {
  localStorage.setItem('bizrise_access_token', data.access_token);
  localStorage.setItem('bizrise_refresh_token', data.refresh_token);
  localStorage.setItem('bizrise_user', JSON.stringify(data.user));
}

// Cargar un componente HTML en un contenedor
async function loadComponent(containerId, componentPath) {
  try {
    const res = await fetch(componentPath);
    const html = await res.text();
    document.getElementById(containerId).innerHTML = html;
  } catch (e) {
    console.error('Error cargando componente:', componentPath, e);
  }
}

// Generar estrellas HTML
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    '<i class="bi bi-star-fill"></i>'.repeat(full) +
    (half ? '<i class="bi bi-star-half"></i>' : '') +
    '<i class="bi bi-star"></i>'.repeat(empty)
  );
}

// Formatear precio en soles
function formatPrice(price) {
  if (!price) return 'Consultar precio';
  return `S/ ${parseFloat(price).toFixed(2)}`;
}

// Truncar texto
function truncate(text, limit = 80) {
  if (!text) return '';
  return text.length > limit ? text.substring(0, limit) + '...' : text;
}
```

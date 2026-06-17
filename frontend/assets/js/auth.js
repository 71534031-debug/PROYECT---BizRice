/**
 * BIZRISE — Auth Helper
 * Manejo de sesión JWT en el frontend
 */

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('bizrise_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem('bizrise_user');
    return null;
  }
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
    window.location.href = '/pages/auth/login.html';
    return false;
  }
  if (requiredRole && !hasRole(requiredRole)) {
    window.location.href = '/pages/home/home.html';
    return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem('bizrise_access_token');
  localStorage.removeItem('bizrise_refresh_token');
  localStorage.removeItem('bizrise_user');
  window.location.href = '/pages/home/home.html';
}
const handleLogout = logout;

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

// Generar URL de imagen placeholder profesional via picsum
function bizFallbackImg(seed, w = 800, h = 400) {
  return seed ? `https://picsum.photos/seed/${encodeURIComponent(String(seed))}/${w}/${h}` : '../../assets/images/placeholder.svg';
}

// Asignar imagen con fallback progresivo: API -> picsum -> SVG
function setBizImage(imgEl, apiUrl, seed) {
  if (apiUrl) {
    imgEl.src = apiUrl;
    imgEl.onerror = () => { imgEl.src = bizFallbackImg(seed); };
  } else {
    imgEl.src = bizFallbackImg(seed);
  }
}

// Helper para template literals: `${imgSrc(apiUrl, seed)}`
function imgSrc(apiUrl, seed) {
  return apiUrl || bizFallbackImg(seed);
}

// ─── NOTIFICACIONES ────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'ahora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

function notifIcon(tipo) {
  const icons = {
    'pendiente': 'bi-shop text-warning',
    'nuevo_usuario': 'bi-person-plus text-primary',
    'promocion_vencida': 'bi-megaphone text-danger',
  };
  return icons[tipo] || 'bi-bell text-muted';
}

async function initNotifications() {
  const badge = document.getElementById('notif-badge');
  const list = document.getElementById('notif-list');
  if (!list) return;

  try {
    const data = await apiGet('/admin/notifications');
    const pendientes = data.filter(n => n.tipo === 'pendiente').length;

    if (badge) {
      if (pendientes > 0) {
        badge.textContent = pendientes;
        badge.classList.remove('d-none');
      } else {
        badge.classList.add('d-none');
      }
    }

    if (data.length === 0) {
      list.innerHTML = '<div class="dropdown-item text-muted small text-center py-3">No hay notificaciones nuevas</div>';
      return;
    }

    list.innerHTML = data.slice(0, 10).map(n => `
      <div class="dropdown-item d-flex gap-2 align-items-start py-2">
        <i class="bi ${notifIcon(n.tipo)} mt-1"></i>
        <div class="min-w-0">
          <div class="small fw-semibold text-truncate">${escHtml(n.titulo)}</div>
          <div class="small text-muted">${escHtml(n.descripcion)} &mdash; ${timeAgo(n.fecha)}</div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    list.innerHTML = '<div class="dropdown-item text-muted small text-center py-3">Error al cargar notificaciones</div>';
  }
}

function escHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

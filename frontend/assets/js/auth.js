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

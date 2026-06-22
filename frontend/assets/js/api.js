/**
 * BIZRISE — API Helper
 * Funciones base para llamadas fetch() al backend
 * Soporta múltiples entornos: dev local y producción (Render)
 */

function getApiUrl() {
  if (window.BIZRISE_API_URL) return window.BIZRISE_API_URL;
  const host = window.location.hostname;
  const port = window.location.port;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:8000/api/v1';
  }
  if (port === '5500' || host.includes('bizrise')) {
    return 'https://proyect-bizrice-1.onrender.com/api/v1';
  }
  return 'https://proyect-bizrice-1.onrender.com/api/v1';
}

const API_URL = getApiUrl();
console.log('[BizRise] API_URL =', API_URL);

function getAuthHeaders() {
  const token = localStorage.getItem('bizrise_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function apiGet(endpoint) {
  try {
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
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      console.error('[BizRise] Red error — ¿el backend está caído?', API_URL);
      throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
    }
    throw err;
  }
}

async function _request(method, endpoint, body, isForm = false) {
  try {
    const token = localStorage.getItem('bizrise_access_token');
    const headers = isForm
      ? (token ? { 'Authorization': `Bearer ${token}` } : {})
      : getAuthHeaders();
    const opts = { method, headers };
    if (body) opts.body = isForm ? body : JSON.stringify(body);

    const response = await fetch(`${API_URL}${endpoint}`, opts);
    if (response.status === 401) {
      const refreshed = await tryRefreshToken();
      if (refreshed) return _request(method, endpoint, body, isForm);
      redirectToLogin();
      return null;
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      console.error('[BizRise] Red error — ¿el backend está caído?', API_URL + endpoint);
      throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
    }
    throw err;
  }
}

function apiGet(endpoint) { return _request('GET', endpoint); }
function apiPost(endpoint, data) { return _request('POST', endpoint, data); }
function apiPut(endpoint, data) { return _request('PUT', endpoint, data); }
function apiDelete(endpoint) { return _request('DELETE', endpoint); }
function apiPostForm(endpoint, formData) { return _request('POST', endpoint, formData, true); }
function apiPutForm(endpoint, formData) { return _request('PUT', endpoint, formData, true); }

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
  window.location.href = '/pages/auth/login.html';
}

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

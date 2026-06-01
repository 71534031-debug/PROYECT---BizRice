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
  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return apiPut(endpoint, data);
    redirectToLogin();
    return null;
  }
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
  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return apiDelete(endpoint);
    redirectToLogin();
    return null;
  }
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error del servidor');
  }
  return response.json();
}

async function apiPutForm(endpoint, formData) {
  const token = localStorage.getItem('bizrise_access_token');
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'PUT',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData
  });
  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return apiPutForm(endpoint, formData);
    redirectToLogin();
    return null;
  }
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al subir archivo');
  }
  return response.json();
}

async function apiPostForm(endpoint, formData) {
  const token = localStorage.getItem('bizrise_access_token');
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData
  });
  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return apiPostForm(endpoint, formData);
    redirectToLogin();
    return null;
  }
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

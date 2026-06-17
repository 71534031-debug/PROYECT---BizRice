/**
 * BIZRISE — Inicio de Sesión
 */

document.addEventListener('DOMContentLoaded', () => {
  if (isAuthenticated()) {
    redirigirPorRol();
    return;
  }

  document.getElementById('login-form').addEventListener('submit', handleLogin);

  const forgotLink = document.getElementById('forgot-link');
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => e.preventDefault());
  }
});

async function handleLogin(e) {
  e.preventDefault();

  const correo = document.getElementById('login-correo').value.trim();
  const contrasena = document.getElementById('login-contrasena').value;
  const errorEl = document.getElementById('login-error');
  const btn = document.getElementById('btn-login');

  errorEl.classList.add('d-none');

  let valid = true;

  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    document.getElementById('login-correo').classList.add('is-invalid');
    valid = false;
  } else {
    document.getElementById('login-correo').classList.remove('is-invalid');
  }

  if (!contrasena) {
    document.getElementById('login-contrasena').classList.add('is-invalid');
    valid = false;
  } else {
    document.getElementById('login-contrasena').classList.remove('is-invalid');
  }

  if (!valid) return;

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Ingresando...';

  try {
    const data = await apiPost('/auth/login', {
      correo: correo,
      contrasena: contrasena
    });

    saveSession(data);
    redirigirPorRol();
  } catch (err) {
    errorEl.textContent = err.message || 'Error al iniciar sesión';
    errorEl.classList.remove('d-none');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Ingresar';
  }
}

function redirigirPorRol() {
  const user = getCurrentUser();
  if (user.rol === 'administrador') {
    window.location.href = '/pages/admin/dashboard.html';
  } else if (user.rol === 'cliente') {
    window.location.href = '/pages/directory/directory.html';
  } else {
    window.location.href = '/pages/entrepreneur/dashboard.html';
  }
}

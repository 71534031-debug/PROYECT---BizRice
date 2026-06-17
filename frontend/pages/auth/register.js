/**
 * BIZRISE — Registro de Usuario
 */

document.addEventListener('DOMContentLoaded', () => {
  if (isAuthenticated()) {
    redirigirPorRol();
    return;
  }

  document.getElementById('register-form').addEventListener('submit', handleRegister);

  document.getElementById('reg-contrasena').addEventListener('input', validarCoincidencia);
  document.getElementById('reg-confirmar').addEventListener('input', validarCoincidencia);
});

function validarCoincidencia() {
  const pass = document.getElementById('reg-contrasena').value;
  const confirm = document.getElementById('reg-confirmar').value;

  if (confirm.length === 0) {
    document.getElementById('reg-confirmar').classList.remove('is-invalid');
    return;
  }

  if (pass !== confirm) {
    document.getElementById('reg-confirmar').classList.add('is-invalid');
  } else {
    document.getElementById('reg-confirmar').classList.remove('is-invalid');
  }
}

async function handleRegister(e) {
  e.preventDefault();

  const nombre = document.getElementById('reg-nombre').value.trim();
  const apellido = document.getElementById('reg-apellido').value.trim();
  const correo = document.getElementById('reg-correo').value.trim();
  const contrasena = document.getElementById('reg-contrasena').value;
  const confirmar = document.getElementById('reg-confirmar').value;

  const errorEl = document.getElementById('register-error');
  const btn = document.getElementById('btn-register');

  errorEl.classList.add('d-none');

  let valid = true;

  if (!nombre) {
    document.getElementById('reg-nombre').classList.add('is-invalid');
    valid = false;
  } else {
    document.getElementById('reg-nombre').classList.remove('is-invalid');
  }

  if (!apellido) {
    document.getElementById('reg-apellido').classList.add('is-invalid');
    valid = false;
  } else {
    document.getElementById('reg-apellido').classList.remove('is-invalid');
  }

  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    document.getElementById('reg-correo').classList.add('is-invalid');
    valid = false;
  } else {
    document.getElementById('reg-correo').classList.remove('is-invalid');
  }

  if (!contrasena || contrasena.length < 8 || !/\d/.test(contrasena)) {
    document.getElementById('reg-contrasena').classList.add('is-invalid');
    valid = false;
  } else {
    document.getElementById('reg-contrasena').classList.remove('is-invalid');
  }

  if (!confirmar || contrasena !== confirmar) {
    document.getElementById('reg-confirmar').classList.add('is-invalid');
    valid = false;
  } else {
    document.getElementById('reg-confirmar').classList.remove('is-invalid');
  }

  if (!valid) return;

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Creando cuenta...';

  try {
    const data = await apiPost('/auth/register', {
      nombre: nombre,
      apellido: apellido,
      correo: correo,
      contrasena: contrasena,
      confirmar_contrasena: confirmar
    });

    saveSession(data);

    const user = getCurrentUser();
    if (user.rol === 'administrador') {
      window.location.href = '/pages/admin/dashboard.html';
    } else {
      window.location.href = '/pages/entrepreneur/dashboard.html';
    }
  } catch (err) {
    errorEl.textContent = err.message || 'Error al registrar';
    errorEl.classList.remove('d-none');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-person-plus"></i> Crear cuenta';
  }
}

function redirigirPorRol() {
  const user = getCurrentUser();
  if (user.rol === 'administrador') {
    window.location.href = '/pages/admin/dashboard.html';
  } else {
    window.location.href = '/pages/entrepreneur/dashboard.html';
  }
}

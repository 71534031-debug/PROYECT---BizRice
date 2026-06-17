/**
 * BIZRISE — Configuración del Emprendedor
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth('emprendedor')) return;

  await loadComponent('sidebar-container', '../../components/entrepreneur-sidebar/sidebar.html');

  const user = getCurrentUser();
  document.getElementById('settings-email').value = user.correo || '';

  document.getElementById('password-form').addEventListener('submit', cambiarContrasena);
  document.getElementById('btn-save-notif').addEventListener('click', guardarNotificaciones);

  document.getElementById('pass-nueva').addEventListener('input', validarCoincidencia);
  document.getElementById('pass-confirmar').addEventListener('input', validarCoincidencia);

  const soporteLink = document.getElementById('soporte-link');
  if (soporteLink) {
    soporteLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Función próximamente disponible', 'info');
    });
  }

  cargarPreferenciasNotif();
});

async function cargarPreferenciasNotif() {
  try {
    const prefs = await apiGet('/entrepreneur/settings/notifications');
    if (prefs.email_notificaciones !== undefined) document.getElementById('notif-email').checked = prefs.email_notificaciones;
    if (prefs.whatsapp_notificaciones !== undefined) document.getElementById('notif-whatsapp').checked = prefs.whatsapp_notificaciones;
  } catch (e) {
    // non-critical
  }
}

function validarCoincidencia() {
  const nueva = document.getElementById('pass-nueva').value;
  const confirm = document.getElementById('pass-confirmar').value;

  if (confirm.length === 0) return;

  if (nueva !== confirm) {
    document.getElementById('pass-confirmar').classList.add('is-invalid');
  } else {
    document.getElementById('pass-confirmar').classList.remove('is-invalid');
  }
}

async function cambiarContrasena(e) {
  e.preventDefault();

  const actual = document.getElementById('pass-actual').value;
  const nueva = document.getElementById('pass-nueva').value;
  const confirm = document.getElementById('pass-confirmar').value;
  const btn = document.getElementById('btn-change-password');

  let valid = true;

  if (!actual) {
    document.getElementById('pass-actual').classList.add('is-invalid');
    valid = false;
  } else {
    document.getElementById('pass-actual').classList.remove('is-invalid');
  }

  if (!nueva || nueva.length < 8 || !/\d/.test(nueva)) {
    document.getElementById('pass-nueva').classList.add('is-invalid');
    valid = false;
  } else {
    document.getElementById('pass-nueva').classList.remove('is-invalid');
  }

  if (!confirm || nueva !== confirm) {
    document.getElementById('pass-confirmar').classList.add('is-invalid');
    valid = false;
  } else {
    document.getElementById('pass-confirmar').classList.remove('is-invalid');
  }

  if (!valid) return;

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Cambiando...';

  try {
    await apiPut('/entrepreneur/settings/password', {
      contrasena_actual: actual,
      nueva_contrasena: nueva,
      confirmar_contrasena: confirm
    });
    showToast('Contraseña actualizada exitosamente', 'success');
    document.getElementById('password-form').reset();
  } catch (e) {
    showToast(e.message || 'Error al cambiar contraseña', 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Cambiar contraseña';
  }
}

async function guardarNotificaciones() {
  const prefs = {
    email_notificaciones: document.getElementById('notif-email').checked,
    whatsapp_notificaciones: document.getElementById('notif-whatsapp').checked
  };

  try {
    await apiPut('/entrepreneur/settings/notifications', prefs);
    localStorage.setItem('bizrise_notif_prefs', JSON.stringify(prefs));
    showToast('Preferencias guardadas correctamente', 'success');
  } catch (e) {
    showToast(e.message || 'Error al guardar preferencias', 'danger');
  }
}

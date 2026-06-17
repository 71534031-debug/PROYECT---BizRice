/**
 * BIZRISE — Panel de Control del Emprendedor
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth('emprendedor')) return;

  await loadComponent('sidebar-container', '../../components/entrepreneur-sidebar/sidebar.html');

  await cargarStats();

  const user = getCurrentUser();
  document.getElementById('bienvenida').textContent = `Bienvenido, ${user.nombre}`;
});

function irAPromociones() {
  window.location.href = '/pages/entrepreneur/promotions.html';
}

function irAMiNegocio() {
  window.location.href = '/pages/entrepreneur/my-business.html';
}

function mostrarPremium() {
  const modal = new bootstrap.Modal(document.getElementById('modal-premium'));
  modal.show();
}

async function cargarStats() {
  try {
    const data = await apiGet('/entrepreneur/stats');
    renderizarMetricas(data);
    renderizarActividad(data.actividad_reciente || []);
  } catch (e) {
    console.error('Error cargando stats:', e);
  }
}

function renderizarMetricas(data) {
  const container = document.getElementById('metricas-cards');

  container.innerHTML = `
    <div class="col-md-4">
      <div class="card metrica-card shadow-sm p-3">
        <div class="d-flex align-items-center gap-3">
          <div class="icon-wrapper" style="background: #e8d5ff;">
            <i class="bi bi-eye" style="color: var(--bizrise-primary);"></i>
          </div>
          <div>
            <small class="text-muted">Visitas totales</small>
            <div class="numero">${data.visitas_totales || 0}</div>
            <small class="text-success">
              <i class="bi bi-arrow-up"></i> ${data.visitas_incremento || 0}%
            </small>
          </div>
        </div>
      </div>
    </div>

    <div class="col-md-4">
      <div class="card metrica-card shadow-sm p-3">
        <div class="d-flex align-items-center gap-3">
          <div class="icon-wrapper" style="background: #fff3cd;">
            <i class="bi bi-hand-index-thumb" style="color: #856404;"></i>
          </div>
          <div>
            <small class="text-muted">Clics en perfil</small>
            <div class="numero">${data.clics_perfil || 0}</div>
            <small class="text-success">
              <i class="bi bi-arrow-up"></i> ${data.clics_incremento || 0}%
            </small>
          </div>
        </div>
      </div>
    </div>

    <div class="col-md-4">
      <div class="card metrica-card shadow-sm p-3">
        <div class="d-flex align-items-center gap-3">
          <div class="icon-wrapper" style="background: #d4edda;">
            <i class="bi bi-box-seam" style="color: #155724;"></i>
          </div>
          <div>
            <small class="text-muted">Productos activos</small>
            <div class="numero">${data.productos_activos || 0}</div>
            <small class="text-muted">En tu catálogo</small>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12">
      <div class="card metrica-card shadow-sm p-3">
        <div class="d-flex align-items-center gap-3">
          <div class="icon-wrapper" style="background: #cce5ff;">
            <i class="bi bi-shield-check" style="color: #004085;"></i>
          </div>
          <div>
            <small class="text-muted">Estado del negocio</small>
            <div class="numero d-flex align-items-center gap-2">
              <span class="badge fs-6 ${data.estado_negocio === 'aprobado' ? 'bg-success' : data.estado_negocio === 'rechazado' ? 'bg-danger' : 'bg-warning text-dark'}">
                ${data.estado_negocio || 'Sin negocio'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderizarActividad(actividades) {
  const container = document.getElementById('actividad-lista');
  const footer = document.getElementById('actividad-footer');

  if (!actividades || actividades.length === 0) {
    container.innerHTML = '<p class="text-muted small mb-0">No hay actividad reciente</p>';
    if (footer) footer.classList.add('d-none');
    return;
  }

  if (footer) footer.classList.remove('d-none');
  container.innerHTML = actividades.map(a => {
    let icono = 'bi-chat-square-text';
    let color = 'var(--bizrise-primary-bg)';
    let iconColor = 'var(--bizrise-primary)';

    if (a.tipo === 'resena') {
      icono = 'bi-star';
      color = '#fff3cd';
      iconColor = '#856404';
    } else if (a.tipo === 'verificacion') {
      icono = 'bi-patch-check';
      color = '#d4edda';
      iconColor = '#155724';
    } else if (a.tipo === 'producto') {
      icono = 'bi-box-seam';
      color = '#cce5ff';
      iconColor = '#004085';
    }

    return `
      <div class="actividad-item">
        <div class="icono" style="background: ${color}; color: ${iconColor};">
          <i class="bi ${icono}"></i>
        </div>
        <div>
          <p class="mb-0 small">${a.mensaje}</p>
          <small class="text-muted">${new Date(a.fecha).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * BIZRISE — Gestión de Promociones
 */

let editandoPromocion = false;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth('emprendedor')) return;

  await loadComponent('sidebar-container', '../../components/entrepreneur-sidebar/sidebar.html');

  await cargarPromociones();

  document.getElementById('promocion-form').addEventListener('submit', guardarPromocion);
  document.getElementById('btn-confirmar-eliminar-promo').addEventListener('click', eliminarPromocion);

  document.getElementById('promotions-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-promo-action]');
    if (!btn) return;
    if (btn.dataset.promoAction === 'edit') abrirModalPromocion(parseInt(btn.dataset.promoId));
    if (btn.dataset.promoAction === 'delete') confirmarEliminarPromo(parseInt(btn.dataset.promoId));
  });

  const btnNueva = document.getElementById('btn-nueva-promocion');
  if (btnNueva) btnNueva.addEventListener('click', () => abrirModalPromocion());
});

async function cargarPromociones() {
  try {
    const items = await apiGet('/entrepreneur/promotions');
    renderizarPromociones(items || []);
  } catch (e) {
    console.error('Error cargando promociones:', e);
  }
}

function renderizarPromociones(items) {
  const container = document.getElementById('promotions-list');

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-body text-center py-5">
            <i class="bi bi-megaphone fs-1 text-muted mb-3 d-block"></i>
            <p class="text-muted mb-0">No tienes promociones aún. Crea tu primera promoción.</p>
          </div>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(p => {
    const estadoClass = p.estado === 'activa' ? 'bg-success'
                      : p.estado === 'vencida' ? 'bg-secondary'
                      : 'bg-warning text-dark';
    const estadoLabel = p.estado === 'activa' ? 'Activa'
                       : p.estado === 'vencida' ? 'Vencida'
                       : 'Borrador';

    const fechas = [];
    if (p.fecha_inicio) fechas.push(`Inicio: ${new Date(p.fecha_inicio).toLocaleDateString('es-PE')}`);
    if (p.fecha_fin) fechas.push(`Fin: ${new Date(p.fecha_fin).toLocaleDateString('es-PE')}`);

    return `
      <div class="col-12 col-md-6">
        <div class="card promo-card shadow-sm">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h6 class="card-title mb-0">${p.titulo}</h6>
              <span class="badge ${estadoClass}">${estadoLabel}</span>
            </div>
            <p class="card-text text-muted small mb-2">${p.descripcion || 'Sin descripción'}</p>
            <small class="text-muted d-block mb-3">
              <i class="bi bi-calendar"></i> ${fechas.join(' | ') || 'Sin fechas'}
            </small>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-primary btn-sm flex-grow-1"
                      data-promo-action="edit" data-promo-id="${p.id_promocion}">
                <i class="bi bi-pencil"></i> Editar
              </button>
              <button class="btn btn-outline-danger btn-sm"
                      data-promo-action="delete" data-promo-id="${p.id_promocion}">
                <i class="bi bi-trash"></i> Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function abrirModalPromocion(id) {
  editandoPromocion = !!id;
  document.getElementById('promocion-form').reset();
  document.getElementById('promocion-id').value = '';
  document.getElementById('promo-estado').value = 'activa';

  if (id) {
    document.getElementById('modal-promocion-label').textContent = 'Editar Promoción';
    document.getElementById('btn-save-promocion').innerHTML = '<i class="bi bi-check-lg"></i> Actualizar Promoción';

    const items = await apiGet('/entrepreneur/promotions');
    const promo = (items || []).find(p => p.id_promocion === id);
    if (promo) {
      document.getElementById('promocion-id').value = promo.id_promocion;
      document.getElementById('promo-titulo').value = promo.titulo || '';
      document.getElementById('promo-descripcion').value = promo.descripcion || '';
      document.getElementById('promo-inicio').value = promo.fecha_inicio || '';
      document.getElementById('promo-fin').value = promo.fecha_fin || '';
      document.getElementById('promo-estado').value = promo.estado || 'activa';
    }
  } else {
    document.getElementById('modal-promocion-label').textContent = 'Nueva Promoción';
    document.getElementById('btn-save-promocion').innerHTML = '<i class="bi bi-check-lg"></i> Guardar Promoción';
  }
}

const MAX_PROMOS_ACTIVAS = 10;

async function guardarPromocion(e) {
  e.preventDefault();
  const id = document.getElementById('promocion-id').value;
  const inicio = document.getElementById('promo-inicio').value;
  const fin = document.getElementById('promo-fin').value;
  const estado = document.getElementById('promo-estado').value;

  if (inicio && fin && new Date(fin) < new Date(inicio)) {
    showToast('La fecha de fin debe ser posterior a la fecha de inicio', 'warning');
    return;
  }

  if (!id && estado === 'activa') {
    const items = await apiGet('/entrepreneur/promotions');
    const activas = (items || []).filter(p => p.estado === 'activa').length;
    if (activas >= MAX_PROMOS_ACTIVAS) {
      showToast(`Máximo ${MAX_PROMOS_ACTIVAS} promociones activas simultáneas`, 'warning');
      return;
    }
  }

  const payload = {
    titulo: document.getElementById('promo-titulo').value.trim(),
    descripcion: document.getElementById('promo-descripcion').value.trim(),
    fecha_inicio: inicio || null,
    fecha_fin: fin || null,
    estado: estado
  };

  try {
    if (id) {
      await apiPut(`/entrepreneur/promotions/${id}`, payload);
      showToast('Promoción actualizada', 'success');
    } else {
      await apiPost('/entrepreneur/promotions', payload);
      showToast('Promoción creada exitosamente', 'success');
    }

    bootstrap.Modal.getInstance(document.getElementById('modal-promocion')).hide();
    await cargarPromociones();
  } catch (e) {
    showToast(e.message || 'Error al guardar promoción', 'danger');
  }
}

function confirmarEliminarPromo(id) {
  document.getElementById('eliminar-promocion-id').value = id;
  bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-eliminar-promo')).show();
}

async function eliminarPromocion() {
  const id = document.getElementById('eliminar-promocion-id').value;
  try {
    await apiDelete(`/entrepreneur/promotions/${id}`);
    showToast('Promoción eliminada', 'success');
    bootstrap.Modal.getInstance(document.getElementById('modal-eliminar-promo')).hide();
    await cargarPromociones();
  } catch (e) {
    showToast(e.message || 'Error al eliminar promoción', 'danger');
  }
}

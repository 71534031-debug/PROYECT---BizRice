/**
 * BIZRISE — Admin Dashboard
 */

let rechazarBusinessId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth('administrador')) return;

  await loadComponent('sidebar-container', '../../components/admin-sidebar/sidebar.html');

  // Event delegation for table actions
  document.getElementById('tabla-pendientes').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    if (btn.dataset.action === 'approve') {
      await aprobarSolicitud(id);
    } else if (btn.dataset.action === 'reject') {
      abrirRechazo(id);
    }
  });

  document.getElementById('btn-confirmar-rechazo').addEventListener('click', async () => {
    const modal = bootstrap.Modal.getInstance(document.getElementById('modal-rechazar'));
    await confirmarRechazo(modal);
  });

  document.getElementById('btn-tutoriales').addEventListener('click', (e) => {
    showToast('Función de tutoriales próximamente disponible', 'info');
  });

  await cargarStats();
});

async function cargarStats() {
  try {
    const stats = await apiGet('/admin/stats');

    document.getElementById('total-negocios').textContent = stats.total_negocios ?? 0;
    document.getElementById('total-pendientes').textContent = stats.pendientes ?? 0;
    document.getElementById('nuevos-usuarios').textContent = stats.nuevos_usuarios_mes ?? 0;

    const trendEl = document.getElementById('trend-negocios');
    const c = stats.crecimiento_porcentaje || 0;
    trendEl.textContent = (c >= 0 ? '+' : '') + c + '%';

    if (stats.solicitudes_recientes && stats.solicitudes_recientes.length > 0) {
      renderPendientes(stats.solicitudes_recientes);
    }

    if (stats.crecimiento_mensual && stats.crecimiento_mensual.length > 0) {
      renderChart(stats.crecimiento_mensual);
    }
  } catch (e) {
    showToast('Error al cargar estadísticas', 'danger');
  }
}

function renderPendientes(lista) {
  const tbody = document.getElementById('tabla-pendientes');
  tbody.innerHTML = lista.map(b => {
    const date = b.fecha_registro ? new Date(b.fecha_registro).toLocaleDateString() : '-';
    return `<tr>
      <td class="px-4 py-3 fw-semibold">${b.nombre}</td>
      <td class="px-4 py-3"><span class="badge bg-secondary bg-opacity-10 text-secondary">${b.categoria || '-'}</span></td>
      <td class="px-4 py-3 small text-muted">${date}</td>
      <td class="px-4 py-3 text-end">
        <button class="btn btn-success btn-sm me-1" data-action="approve" data-id="${b.id_emprendimiento}" title="Aprobar">
          <i class="bi bi-check-lg"></i>
        </button>
        <button class="btn btn-danger btn-sm" data-action="reject" data-id="${b.id_emprendimiento}" title="Rechazar">
          <i class="bi bi-x-lg"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

async function aprobarSolicitud(id) {
  try {
    await apiPut(`/admin/businesses/${id}/approve`);
    showToast('Negocio aprobado exitosamente', 'success');
    await cargarStats();
  } catch (e) {
    showToast(e.message || 'Error al aprobar', 'danger');
  }
}

function abrirRechazo(id) {
  rechazarBusinessId = id;
  document.getElementById('motivo-rechazo').value = '';
  document.getElementById('motivo-rechazo').classList.remove('is-invalid');
  const modal = new bootstrap.Modal(document.getElementById('modal-rechazar'));
  modal.show();
}

async function confirmarRechazo(modal) {
  const motivo = document.getElementById('motivo-rechazo').value.trim();
  if (!motivo) {
    document.getElementById('motivo-rechazo').classList.add('is-invalid');
    return;
  }
  document.getElementById('motivo-rechazo').classList.remove('is-invalid');

  try {
    await apiPut(`/admin/businesses/${rechazarBusinessId}/reject`, { motivo });
    showToast('Negocio rechazado', 'warning');
    modal.hide();
    await cargarStats();
  } catch (e) {
    showToast(e.message || 'Error al rechazar', 'danger');
  }
}

function renderChart(meses) {
  const container = document.getElementById('chart-bars');
  const max = Math.max(...meses.map(m => m.total || 0), 1);
  container.innerHTML = meses.map(m => {
    const h = ((m.total || 0) / max) * 160;
    return `<div class="chart-bar" style="height: ${h}px;" title="${m.mes}: ${m.total}">
      <span class="chart-bar-label">${m.mes || ''}</span>
    </div>`;
  }).join('');
}

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

  document.getElementById('motivo-rechazo').addEventListener('input', function () {
    const counter = document.getElementById('motivo-counter');
    if (counter) counter.textContent = `${this.value.length}/20 caracteres`;
  });

  document.getElementById('btn-tutoriales').addEventListener('click', (e) => {
    showToast('Función de tutoriales próximamente disponible', 'info');
  });

  document.getElementById('search-top').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      window.location.href = '/pages/admin/requests.html?busqueda=' + encodeURIComponent(e.target.value);
    }
  });

  await Promise.all([
    cargarStats(),
    cargarTopProductos(),
  ]);
  initNotifications();
  if (window.updateSidebarBadge) window.updateSidebarBadge();
});

async function cargarStats() {
  try {
    const [stats, metrics] = await Promise.all([
      apiGet('/admin/stats'),
      apiGet('/admin/dashboard/metrics')
    ]);

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

    document.getElementById('total-usuarios').textContent = metrics.total_usuarios ?? 0;
    document.getElementById('total-productos').textContent = metrics.total_productos ?? 0;
    document.getElementById('total-ventas').textContent = metrics.ventas_entregadas ?? 0;
    document.getElementById('ingresos-totales').textContent = formatPrice(metrics.ingresos_totales || 0) + ' ingresos';

    // productos_mas_vendidos ahora se carga via cargarTopProductos()
  } catch (e) {
    showToast('Error al cargar estadísticas', 'danger');
  }
}

async function cargarTopProductos() {
  const container = document.getElementById('top-productos-body');
  try {
    const items = await apiGet('/admin/top-products');
    if (items && items.length > 0) {
      renderTopProductos(items);
    } else {
      container.innerHTML = '<p class="text-muted small text-center py-4 mb-0">Aún no hay productos registrados</p>';
    }
  } catch (e) {
    container.innerHTML = '<p class="text-muted small text-center py-4 mb-0">Error al cargar productos</p>';
  }
}

function renderTopProductos(items) {
  const container = document.getElementById('top-productos-body');
  const stars = (n) => {
    const full = Math.round(n);
    return '&#9733;'.repeat(full) + '&#9734;'.repeat(5 - full);
  };
  container.innerHTML = '<div class="list-group list-group-flush">' +
    items.map((p, i) => {
      const medal = i === 0 ? '1' : i === 1 ? '2' : i === 2 ? '3' : (i + 1);
      const medalCls = ['text-warning', 'text-secondary', 'text-muted', 'text-muted'][i] || 'text-muted';
      return '<div class="list-group-item px-4 py-3 d-flex align-items-center gap-3 border-0 border-bottom">' +
        '<span class="fw-bold ' + medalCls + '" style="width:20px;font-size:1.1rem">#' + medal + '</span>' +
        '<img src="' + escHtml(p.imagen_url || 'https://picsum.photos/seed/' + p.id_producto + '/48/48') + '" alt="" class="rounded" width="40" height="40" style="object-fit:cover" onerror="this.style.display=\'none\'">' +
        '<div class="flex-grow-1 min-w-0">' +
          '<div class="fw-semibold small text-truncate">' + escHtml(p.nombre) + '</div>' +
          '<small class="text-muted text-truncate d-block">' + escHtml(p.negocio) + '</small>' +
        '</div>' +
        '<div class="text-end" style="min-width:70px">' +
          '<div class="small lh-1">' + stars(p.puntuacion) + '</div>' +
          '<small class="text-muted" style="font-size:0.7rem">' + p.puntuacion.toFixed(1) + ' (' + p.total_votos + ')</small>' +
        '</div>' +
      '</div>';
    }).join('') +
    '</div>';
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

function aprobarSolicitud(id) {
  if (confirm('¿Estás seguro de aprobar este negocio?')) {
    confirmarAprobacion(id);
  }
}

async function confirmarAprobacion(id) {
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
  if (!motivo || motivo.length < 20) {
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

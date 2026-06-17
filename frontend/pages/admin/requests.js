/**
 * BIZRISE — Admin Solicitudes
 */

let currentPage = 1;
let totalPages = 1;
let approveId = null;
let rejectId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth('administrador')) return;

  await loadComponent('sidebar-container', '../../components/admin-sidebar/sidebar.html');

  await cargarCategorias();

  document.getElementById('filtros-form').addEventListener('submit', (e) => {
    e.preventDefault();
    currentPage = 1;
    cargarSolicitudes();
  });

  // Event delegation for table actions
  document.getElementById('requests-tbody').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    const name = btn.dataset.name;
    if (btn.dataset.action === 'approve') {
      abrirAprobar(id, name);
    } else if (btn.dataset.action === 'reject') {
      abrirRechazar(id, name);
    } else if (btn.dataset.action === 'info') {
      showToast('Motivo: ' + btn.dataset.motivo, 'warning');
    }
  });

  document.getElementById('btn-confirmar-aprobar').addEventListener('click', confirmarAprobar);
  document.getElementById('btn-confirmar-rechazo').addEventListener('click', confirmarRechazo);
  document.getElementById('btn-exportar').addEventListener('click', exportarCSV);
  document.getElementById('btn-filtros').addEventListener('click', () => {
    document.getElementById('search-input').focus();
    document.getElementById('search-input').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('search-top').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('search-input').value = e.target.value;
      currentPage = 1;
      cargarSolicitudes();
    }
  });

  document.getElementById('motivo-rechazo').addEventListener('input', function () {
    const counter = document.getElementById('motivo-counter');
    if (counter) counter.textContent = `${this.value.length}/20 caracteres`;
  });

  await cargarSolicitudes();
  initNotifications();
  if (window.updateSidebarBadge) window.updateSidebarBadge();
});

async function cargarCategorias() {
  try {
    const cats = await apiGet('/categories');
    const select = document.getElementById('select-categoria');
    const items = cats.items || cats || [];
    select.innerHTML = '<option value="">Todas las categor&iacute;as</option>' +
      items.map(c => `<option value="${c.id_categoria}">${escHtml(c.nombre)}</option>`).join('');
  } catch (e) {
    // non-critical
  }
}

async function cargarStatsCounters() {
  try {
    const stats = await apiGet('/admin/stats');
    document.getElementById('counter-total').textContent = stats.total_negocios ?? 0;
    document.getElementById('counter-pendientes').textContent = stats.pendientes ?? 0;
    document.getElementById('counter-aprobadas').textContent = (stats.total_negocios - stats.pendientes) ?? 0;
    if (window.updateSidebarBadge) window.updateSidebarBadge();
  } catch (e) {
    // non-critical
  }
}

async function cargarSolicitudes() {
  try {
    const search = document.getElementById('search-input').value;
    const categoria = document.getElementById('select-categoria').value;
    const estado = document.getElementById('select-estado').value;

    const params = new URLSearchParams();
    if (search) params.append('busqueda', search);
    if (categoria) params.append('categoria', categoria);
    if (estado) params.append('estado', estado);
    params.append('page', currentPage);
    params.append('size', '10');

    const data = await apiGet('/admin/businesses?' + params.toString());

    renderTable(data.items || []);
    renderPagination(data.pages || 1);

    // Fetch stats counters from the stats endpoint
    cargarStatsCounters();
  } catch (e) {
    showToast('Error al cargar solicitudes', 'danger');
  }
}

function renderTable(lista) {
  const tbody = document.getElementById('requests-tbody');
  if (!lista || lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-5">No se encontraron solicitudes</td></tr>';
    return;
  }

  tbody.innerHTML = lista.map(b => {
    const date = b.fecha_registro ? escHtml(new Date(b.fecha_registro).toLocaleDateString()) : '-';
    const estado = escHtml((b.estado_verificacion || 'pendiente').toLowerCase());
    const badgeClass = estado === 'aprobado' ? 'bg-success'
      : estado === 'rechazado' ? 'bg-danger'
      : 'bg-warning text-dark';
    const ownerEmail = escHtml((b.propietario && b.propietario.correo) || '-');
    const ownerName = b.propietario ? escHtml(b.propietario.nombre || '') + ' ' + escHtml(b.propietario.apellido || '') : '-';
    const safeName = escHtml(b.nombre || '');

    let actions = '';
    if (estado === 'pendiente') {
      actions = `
        <button class="btn btn-success btn-sm me-1" data-action="approve" data-id="${b.id_emprendimiento}" data-name="${safeName}" title="Aprobar">
          <i class="bi bi-check-lg"></i>
        </button>
        <button class="btn btn-danger btn-sm" data-action="reject" data-id="${b.id_emprendimiento}" data-name="${safeName}" title="Rechazar">
          <i class="bi bi-x-lg"></i>
        </button>`;
    } else if (estado === 'rechazado') {
      actions = `<span class="text-muted small">&mdash;</span>`;
    } else {
      actions = '<span class="text-muted small">&mdash;</span>';
    }

    return `<tr>
      <td class="px-4 py-3 fw-semibold">${escHtml(b.nombre || '')}</td>
      <td class="px-4 py-3"><span class="badge bg-secondary bg-opacity-10 text-secondary">${escHtml(b.categoria || '-')}</span></td>
      <td class="px-4 py-3 small text-muted">${ownerName}<br><small>${ownerEmail}</small></td>
      <td class="px-4 py-3 small text-muted">${date}</td>
      <td class="px-4 py-3"><span class="badge ${badgeClass} estado-badge">${estado}</span></td>
      <td class="px-4 py-3 text-end">${actions}</td>
    </tr>`;
  }).join('');
}

function renderPagination(total) {
  totalPages = total;
  const ul = document.getElementById('pagination-ul');
  ul.innerHTML = '';

  if (totalPages <= 1) return;

  const prevLi = document.createElement('li');
  prevLi.className = 'page-item' + (currentPage === 1 ? ' disabled' : '');
  prevLi.innerHTML = '<a class="page-link" href="#" data-page="' + (currentPage - 1) + '">&laquo;</a>';
  ul.appendChild(prevLi);

  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement('li');
    li.className = 'page-item' + (i === currentPage ? ' active' : '');
    li.innerHTML = '<a class="page-link" href="#" data-page="' + i + '">' + i + '</a>';
    ul.appendChild(li);
  }

  const nextLi = document.createElement('li');
  nextLi.className = 'page-item' + (currentPage === totalPages ? ' disabled' : '');
  nextLi.innerHTML = '<a class="page-link" href="#" data-page="' + (currentPage + 1) + '">&raquo;</a>';
  ul.appendChild(nextLi);

  if (!ul.dataset.listener) {
    ul.dataset.listener = '1';
    ul.addEventListener('click', (e) => {
      const link = e.target.closest('[data-page]');
      if (!link) return;
      e.preventDefault();
      const page = parseInt(link.dataset.page);
      if (page >= 1 && page <= totalPages) {
        currentPage = page;
        cargarSolicitudes();
      }
    });
  }
}

function abrirAprobar(id, nombre) {
  approveId = id;
  document.getElementById('approve-name').textContent = nombre;
  new bootstrap.Modal('#modal-aprobar').show();
}

async function confirmarAprobar() {
  try {
    await apiPut('/admin/businesses/' + approveId + '/approve');
    showToast('Negocio aprobado exitosamente', 'success');
    bootstrap.Modal.getInstance(document.getElementById('modal-aprobar')).hide();
    await cargarSolicitudes();
  } catch (e) {
    showToast(e.message || 'Error al aprobar', 'danger');
  }
}

function abrirRechazar(id, nombre) {
  rejectId = id;
  document.getElementById('reject-name').textContent = nombre;
  document.getElementById('motivo-rechazo').value = '';
  document.getElementById('motivo-rechazo').classList.remove('is-invalid');
  new bootstrap.Modal('#modal-rechazar').show();
}

async function confirmarRechazo() {
  const motivo = document.getElementById('motivo-rechazo').value.trim();
  if (!motivo || motivo.length < 20) {
    document.getElementById('motivo-rechazo').classList.add('is-invalid');
    return;
  }
  try {
    await apiPut('/admin/businesses/' + rejectId + '/reject', { motivo });
    showToast('Solicitud rechazada', 'warning');
    bootstrap.Modal.getInstance(document.getElementById('modal-rechazar')).hide();
    await cargarSolicitudes();
  } catch (e) {
    showToast(e.message || 'Error al rechazar', 'danger');
  }
}

async function exportarCSV() {
  try {
    const params = new URLSearchParams();
    params.append('size', '10000');
    const data = await apiGet('/admin/businesses?' + params.toString());
    const items = data.items || [];

    if (items.length === 0) {
      showToast('No hay datos para exportar', 'warning');
      return;
    }

    const headers = ['Negocio', 'Categoria', 'Propietario', 'Email', 'Fecha', 'Estado'];
    const rows = items.map(b => [
      b.nombre || '',
      b.categoria || '',
      b.propietario ? (b.propietario.nombre + ' ' + b.propietario.apellido) : '',
      b.propietario ? b.propietario.correo : '',
      b.fecha_registro ? new Date(b.fecha_registro).toLocaleDateString() : '',
      b.estado_verificacion || 'pendiente'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'solicitudes_bizrise_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Reporte exportado exitosamente', 'success');
  } catch (e) {
    showToast('Error al exportar: ' + e.message, 'danger');
  }
}

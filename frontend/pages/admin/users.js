/**
 * BIZRISE — Admin Usuarios
 */

let currentPage = 1;
let totalPages = 1;
let actionTargetId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth('administrador')) return;

  await loadComponent('sidebar-container', '../../components/admin-sidebar/sidebar.html');

  document.getElementById('filtros-form').addEventListener('submit', (e) => {
    e.preventDefault();
    currentPage = 1;
    cargarUsuarios();
  });

  // Event delegation for table actions
  document.getElementById('users-tbody').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    const name = btn.dataset.name;
    if (btn.dataset.action === 'suspend') {
      abrirSuspender(id, name);
    } else if (btn.dataset.action === 'activate') {
      abrirActivar(id, name);
    } else if (btn.dataset.action === 'edit') {
      abrirEditarUsuario(id);
    } else if (btn.dataset.action === 'delete') {
      abrirEliminarUsuario(id, name);
    }
  });

  document.getElementById('modal-confirm-btn').addEventListener('click', async () => {
    if (modalConfirmAction === 'suspend') {
      await confirmarSuspender();
    } else if (modalConfirmAction === 'activate') {
      await confirmarActivar();
    }
  });

  document.getElementById('btn-nuevo-usuario').addEventListener('click', () => {
    document.getElementById('form-nuevo-usuario').reset();
    document.getElementById('form-nuevo-usuario').classList.remove('was-validated');
    new bootstrap.Modal('#modal-nuevo-usuario').show();
  });

  document.getElementById('btn-guardar-nuevo-usuario').addEventListener('click', crearNuevoUsuario);
  document.getElementById('btn-guardar-editar-usuario').addEventListener('click', guardarEditarUsuario);
  document.getElementById('btn-confirmar-eliminar-usuario').addEventListener('click', eliminarUsuario);
  document.getElementById('btn-exportar-users').addEventListener('click', exportarUsuariosCSV);
  document.getElementById('btn-filtros-users').addEventListener('click', () => {
    document.getElementById('search-input').focus();
    document.getElementById('search-input').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('search-top').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('search-input').value = e.target.value;
      currentPage = 1;
      cargarUsuarios();
    }
  });

  await cargarUsuarios();
  initNotifications();
  if (window.updateSidebarBadge) window.updateSidebarBadge();
});

let modalConfirmAction = null;

async function cargarUsuarios() {
  try {
    const search = document.getElementById('search-input').value;
    const rol = document.getElementById('select-rol').value;
    const estado = document.getElementById('select-estado').value;

    const params = new URLSearchParams();
    if (search) params.append('busqueda', search);
    if (rol) params.append('rol', rol);
    if (estado) params.append('estado', estado);
    params.append('page', currentPage);
    params.append('size', '10');

    const data = await apiGet('/admin/users?' + params.toString());

    document.getElementById('counter-total').textContent = data.total ?? 0;
    document.getElementById('total-badge').textContent = data.total ?? 0;

    renderTable(data.items || []);
    renderPagination(data.pages || 1);

    cargarStatsTrend();
    cargarRoleCounters();
  } catch (e) {
    showToast('Error al cargar usuarios', 'danger');
  }
}

async function cargarStatsTrend() {
  try {
    const stats = await apiGet('/admin/stats');
    const trendEl = document.getElementById('trend-usuarios');
    if (trendEl) {
      const c = stats.crecimiento_porcentaje || 0;
      trendEl.textContent = (c >= 0 ? '+' : '') + c + '% este mes';
    }
  } catch (e) {
    // non-critical
  }
}

async function cargarRoleCounters() {
  try {
    const data = await apiGet('/admin/users?size=10000');
    let emprendedores = 0, clientes = 0;
    (data.items || []).forEach(u => {
      if (u.rol === 'emprendedor') emprendedores++;
      if (u.rol === 'cliente') clientes++;
    });
    document.getElementById('counter-emprendedores').textContent = emprendedores;
    document.getElementById('counter-clientes').textContent = clientes;
  } catch (e) {
    // non-critical
  }
}

function renderTable(lista) {
  const tbody = document.getElementById('users-tbody');
  if (!lista || lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-5">No se encontraron usuarios</td></tr>';
    return;
  }

  tbody.innerHTML = lista.map(u => {
    const date = u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString() : '-';
    const rolClass = u.rol === 'administrador' ? 'bg-primary'
      : u.rol === 'emprendedor' ? 'bg-info text-dark'
      : 'bg-secondary';
    const estadoClass = u.estado === 'activo' ? 'bg-success' : 'bg-danger';
    const inicial = (u.nombre || u.correo || '?')[0].toUpperCase();
    const avatarColorClasses = ['avatar-purple', 'avatar-blue', 'avatar-green', 'avatar-red', 'avatar-orange', 'avatar-teal'];
    const colorClass = avatarColorClasses[(u.id_usuario || 0) % avatarColorClasses.length];
    const safeName = escHtml(u.nombre || u.correo || '');

    const currentUser = getCurrentUser();
    const isMe = currentUser && currentUser.id_usuario === u.id_usuario;

    let actions = '';
    const editBtn = '<button class="btn btn-outline-primary btn-sm" data-action="edit" data-id="' + u.id_usuario + '" title="Editar"><i class="bi bi-pencil"></i></button>';
    if (!isMe && u.rol !== 'administrador') {
      const stateBtn = u.estado === 'activo'
        ? '<button class="btn btn-outline-danger btn-sm" data-action="suspend" data-id="' + u.id_usuario + '" data-name="' + safeName + '" title="Suspender"><i class="bi bi-pause-circle"></i></button>'
        : '<button class="btn btn-outline-success btn-sm" data-action="activate" data-id="' + u.id_usuario + '" data-name="' + safeName + '" title="Activar"><i class="bi bi-play-circle"></i></button>';
      const deleteBtn = '<button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="' + u.id_usuario + '" data-name="' + safeName + '" title="Eliminar"><i class="bi bi-trash"></i></button>';
      actions = editBtn + stateBtn + deleteBtn;
    } else if (isMe) {
      actions = editBtn;
    } else {
      actions = '<span class="text-muted small">&mdash;</span>';
    }

    return '<tr>' +
      '<td class="px-4 py-3">' +
        '<div class="user-info">' +
          '<div class="avatar-placeholder ' + colorClass + '">' + escHtml(inicial) + '</div>' +
          '<div>' +
            '<div class="user-name">' + escHtml(u.nombre || '\u2014') + ' ' + escHtml(u.apellido || '') + '</div>' +
            '<div class="user-email">' + escHtml(u.correo || '') + '</div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td class="px-4 py-3"><span class="badge ' + rolClass + '">' + escHtml(u.rol) + '</span></td>' +
      '<td class="px-4 py-3 small text-muted">' + escHtml(date) + '</td>' +
      '<td class="px-4 py-3"><span class="badge ' + estadoClass + '">' + escHtml(u.estado || 'activo') + '</span></td>' +
      '<td class="px-4 py-3 text-end">' +
        '<div class="action-btn-group d-flex justify-content-end gap-1">' + actions + '</div>' +
      '</td>' +
    '</tr>';
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
        cargarUsuarios();
      }
    });
  }
}

function abrirSuspender(id, nombre) {
  actionTargetId = id;
  modalConfirmAction = 'suspend';
  document.getElementById('modal-confirm-title').textContent = 'Suspender usuario';
  document.getElementById('modal-confirm-msg').textContent = '\u00bfEst\u00e1s seguro de suspender a ' + nombre + '?';
  const btn = document.getElementById('modal-confirm-btn');
  btn.className = 'btn btn-danger btn-sm';
  btn.innerHTML = '<i class="bi bi-pause-circle me-1"></i>Suspender';
  new bootstrap.Modal('#modal-confirm').show();
}

async function confirmarSuspender() {
  try {
    await apiPut('/admin/users/' + actionTargetId + '/suspend');
    showToast('Usuario suspendido', 'warning');
    bootstrap.Modal.getInstance(document.getElementById('modal-confirm')).hide();
    await cargarUsuarios();
  } catch (e) {
    showToast(e.message || 'Error al suspender', 'danger');
  }
}

function abrirActivar(id, nombre) {
  actionTargetId = id;
  modalConfirmAction = 'activate';
  document.getElementById('modal-confirm-title').textContent = 'Activar usuario';
  document.getElementById('modal-confirm-msg').textContent = '\u00bfEst\u00e1s seguro de activar a ' + nombre + '?';
  const btn = document.getElementById('modal-confirm-btn');
  btn.className = 'btn btn-success btn-sm';
  btn.innerHTML = '<i class="bi bi-play-circle me-1"></i>Activar';
  new bootstrap.Modal('#modal-confirm').show();
}

async function confirmarActivar() {
  try {
    await apiPut('/admin/users/' + actionTargetId + '/activate');
    showToast('Usuario activado', 'success');
    bootstrap.Modal.getInstance(document.getElementById('modal-confirm')).hide();
    await cargarUsuarios();
  } catch (e) {
    showToast(e.message || 'Error al activar', 'danger');
  }
}

async function exportarUsuariosCSV() {
  try {
    const params = new URLSearchParams();
    params.append('size', '10000');
    const data = await apiGet('/admin/users?' + params.toString());
    const items = data.items || [];

    if (items.length === 0) {
      showToast('No hay datos para exportar', 'warning');
      return;
    }

    const headers = ['Nombre', 'Apellido', 'Correo', 'Rol', 'Estado', 'Fecha Registro'];
    const rows = items.map(u => [
      u.nombre || '',
      u.apellido || '',
      u.correo || '',
      u.rol || '',
      u.estado || '',
      u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString() : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usuarios_bizrise_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Reporte exportado exitosamente', 'success');
  } catch (e) {
    showToast('Error al exportar: ' + e.message, 'danger');
  }
}

async function abrirEditarUsuario(id) {
  try {
    const data = await apiGet('/admin/users?size=10000');
    const user = (data.items || []).find(u => u.id_usuario === id);
    if (!user) {
      showToast('Usuario no encontrado', 'danger');
      return;
    }
    document.getElementById('eu-id').value = user.id_usuario;
    document.getElementById('eu-nombre').value = user.nombre || '';
    document.getElementById('eu-apellido').value = user.apellido || '';
    document.getElementById('eu-correo').value = user.correo || '';
    document.getElementById('eu-rol').value = user.rol || 'cliente';
    document.getElementById('eu-estado').value = user.estado || 'activo';
    document.getElementById('form-editar-usuario').classList.remove('was-validated');
    new bootstrap.Modal('#modal-editar-usuario').show();
  } catch (e) {
    showToast('Error al cargar usuario', 'danger');
  }
}

async function guardarEditarUsuario() {
  const form = document.getElementById('form-editar-usuario');
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  const id = document.getElementById('eu-id').value;
  const data = {
    nombre: document.getElementById('eu-nombre').value.trim(),
    apellido: document.getElementById('eu-apellido').value.trim(),
    correo: document.getElementById('eu-correo').value.trim(),
    rol: document.getElementById('eu-rol').value,
    estado: document.getElementById('eu-estado').value
  };

  const btn = document.getElementById('btn-guardar-editar-usuario');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Guardando...';

  try {
    await apiPut('/admin/users/' + id, data);
    showToast('Usuario actualizado exitosamente', 'success');
    bootstrap.Modal.getInstance(document.getElementById('modal-editar-usuario')).hide();
    await cargarUsuarios();
  } catch (e) {
    showToast(e.message || 'Error al actualizar usuario', 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Guardar Cambios';
  }
}

function abrirEliminarUsuario(id, nombre) {
  document.getElementById('eliminar-usuario-id').value = id;
  document.getElementById('modal-eliminar-title').textContent = 'Eliminar usuario';
  document.getElementById('modal-eliminar-msg').textContent = 'Esta accion no se puede deshacer. Se eliminara permanentemente a ' + nombre + '.';
  new bootstrap.Modal('#modal-eliminar-usuario').show();
}

async function eliminarUsuario() {
  const id = document.getElementById('eliminar-usuario-id').value;
  try {
    await apiDelete('/admin/users/' + id);
    showToast('Usuario eliminado permanentemente', 'success');
    bootstrap.Modal.getInstance(document.getElementById('modal-eliminar-usuario')).hide();
    await cargarUsuarios();
  } catch (e) {
    showToast(e.message || 'Error al eliminar usuario', 'danger');
  }
}

async function crearNuevoUsuario() {
  const form = document.getElementById('form-nuevo-usuario');
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  const nombre = document.getElementById('nu-nombre').value.trim();
  const apellido = document.getElementById('nu-apellido').value.trim();
  const correo = document.getElementById('nu-correo').value.trim();
  const contrasena = document.getElementById('nu-contrasena').value;
  const rol = document.getElementById('nu-rol').value;

  const btn = document.getElementById('btn-guardar-nuevo-usuario');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Creando...';

  try {
    await apiPost('/admin/users', { nombre, apellido, correo, contrasena, rol });
    showToast('Usuario creado exitosamente', 'success');
    bootstrap.Modal.getInstance(document.getElementById('modal-nuevo-usuario')).hide();
    form.classList.remove('was-validated');
    await cargarUsuarios();
  } catch (e) {
    showToast(e.message || 'Error al crear usuario', 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-person-plus me-1"></i>Crear Usuario';
  }
}

/**
 * BIZRISE — Gestión de Productos
 */

let editandoProducto = false;
let ultimaBusqueda = '';
let modalProducto = null;

const MAX_PRODUCTOS = 50;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth('emprendedor')) return;

  await loadComponent('sidebar-container', '../../components/entrepreneur-sidebar/sidebar.html');

  modalProducto = new bootstrap.Modal(document.getElementById('modal-producto'));

  await cargarProductos();

  // Search con debounce 400ms y distinctUntilChanged
  document.getElementById('search-productos').addEventListener('input', () => {
    const valor = document.getElementById('search-productos').value;
    if (valor === ultimaBusqueda) return;
    clearTimeout(window.prodDebounce);
    window.prodDebounce = setTimeout(() => {
      ultimaBusqueda = document.getElementById('search-productos').value;
      cargarProductos();
    }, 400);
  });

  document.getElementById('producto-form').addEventListener('submit', guardarProducto);
  document.getElementById('btn-confirmar-eliminar').addEventListener('click', eliminarProducto);

  document.getElementById('products-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-prod-action]');
    if (!btn) return;
    if (btn.dataset.prodAction === 'edit') abrirModalProducto(parseInt(btn.dataset.prodId));
    if (btn.dataset.prodAction === 'delete') confirmarEliminar(parseInt(btn.dataset.prodId));
  });

  document.getElementById('btn-nuevo-producto').addEventListener('click', () => abrirModalProducto());

  document.getElementById('prod-imagen').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        e.target.value = '';
        showToast('La imagen no debe superar los 2MB', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = document.getElementById('prod-imagen-preview');
        preview.classList.remove('d-none');
        preview.querySelector('img').src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('prod-stock').addEventListener('input', syncEstadoStock);
  document.getElementById('prod-estado-stock').addEventListener('change', () => {});

  document.getElementById('modal-producto').addEventListener('hidden.bs.modal', resetModal);
});

async function cargarProductos() {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';

  try {
    const busqueda = document.getElementById('search-productos').value.trim();
    let url = `/entrepreneur/products?size=${MAX_PRODUCTOS}`;
    if (busqueda) url += `&busqueda=${encodeURIComponent(busqueda)}`;

    const data = await apiGet(url);
    const items = data.items || [];

    if (items.length === 0 && busqueda) {
      mostrarSinResultados(busqueda);
      return;
    }

    renderizarProductos(items);
  } catch (e) {
    console.error('Error cargando productos:', e);
    grid.innerHTML = '<div class="col-12"><p class="text-muted text-center py-4">Error al cargar productos</p></div>';
  }
}

function mostrarSinResultados(termino) {
  const grid = document.getElementById('products-grid');

  const addCol = document.createElement('div');
  addCol.className = 'col-12 col-md-6 col-lg-4';
  const addCard = document.createElement('div');
  addCard.className = 'add-card';
  addCard.addEventListener('click', () => abrirModalProducto());
  addCard.innerHTML = `
    <div class="text-center">
      <i class="bi bi-plus-circle d-block mb-2"></i>
      <span>+ Nuevo Producto</span>
    </div>
  `;
  addCol.appendChild(addCard);
  grid.appendChild(addCol);

  const msgCol = document.createElement('div');
  msgCol.className = 'col-12';
  msgCol.innerHTML = `
    <div class="text-center py-5">
      <i class="bi bi-search text-muted" style="font-size:2.5rem"></i>
      <p class="text-muted mt-3 mb-0">No se encontraron productos con "<strong>${escHtml(termino)}</strong>"</p>
      <small class="text-muted">Prueba con otro término de búsqueda</small>
    </div>
  `;
  grid.appendChild(msgCol);
}

function renderizarProductos(items) {
  const grid = document.getElementById('products-grid');

  const addCol = document.createElement('div');
  addCol.className = 'col-12 col-md-6 col-lg-4';
  const addCard = document.createElement('div');
  addCard.className = 'add-card';
  addCard.addEventListener('click', () => abrirModalProducto());
  addCard.innerHTML = `
    <div class="text-center">
      <i class="bi bi-plus-circle d-block mb-2"></i>
      <span>+ Nuevo Producto</span>
    </div>
  `;
  addCol.appendChild(addCard);
  grid.appendChild(addCol);

  items.forEach(p => {
    const stockNum = p.stock || 0;
    const estStock = stockNum > 10 ? 'disponible' : stockNum > 0 ? 'bajo_stock' : 'agotado';
    const stockLabel = estStock === 'disponible' ? 'Disponible'
                     : estStock === 'bajo_stock' ? 'Bajo stock'
                     : 'Agotado';
    const stockClass = p.activo === false ? 'badge-secondary'
                     : `badge-${estStock}`;

    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';
    col.innerHTML = `
      <div class="producto-card card shadow-sm ${p.activo === false ? 'opacity-50' : ''}">
        <img src="${imgSrc(p.imagen_url, p.nombre)}"
             class="card-img-top" alt="${escHtml(p.nombre)}"
             onerror="this.src=bizFallbackImg('${escHtml(p.nombre)}', 400, 300)">
        <div class="card-body d-flex flex-column">
          <span class="badge ${stockClass} align-self-start mb-1">${escHtml(stockLabel)}</span>
          <h6 class="card-title">${escHtml(p.nombre)}</h6>
          <p class="card-text text-muted small flex-grow-1">${escHtml(truncate(p.descripcion, 60))}</p>
          <div class="d-flex align-items-center gap-2 mb-2">
            <div class="precio">${escHtml(formatPrice(p.precio))}</div>
            <small class="text-muted"><i class="bi bi-box"></i> ${escHtml(stockNum)} uds.</small>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary btn-sm flex-grow-1"
                    data-prod-action="edit" data-prod-id="${p.id_producto}">
              <i class="bi bi-pencil"></i> Editar
            </button>
            <button class="btn btn-outline-danger btn-sm"
                    data-prod-action="delete" data-prod-id="${p.id_producto}">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(col);
  });
}

function syncEstadoStock() {
  const val = parseInt(document.getElementById('prod-stock').value) || 0;
  const select = document.getElementById('prod-estado-stock');
  if (val > 10) select.value = 'disponible';
  else if (val > 0) select.value = 'bajo_stock';
  else select.value = 'agotado';
}

function resetModal() {
  document.getElementById('producto-form').reset();
  document.getElementById('producto-id').value = '';
  document.getElementById('prod-imagen-preview').classList.add('d-none');
  document.getElementById('prod-imagen-preview').querySelector('img').src = '';
  document.getElementById('prod-imagen').value = '';
  document.getElementById('modal-producto-alert').classList.add('d-none');
  document.getElementById('modal-producto-alert').innerHTML = '';
  document.querySelectorAll('#producto-form .is-invalid').forEach(el => el.classList.remove('is-invalid'));
  document.getElementById('spinner-save').classList.add('d-none');
  document.getElementById('icon-save').classList.remove('d-none');
}

function mostrarErrorModal(msg) {
  const alert = document.getElementById('modal-producto-alert');
  alert.className = 'alert alert-danger mx-3 mt-3';
  alert.innerHTML = '<i class="bi bi-exclamation-circle"></i> ' + msg;
}

function validarFormulario() {
  let valido = true;
  const nombre = document.getElementById('prod-nombre');
  const precio = document.getElementById('prod-precio');

  document.querySelectorAll('#producto-form .is-invalid').forEach(el => el.classList.remove('is-invalid'));

  if (!nombre.value.trim() || nombre.value.trim().length < 3) {
    nombre.classList.add('is-invalid');
    valido = false;
  }
  const pv = parseFloat(precio.value);
  if (!precio.value || isNaN(pv) || pv < 0.10) {
    precio.classList.add('is-invalid');
    valido = false;
  }

  return valido;
}

async function abrirModalProducto(id) {
  editandoProducto = !!id;
  resetModal();

  if (id) {
    document.getElementById('modal-producto-label').textContent = 'Editar Producto';
    document.getElementById('text-save').textContent = 'Actualizar Producto';

    const productos = await apiGet(`/entrepreneur/products?size=${MAX_PRODUCTOS}`);
    const prod = (productos.items || []).find(p => p.id_producto === id);
    if (prod) {
      document.getElementById('producto-id').value = prod.id_producto;
      document.getElementById('prod-nombre').value = prod.nombre || '';
      document.getElementById('prod-descripcion').value = prod.descripcion || '';
      document.getElementById('prod-precio').value = prod.precio || '';
      const stockVal = prod.stock ?? 10;
      document.getElementById('prod-stock').value = stockVal;
      document.getElementById('prod-estado-stock').value = prod.estado_stock || 'disponible';
    }
  } else {
    document.getElementById('modal-producto-label').textContent = 'Nuevo Producto';
    document.getElementById('text-save').textContent = 'Guardar Producto';
    document.getElementById('prod-stock').value = '10';
    document.getElementById('prod-estado-stock').value = 'disponible';
  }

  modalProducto.show();
}

async function guardarProducto(e) {
  e.preventDefault();

  if (!validarFormulario()) return;

  const id = document.getElementById('producto-id').value;
  const formData = new FormData();

  const stockVal = parseInt(document.getElementById('prod-stock').value) || 0;
  formData.append('nombre', document.getElementById('prod-nombre').value.trim());
  formData.append('descripcion', document.getElementById('prod-descripcion').value.trim());
  formData.append('precio', document.getElementById('prod-precio').value || '');
  formData.append('stock', stockVal);
  formData.append('estado_stock', document.getElementById('prod-estado-stock').value);

  if (!id) {
    const data = await apiGet(`/entrepreneur/products?size=${MAX_PRODUCTOS}`);
    if ((data.items || []).length >= MAX_PRODUCTOS) {
      mostrarErrorModal(`Máximo ${MAX_PRODUCTOS} productos por emprendimiento`);
      return;
    }
  }

  const imagenFile = document.getElementById('prod-imagen').files[0];
  if (imagenFile) {
    if (imagenFile.size > 2 * 1024 * 1024) {
      mostrarErrorModal('La imagen no debe superar los 2MB');
      return;
    }
    formData.append('imagen', imagenFile);
  }

  // Spinner ON
  document.getElementById('spinner-save').classList.remove('d-none');
  document.getElementById('icon-save').classList.add('d-none');
  document.getElementById('btn-save-producto').disabled = true;

  try {
    if (id) {
      await apiPutForm(`/entrepreneur/products/${id}`, formData);
      showToast('Producto actualizado exitosamente', 'success');
    } else {
      await apiPostForm('/entrepreneur/products', formData);
      showToast('Producto creado exitosamente', 'success');
    }

    modalProducto.hide();
    await cargarProductos();
  } catch (e) {
    mostrarErrorModal(e.message || 'Error al guardar producto');
  } finally {
    document.getElementById('spinner-save').classList.add('d-none');
    document.getElementById('icon-save').classList.remove('d-none');
    document.getElementById('btn-save-producto').disabled = false;
  }
}

function confirmarEliminar(id) {
  document.getElementById('eliminar-producto-id').value = id;
  bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-eliminar')).show();
}

async function eliminarProducto() {
  const id = document.getElementById('eliminar-producto-id').value;
  try {
    await apiDelete(`/entrepreneur/products/${id}`);
    showToast('Producto eliminado', 'success');
    bootstrap.Modal.getInstance(document.getElementById('modal-eliminar')).hide();
    await cargarProductos();
  } catch (e) {
    showToast(e.message || 'Error al eliminar producto', 'danger');
  }
}

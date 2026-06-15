/**
 * BIZRISE — Gestión de Productos
 */

let editandoProducto = false;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth('emprendedor')) return;

  await loadComponent('sidebar-container', '../../components/entrepreneur-sidebar/sidebar.html');

  await cargarProductos();

  document.getElementById('search-productos').addEventListener('input', () => {
    clearTimeout(window.prodDebounce);
    window.prodDebounce = setTimeout(cargarProductos, 400);
  });

  document.getElementById('producto-form').addEventListener('submit', guardarProducto);
  document.getElementById('btn-confirmar-eliminar').addEventListener('click', eliminarProducto);

  document.getElementById('products-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-prod-action]');
    if (!btn) return;
    if (btn.dataset.prodAction === 'edit') abrirModalProducto(parseInt(btn.dataset.prodId));
    if (btn.dataset.prodAction === 'delete') confirmarEliminar(parseInt(btn.dataset.prodId));
  });

  const btnNuevo = document.getElementById('btn-nuevo-producto');
  if (btnNuevo) btnNuevo.addEventListener('click', () => abrirModalProducto());

  document.getElementById('prod-imagen').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = document.getElementById('prod-imagen-preview');
        preview.classList.remove('d-none');
        preview.querySelector('img').src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('prod-stock').addEventListener('input', actualizarStockLabel);
});

const MAX_PRODUCTOS = 50;

async function cargarProductos() {
  try {
    const busqueda = document.getElementById('search-productos').value.trim();
    let url = `/entrepreneur/products?size=${MAX_PRODUCTOS}`;
    if (busqueda) url += `&busqueda=${encodeURIComponent(busqueda)}`;

    const data = await apiGet(url);
    renderizarProductos(data.items || []);
  } catch (e) {
    console.error('Error cargando productos:', e);
  }
}

function renderizarProductos(items) {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';

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
             class="card-img-top" alt="${p.nombre}"
             onerror="this.src=bizFallbackImg('${p.nombre}', 400, 300)">
        <div class="card-body d-flex flex-column">
          <span class="badge ${stockClass} align-self-start mb-1">${stockLabel}</span>
          <h6 class="card-title">${p.nombre}</h6>
          <p class="card-text text-muted small flex-grow-1">${truncate(p.descripcion, 60)}</p>
          <div class="d-flex align-items-center gap-2 mb-2">
            <div class="precio">${formatPrice(p.precio)}</div>
            <small class="text-muted"><i class="bi bi-box"></i> ${stockNum} uds.</small>
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

async function abrirModalProducto(id) {
  editandoProducto = !!id;
  document.getElementById('producto-form').reset();
  document.getElementById('prod-imagen-preview').classList.add('d-none');
  document.getElementById('producto-id').value = '';

  if (id) {
    document.getElementById('modal-producto-label').textContent = 'Editar Producto';
    document.getElementById('btn-save-producto').innerHTML = '<i class="bi bi-check-lg"></i> Actualizar Producto';

    const productos = await apiGet(`/entrepreneur/products?size=${MAX_PRODUCTOS}`);
    const prod = (productos.items || []).find(p => p.id_producto === id);
    if (prod) {
      document.getElementById('producto-id').value = prod.id_producto;
      document.getElementById('prod-nombre').value = prod.nombre || '';
      document.getElementById('prod-descripcion').value = prod.descripcion || '';
      document.getElementById('prod-precio').value = prod.precio || '';
      document.getElementById('prod-stock').value = prod.stock ?? 10;
      actualizarStockLabel();
    }
  } else {
    document.getElementById('modal-producto-label').textContent = 'Nuevo Producto';
    document.getElementById('btn-save-producto').innerHTML = '<i class="bi bi-check-lg"></i> Guardar Producto';
    document.getElementById('prod-stock').value = '10';
    actualizarStockLabel();
  }
}

function actualizarStockLabel() {
  const val = parseInt(document.getElementById('prod-stock').value) || 0;
  const label = document.getElementById('prod-stock-label');
  if (!label) return;
  if (val > 10) {
    label.textContent = 'Disponible';
    label.className = 'small text-success';
  } else if (val > 0) {
    label.textContent = 'Bajo stock';
    label.className = 'small text-warning';
  } else {
    label.textContent = 'Agotado';
    label.className = 'small text-danger';
  }
}

async function guardarProducto(e) {
  e.preventDefault();
  const id = document.getElementById('producto-id').value;
  const formData = new FormData();

  const stockVal = parseInt(document.getElementById('prod-stock').value) || 0;
  formData.append('nombre', document.getElementById('prod-nombre').value.trim());
  formData.append('descripcion', document.getElementById('prod-descripcion').value.trim());
  formData.append('precio', document.getElementById('prod-precio').value || '');
  formData.append('stock', stockVal);
  formData.append('estado_stock', stockVal > 10 ? 'disponible' : stockVal > 0 ? 'bajo_stock' : 'agotado');

  if (!id) {
    const data = await apiGet(`/entrepreneur/products?size=${MAX_PRODUCTOS}`);
    if ((data.items || []).length >= MAX_PRODUCTOS) {
      showToast(`Máximo ${MAX_PRODUCTOS} productos por emprendimiento`, 'warning');
      return;
    }
  }

  const imagenFile = document.getElementById('prod-imagen').files[0];
  if (imagenFile) {
    formData.append('imagen', imagenFile);
  }

  try {
    if (id) {
      await apiPutForm(`/entrepreneur/products/${id}`, formData);
      showToast('Producto actualizado', 'success');
    } else {
      await apiPostForm('/entrepreneur/products', formData);
      showToast('Producto creado exitosamente', 'success');
    }

    bootstrap.Modal.getInstance(document.getElementById('modal-producto')).hide();
    await cargarProductos();
  } catch (e) {
    showToast(e.message || 'Error al guardar producto', 'danger');
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

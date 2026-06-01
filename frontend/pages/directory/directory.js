/**
 * BIZRISE — Página de Directorio
 * Listado paginado con filtros, búsqueda con debounce y URL state
 */

const PAGE_SIZE = 12;
let currentPage = 1;
let currentFilters = {};
let debounceTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponent('navbar-container', '../../components/navbar/navbar.html');
  renderAuthSection();
  await loadComponent('footer-container', '../../components/footer/footer.html');

  await cargarCategoriasFiltro();
  leerParamsURL();
  configurarEventos();
  await cargarNegocios();
});

function leerParamsURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('busqueda')) currentFilters.busqueda = params.get('busqueda');
  if (params.has('categoria')) currentFilters.categoria = parseInt(params.get('categoria'));
  if (params.has('distrito')) currentFilters.distrito = params.get('distrito');
  if (params.has('orden')) currentFilters.orden = params.get('orden');
  if (params.has('page')) currentPage = parseInt(params.get('page'));

  if (currentFilters.busqueda) document.getElementById('filter-busqueda').value = currentFilters.busqueda;
  if (currentFilters.distrito) document.getElementById('filter-distrito').value = currentFilters.distrito;
  if (currentFilters.orden) document.getElementById('filter-orden').value = currentFilters.orden;
}

function configurarEventos() {
  document.getElementById('filter-busqueda').addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentFilters.busqueda = document.getElementById('filter-busqueda').value.trim() || undefined;
      currentPage = 1;
      actualizarURL();
      cargarNegocios();
    }, 400);
  });

  document.getElementById('filter-distrito').addEventListener('change', () => {
    const val = document.getElementById('filter-distrito').value;
    currentFilters.distrito = val || undefined;
    currentPage = 1;
    actualizarURL();
    cargarNegocios();
  });

  document.getElementById('filter-orden').addEventListener('change', () => {
    currentFilters.orden = document.getElementById('filter-orden').value;
    currentPage = 1;
    actualizarURL();
    cargarNegocios();
  });

  document.getElementById('btn-limpiar').addEventListener('click', limpiarFiltros);
}

function actualizarURL() {
  const params = new URLSearchParams();
  if (currentFilters.busqueda) params.set('busqueda', currentFilters.busqueda);
  if (currentFilters.categoria) params.set('categoria', currentFilters.categoria);
  if (currentFilters.distrito) params.set('distrito', currentFilters.distrito);
  if (currentFilters.orden && currentFilters.orden !== 'reciente') params.set('orden', currentFilters.orden);
  if (currentPage > 1) params.set('page', currentPage);
  const url = `/pages/directory/directory.html${params.toString() ? '?' + params.toString() : ''}`;
  history.pushState({ filters: currentFilters, page: currentPage }, '', url);
}

function seleccionarCategoria(id) {
  if (currentFilters.categoria === id) {
    delete currentFilters.categoria;
  } else {
    currentFilters.categoria = id;
  }
  currentPage = 1;
  actualizarURL();
  cargarNegocios();
  resaltarCategoriaActiva();
}

function resaltarCategoriaActiva() {
  document.querySelectorAll('#filter-categorias .list-group-item').forEach(el => {
    const id = parseInt(el.dataset.id);
    el.classList.toggle('active', id === currentFilters.categoria);
  });
}

function limpiarFiltros() {
  currentFilters = {};
  currentPage = 1;
  document.getElementById('filter-busqueda').value = '';
  document.getElementById('filter-distrito').value = '';
  document.getElementById('filter-orden').value = 'reciente';
  actualizarURL();
  resaltarCategoriaActiva();
  cargarNegocios();
}

async function cargarCategoriasFiltro() {
  try {
    const data = await apiGet('/categories');
    const container = document.getElementById('filter-categorias');
    container.innerHTML = '';

    data.items.forEach(cat => {
      const item = document.createElement('a');
      item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
      item.dataset.id = cat.id_categoria;
      item.innerHTML = `${cat.nombre} <span class="badge bg-primary rounded-pill">${cat.total_negocios}</span>`;
      item.addEventListener('click', () => seleccionarCategoria(cat.id_categoria));
      container.appendChild(item);
    });

    resaltarCategoriaActiva();
  } catch (e) {
    console.error('Error cargando categorías:', e);
  }
}

async function cargarNegocios() {
  const spinner = document.getElementById('loading-spinner');
  spinner.classList.remove('d-none');

  try {
    const params = new URLSearchParams();
    params.set('page', currentPage);
    params.set('size', PAGE_SIZE);
    if (currentFilters.busqueda) params.set('busqueda', currentFilters.busqueda);
    if (currentFilters.categoria) params.set('categoria', currentFilters.categoria);
    if (currentFilters.distrito) params.set('distrito', currentFilters.distrito);
    if (currentFilters.orden) params.set('orden', currentFilters.orden);

    const data = await apiGet(`/businesses?${params.toString()}`);
    renderizarNegocios(data);
    renderizarPaginacion(data);
  } catch (e) {
    console.error('Error cargando negocios:', e);
    document.getElementById('directorio-grid').innerHTML =
      '<div class="col-12"><div class="alert alert-danger">Error al cargar los negocios</div></div>';
  } finally {
    spinner.classList.add('d-none');
  }
}

function renderizarNegocios(data) {
  const grid = document.getElementById('directorio-grid');
  const count = document.getElementById('result-count');

  count.textContent = data.total || 0;

  if (!data.items || data.items.length === 0) {
    grid.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info text-center">
          <i class="bi bi-info-circle"></i>
          No se encontraron negocios con los filtros seleccionados.
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = '';
  data.items.forEach(negocio => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';
    col.innerHTML = `
      <div class="card business-card shadow-sm">
        <img src="${imgSrc(negocio.imagen_portada_url, negocio.nombre)}"
             class="card-img-top" alt="${negocio.nombre}">
        <div class="card-body d-flex flex-column">
          <span class="badge bg-primary mb-2 align-self-start">${negocio.categoria}</span>
          <h5 class="card-title">${negocio.nombre}</h5>
          <p class="card-text text-muted flex-grow-1">${truncate(negocio.descripcion, 80)}</p>
          <div class="d-flex align-items-center gap-2 mb-2">
            <div class="stars">${renderStars(negocio.puntuacion_promedio)}</div>
            <span class="fw-semibold" style="font-size:0.9rem">${negocio.puntuacion_promedio}</span>
            <span class="text-muted small">(${negocio.total_valoraciones})</span>
          </div>
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">
              <i class="bi bi-geo-alt"></i> ${negocio.distrito || 'Huancayo'}
            </small>
            <small class="${negocio.esta_abierto ? 'text-success' : 'text-danger'} fw-semibold">
              <i class="bi ${negocio.esta_abierto ? 'bi-check-circle' : 'bi-x-circle'}"></i>
              ${negocio.esta_abierto ? 'Abierto' : 'Cerrado'}
            </small>
          </div>
          <a href="/pages/business-profile/business-profile.html?id=${negocio.id_emprendimiento}"
             class="btn btn-outline-primary btn-sm w-100 mt-2">Ver Perfil</a>
        </div>
      </div>
    `;
    grid.appendChild(col);
  });
}

function renderizarPaginacion(data) {
  const ul = document.getElementById('pagination');
  ul.innerHTML = '';
  const totalPages = data.pages || 0;

  if (totalPages <= 1) return;

  const addItem = (label, page, disabled = false, active = false) => {
    const li = document.createElement('li');
    li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.textContent = label;
    if (!disabled) {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        currentPage = page;
        actualizarURL();
        cargarNegocios();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    li.appendChild(a);
    ul.appendChild(li);
  };

  addItem('«', currentPage - 1, currentPage === 1);
  addItem(currentPage, currentPage, false, true);

  for (let p = currentPage - 2; p <= currentPage + 2; p++) {
    if (p < 1 || p > totalPages || p === currentPage) continue;
    addItem(p, p);
  }

  addItem('»', currentPage + 1, currentPage === totalPages);
}

window.addEventListener('popstate', () => {
  currentFilters = {};
  currentPage = 1;
  leerParamsURL();
  resaltarCategoriaActiva();
  cargarNegocios();
});

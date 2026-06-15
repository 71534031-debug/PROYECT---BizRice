/**
 * BIZRISE — Perfil Público de Negocio
 */

let businessId = null;
let selectedRating = 0;

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponent('navbar-container', '../../components/navbar/navbar.html');
  renderAuthSection();
  await loadComponent('footer-container', '../../components/footer/footer.html');

  const params = new URLSearchParams(window.location.search);
  businessId = params.get('id');
  if (!businessId) {
    window.location.href = '/pages/directory/directory.html';
    return;
  }

  await cargarPerfil();
  await Promise.all([
    cargarProductos(),
    cargarResenas()
  ]);

  document.getElementById('loading-section').classList.add('d-none');
  document.getElementById('business-content').classList.remove('d-none');
});

async function cargarPerfil() {
  try {
    const negocio = await apiGet(`/businesses/${businessId}`);
    document.title = `BizRise — ${negocio.nombre}`;

    setBizImage(document.getElementById('portada-img'), negocio.imagen_portada_url, negocio.nombre);

    document.getElementById('hero-categoria').textContent = negocio.categoria?.nombre || '';

    if (negocio.estado_verificacion === 'aprobado') {
      document.getElementById('hero-verificado').classList.remove('d-none');
    }

    const estadoEl = document.getElementById('hero-estado');
    const abierto = calcularAbierto(negocio.horario_apertura, negocio.horario_cierre);
    estadoEl.textContent = abierto ? 'Abierto ahora' : 'Cerrado';
    estadoEl.className = `badge ${abierto ? 'bg-success' : 'bg-secondary'}`;

    document.getElementById('hero-nombre').textContent = negocio.nombre;
    document.getElementById('hero-estrellas').innerHTML = renderStars(negocio.puntuacion_promedio);
    document.getElementById('hero-puntuacion').textContent = negocio.puntuacion_promedio;
    document.getElementById('hero-total-resenas').textContent = `(${negocio.total_valoraciones} reseñas)`;

    document.getElementById('descripcion').textContent = negocio.descripcion || 'Sin descripción';

    renderizarHorarios(negocio.horario_apertura, negocio.horario_cierre);

    const telefono = negocio.telefono;
    if (telefono) {
      const limpio = telefono.replace(/[^0-9]/g, '');
      document.getElementById('telefono-link').href = `https://wa.me/51${limpio}`;
      document.getElementById('telefono-info').innerHTML = `
        <small class="text-muted"><i class="bi bi-telephone"></i> ${telefono}</small>
      `;
    }

    document.getElementById('horario-resumen').textContent =
      negocio.horario_apertura
        ? `${negocio.horario_apertura.slice(0, 5)} - ${negocio.horario_cierre?.slice(0, 5)}`
        : 'No especificado';

    const direccion = negocio.direccion
      ? `${negocio.direccion}, ${negocio.distrito || 'Huancayo'}`
      : 'No especificada';
    document.getElementById('direccion-text').textContent = direccion;
    document.getElementById('maps-link').href =
      `https://maps.google.com/?q=${encodeURIComponent(direccion + ', Huancayo, Perú')}`;

    const redesContainer = document.getElementById('redes-container');
    redesContainer.innerHTML = '';
    if (negocio.redes_sociales && negocio.redes_sociales.length > 0) {
      negocio.redes_sociales.forEach(red => {
        let icono = 'bi-globe';
        if (red.plataforma === 'facebook') icono = 'bi-facebook';
        else if (red.plataforma === 'instagram') icono = 'bi-instagram';
        else if (red.plataforma === 'whatsapp') icono = 'bi-whatsapp';
        else if (red.plataforma === 'tiktok') icono = 'bi-tiktok';
        redesContainer.innerHTML += `
          <a href="${red.url}" target="_blank" class="btn btn-outline-secondary btn-sm" title="${red.plataforma}">
            <i class="bi ${icono}"></i>
          </a>
        `;
      });
    }
  } catch (e) {
    console.error('Error cargando perfil:', e);
    document.getElementById('loading-section').innerHTML = `
      <div class="alert alert-danger">Error al cargar el perfil del negocio</div>
    `;
  }
}

function calcularAbierto(apertura, cierre) {
  if (!apertura || !cierre) return false;
  try {
    const ahora = new Date();
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
    const [hA, mA] = apertura.split(':').map(Number);
    const [hC, mC] = cierre.split(':').map(Number);
    const minApertura = hA * 60 + mA;
    const minCierre = hC * 60 + mC;
    return horaActual >= minApertura && horaActual <= minCierre;
  } catch {
    return false;
  }
}

function renderizarHorarios(apertura, cierre) {
  const tbody = document.getElementById('horarios-tabla');
  tbody.innerHTML = '';
  DIAS.forEach(dia => {
    const abierto = apertura && cierre;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${dia}</td>
      <td class="${abierto ? 'text-success' : 'text-danger'}">
        ${abierto ? `${apertura.slice(0, 5)} - ${cierre.slice(0, 5)}` : 'Cerrado'}
        ${abierto ? '<i class="bi bi-check-circle text-success ms-1"></i>' : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function cargarProductos() {
  try {
    const data = await apiGet(`/businesses/${businessId}/products?size=50`);
    const grid = document.getElementById('productos-grid');

    if (!data.items || data.items.length === 0) {
      grid.innerHTML = '<div class="col-12"><p class="text-muted">No hay productos registrados aún</p></div>';
      return;
    }

    grid.innerHTML = '';
    data.items.forEach(p => {
      const stockNum = p.stock || 0;
      const estStock = stockNum > 10 ? 'disponible' : stockNum > 0 ? 'bajo_stock' : 'agotado';
      const stockClass = `badge-${estStock}`;
      const stockLabel = estStock === 'disponible' ? 'Disponible'
                       : estStock === 'bajo_stock' ? 'Bajo stock'
                       : 'Agotado';
      const col = document.createElement('div');
      col.className = 'col-6 col-md-4';
      col.innerHTML = `
        <div class="product-card card h-100">
          <img src="${imgSrc(p.imagen_url, p.nombre)}"
               class="product-img" alt="${p.nombre}">
          <div class="card-body">
            <span class="badge ${stockClass} mb-1">${stockLabel}</span>
            <h6 class="card-title mb-1">${p.nombre}</h6>
            <p class="card-text text-muted small mb-1">${truncate(p.descripcion, 60)}</p>
            <div class="d-flex align-items-center justify-content-between">
              <div class="precio">${formatPrice(p.precio)}</div>
              <small class="text-muted"><i class="bi bi-box"></i> ${stockNum} uds.</small>
            </div>
          </div>
        </div>
      `;
      grid.appendChild(col);
    });
  } catch (e) {
    console.error('Error cargando productos:', e);
  }
}

async function cargarResenas() {
  try {
    const data = await apiGet(`/businesses/${businessId}/reviews?size=50`);
    renderizarResumenResenas(data);
    renderizarResenas(data.items || []);
    configurarFormularioResena();
  } catch (e) {
    console.error('Error cargando reseñas:', e);
  }
}

function renderizarResumenResenas(data) {
  const container = document.getElementById('resumen-resenas');
  const promedio = data.puntuacion_promedio || 0;
  const dist = data.distribucion_estrellas || {};

  container.innerHTML = `
    <div class="col-md-4 text-center mb-3 mb-md-0">
      <div class="display-3 fw-bold" style="color: var(--bizrise-primary)">${promedio}</div>
      <div class="stars fs-5 mb-1">${renderStars(promedio)}</div>
      <small class="text-muted">${data.total || 0} reseñas</small>
    </div>
    <div class="col-md-8">
      ${[5, 4, 3, 2, 1].map(n => {
        const count = dist[String(n)] || 0;
        const max = Math.max(...Object.values(dist), 1);
        const pct = Math.round((count / max) * 100);
        return `
          <div class="distribucion-barra">
            <span>${n}</span>
            <div class="progress">
              <div class="progress-bar" style="width: ${pct}%"></div>
            </div>
            <span class="text-muted small" style="min-width: 24px">${count}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderizarResenas(items) {
  const container = document.getElementById('resenas-lista');

  if (!items || items.length === 0) {
    container.innerHTML = '<p class="text-muted">No hay reseñas aún. ¡Sé el primero!</p>';
    return;
  }

  container.innerHTML = items.map(r => `
    <div class="review-card">
      <div class="d-flex align-items-center gap-2 mb-1">
        <div class="rounded-circle bg-primary d-flex align-items-center justify-content-center"
             style="width: 36px; height: 36px; min-width: 36px;">
          <span class="text-white small fw-bold">${r.usuario.nombre.charAt(0)}${r.usuario.apellido.charAt(0)}</span>
        </div>
        <div>
          <strong style="font-size:0.9rem">${r.usuario.nombre} ${r.usuario.apellido}</strong>
          <div class="d-flex align-items-center gap-1">
            <span class="stars">${renderStars(r.puntuacion)}</span>
            <small class="text-muted">${new Date(r.fecha).toLocaleDateString('es-PE')}</small>
          </div>
        </div>
      </div>
      <p class="mb-0 text-muted small" style="padding-left: 44px;">${r.contenido}</p>
    </div>
  `).join('');
}

function configurarFormularioResena() {
  const user = getCurrentUser();
  const loginMsg = document.getElementById('review-login-msg');
  const formSection = document.getElementById('review-form-section');
  const form = document.getElementById('review-form');

  if (!user) {
    loginMsg.classList.remove('d-none');
    return;
  }

  formSection.classList.remove('d-none');

  const starContainer = document.querySelector('.star-rating');
  const hiddenInput = document.getElementById('review-puntuacion');

  if (starContainer && !starContainer.dataset.listener) {
    starContainer.dataset.listener = '1';
    starContainer.addEventListener('click', (e) => {
      const star = e.target.closest('i[data-star]');
      if (!star) return;
      selectedRating = parseInt(star.dataset.star);
      hiddenInput.value = selectedRating;
      starContainer.querySelectorAll('i[data-star]').forEach(st => {
        const n = parseInt(st.dataset.star);
        st.className = `bi ${n <= selectedRating ? 'bi-star-fill' : 'bi-star'} fs-4`;
      });
    });
  }

  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const contenido = document.getElementById('review-contenido').value.trim();

    if (selectedRating < 1) {
      showToast('Selecciona una puntuación', 'warning');
      return;
    }
    if (contenido.length < 10) {
      showToast('El comentario debe tener al menos 10 caracteres', 'warning');
      return;
    }

    try {
      await apiPost(`/businesses/${businessId}/reviews`, {
        puntuacion: selectedRating,
        contenido: contenido
      });
      showToast('Reseña publicada exitosamente', 'success');
      document.getElementById('review-contenido').value = '';
      selectedRating = 0;
      document.getElementById('review-puntuacion').value = '0';
      starContainer.querySelectorAll('i[data-star]').forEach(st => {
        st.className = 'bi bi-star fs-4';
      });
      await cargarResenas();
    } catch (e) {
      showToast(e.message || 'Error al publicar reseña', 'danger');
    }
  });
}

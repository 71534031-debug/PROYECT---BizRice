const CATEGORY_IMAGES = {
  'Gastronomía': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'Textilería y Moda': 'https://images.unsplash.com/photo-1604681630513-69474a4e253f?w=800&q=80',
  'Servicios': 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',
  'Tecnología': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
  'Artesanía': 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
  'Turismo': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  'Belleza': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=80',
  'Agricultura': 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=800&q=80',
  'Hogar': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
  'Salud y Bienestar': 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80',
  'Educación': 'https://images.unsplash.com/photo-1523050854058-8df90110c7f1?w=800&q=80',
  'Construcción y Ferretería': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
  'Entretenimiento': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
  'Transporte': 'https://images.unsplash.com/photo-1566576721341-5f0b11f72db2?w=800&q=80',
};

const COLECCIONES = [
  { icon: 'bi-shop', label: 'Picanterías', busqueda: 'Gastronomía' },
  { icon: 'bi-palette', label: 'Artesanías', busqueda: 'Artesanía' },
  { icon: 'bi-basket', label: 'Mercados', busqueda: '' },
  { icon: 'bi-cup-hot', label: 'Cafeterías', busqueda: 'Café' },
  { icon: 'bi-tools', label: 'Técnicos', busqueda: 'Servicios' },
  { icon: 'bi-grid-3x3-gap', label: 'Ver Todo', busqueda: '' },
];

const BADGES = ['Premium', 'Popular', 'Nuevo', 'Top', null, null, null, null, null];

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponent('navbar-container', '../../components/navbar/navbar.html');
  renderAuthSection();
  await loadComponent('footer-container', '../../components/footer/footer.html');
  renderColecciones();
  await cargarCategorias();

  document.getElementById('cat-search').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') buscar();
  });
});

function renderColecciones() {
  const grid = document.getElementById('colecciones-grid');
  COLECCIONES.forEach(col => {
    const url = col.busqueda
      ? `/pages/directory/directory.html?busqueda=${encodeURIComponent(col.busqueda)}`
      : '/pages/directory/directory.html';
    const div = document.createElement('a');
    div.className = 'col col-4 col-sm-3 col-lg-2';
    div.href = url;
    div.innerHTML = `
      <div class="col-item">
        <div class="col-icon-wrap"><i class="bi ${col.icon}"></i></div>
        <span>${col.label}</span>
      </div>
    `;
    grid.appendChild(div);
  });
}

function slugImagen(nombre) {
  const map = {
    'Gastronomía': 'gastronomia',
    'Textilería y Moda': 'textileria',
    'Artesanía': 'artesania',
    'Servicios': 'servicios',
    'Turismo': 'turismo',
    'Tecnología': 'tecnologia',
    'Belleza': 'belleza',
    'Agricultura': 'agricultura',
    'Hogar': 'hogar',
  };
  return (map[nombre] || nombre.toLowerCase().replace(/[^a-záéíóúñ0-9]+/g, '')) + '.jpg';
}

async function cargarCategorias() {
  try {
    const data = await apiGet('/categories');
    const grid = document.getElementById('categories-grid');

    data.items.forEach((cat, index) => {
      const imgUrl = CATEGORY_IMAGES[cat.nombre] || `https://picsum.photos/seed/${encodeURIComponent(cat.nombre)}/800/600`;
      const badge = BADGES[index % BADGES.length];
      const isFeatured = index === data.items.length - 1;

      const descripcion = cat.descripcion || descripcionFallback(cat.nombre);
      const count = cat.total_negocios || cat.business_count || 0;
      const circleImg = `../../assets/img/categories/${slugImagen(cat.nombre)}`;

      const link = document.createElement('a');
      link.className = `col-12 col-md-6 col-lg-4 cat-card ${isFeatured ? 'cat-card-featured' : ''}`;
      link.href = `/pages/directory/directory.html?categoria=${cat.id_categoria}`;

      link.innerHTML = `
        <div class="cat-card-img-wrap">
          <img src="${imgUrl}" alt="${escHtml(cat.nombre)}" loading="lazy">
        </div>
        <div class="cat-card-gradient"></div>
        <div class="cat-card-circle-img">
          <img src="${circleImg}" alt="${escHtml(cat.nombre)}" loading="lazy">
        </div>
        ${isFeatured ? '<div class="cat-card-star"><i class="bi bi-star-fill"></i></div>' : ''}
        <div class="cat-card-content">
          <div class="d-flex align-items-center gap-2 mb-2">
            ${badge ? `<span class="cat-badge ${badge === 'Top' ? 'cat-badge-featured' : ''}">${badge}</span>` : ''}
            <small class="cat-count">${escHtml(count)} negocios</small>
          </div>
          <h3>${escHtml(cat.nombre)}</h3>
          <p>${escHtml(descripcion)}</p>
        </div>
      `;

      grid.appendChild(link);
    });
  } catch (e) {
    console.error('Error cargando categorías:', e);
  }
}

function descripcionFallback(nombre) {
  const map = {
    'Gastronomía': 'Sabores auténticos del Valle del Mantaro.',
    'Textilería y Moda': 'Calidad de exportación con alma Huanca.',
    'Artesanía': 'Arte tradicional con diseño contemporáneo.',
    'Servicios': 'Expertos locales listos para ayudarte.',
    'Turismo': 'Descubre la magia del centro del Perú.',
    'Tecnología': 'Soluciones digitales de vanguardia.',
    'Belleza': 'Estilo y bienestar para tu día a día.',
    'Agricultura': 'Productos frescos directamente del campo.',
    'Hogar': 'Todo para hacer de tu casa un hogar.',
  };
  return map[nombre] || 'Descubre los mejores emprendimientos locales.';
}

function buscar() {
  const q = document.getElementById('cat-search').value.trim();
  if (q) {
    window.location.href = `/pages/directory/directory.html?busqueda=${encodeURIComponent(q)}`;
  }
}

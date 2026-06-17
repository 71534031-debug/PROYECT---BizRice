document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
  document.querySelectorAll('#admin-sidebar-links .nav-link').forEach(link => {
    if (link.dataset.page === currentPage) {
      link.classList.add('active');
    }
  });

  if (document.getElementById('pendientes-badge')) {
    fetchStatsBadge();
  }
});

async function fetchStatsBadge() {
  try {
    const data = await apiGet('/admin/stats');
    const badge = document.getElementById('pendientes-badge');
    if (badge) {
      if (data.pendientes > 0) {
        badge.textContent = data.pendientes;
        badge.classList.remove('d-none');
      } else {
        badge.classList.add('d-none');
      }
    }
  } catch (e) {
    // sidebar badge is non-critical
  }
}

window.updateSidebarBadge = fetchStatsBadge;

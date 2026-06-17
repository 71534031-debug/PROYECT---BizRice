/**
 * BIZRISE — Entrepreneur Sidebar Component
 * Resalta el link activo según la URL actual
 */

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
  document.querySelectorAll('.sidebar-link').forEach(link => {
    if (link.dataset.page === currentPage) {
      link.classList.add('active');
    }
  });

});

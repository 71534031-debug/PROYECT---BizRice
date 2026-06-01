/**
 * BIZRISE — Footer Component
 */

(function () {
  const observer = new MutationObserver(() => {
    const links = document.querySelectorAll('footer a[href="#"]:not([data-footer-fixed])');
    links.forEach(a => {
      a.dataset.footerFixed = '1';
      a.addEventListener('click', e => {
        e.preventDefault();
        if (typeof showToast === 'function') {
          showToast('Función próximamente disponible', 'info');
        }
      });
    });
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
})();

// MHQ Reseller Main JS
document.addEventListener('DOMContentLoaded', () => {
  // Active link highlighting
  const currentPath = window.location.pathname;
  document.querySelectorAll('nav a').forEach(link => {
    if (link.getAttribute('href') === currentPath && !link.querySelector('svg')) {
      link.classList.remove('text-zinc-300');
      link.classList.add('text-amber-400', 'font-semibold');
    }
  });
});
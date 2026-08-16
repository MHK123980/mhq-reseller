document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Active link highlighting
  const currentPath = window.location.pathname;
  document.querySelectorAll('nav a').forEach(link => {
    if (link.getAttribute('href') === currentPath && !link.querySelector('svg')) {
      link.classList.remove('text-zinc-300');
      link.classList.add('text-amber-400', 'font-semibold');
    }
  });

  // Apply fade-in animation to cards
  document.querySelectorAll('.product-card').forEach((card, index) => {
    card.style.opacity = '0';
    setTimeout(() => {
      card.classList.add('fade-in');
    }, index * 50); // Staggered animation
  });
});

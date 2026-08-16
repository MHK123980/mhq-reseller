function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('mhq_cart') || '[]');
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const deskCount = document.getElementById('cart-count');
  const mobCount = document.getElementById('cart-count-mobile');
  
  if (deskCount) deskCount.textContent = count;
  if (mobCount) mobCount.textContent = count;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', updateCartCount);

// Listen for storage events (updates from other tabs)
window.addEventListener('storage', (e) => {
  if (e.key === 'mhq_cart') {
    updateCartCount();
    // If we are on the cart page, re-render it
    if (typeof renderCart === 'function') {
      renderCart();
    }
  }
});

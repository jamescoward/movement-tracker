'use strict';

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}

// App initialisation
window.addEventListener('DOMContentLoaded', () => {
  highlightCurrentNav();
});

function highlightCurrentNav() {
  const path = window.location.pathname;
  document.querySelectorAll('nav a').forEach((link) => {
    if (link.getAttribute('href') === path) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

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
  const current = window.location.href;
  document.querySelectorAll('nav a').forEach((link) => {
    if (link.href === current) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

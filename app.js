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
  applyDarkMode();
  highlightCurrentNav();
  hideSplashScreen();
  updateConnectionStatus();
});

function applyDarkMode() {
  try {
    if (localStorage.getItem('movement_tracker_dark_mode') === 'true') {
      document.body.classList.add('dark-mode');
    }
  } catch (_) {}
}

// Offline-first UX: show/hide banner on connectivity changes
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

function updateConnectionStatus() {
  var banner = document.getElementById('offline-banner');
  if (!banner) return;
  if (navigator.onLine) {
    banner.hidden = true;
  } else {
    banner.hidden = false;
  }
}

function hideSplashScreen() {
  var splash = document.getElementById('splash-screen');
  if (!splash) return;
  if (sessionStorage.getItem('splashShown')) {
    splash.remove();
    return;
  }
  sessionStorage.setItem('splashShown', '1');
  setTimeout(function() {
    splash.classList.add('hidden');
    setTimeout(function() { splash.remove(); }, 400);
  }, 1500);
}

// Install prompt handling
var deferredPrompt = null;

window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPrompt = e;
  var installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.hidden = false;
    installBtn.addEventListener('click', function() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function() {
          deferredPrompt = null;
          installBtn.hidden = true;
        });
      }
    });
  }
});

window.addEventListener('appinstalled', function() {
  deferredPrompt = null;
  var installBtn = document.getElementById('install-btn');
  if (installBtn) installBtn.hidden = true;
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

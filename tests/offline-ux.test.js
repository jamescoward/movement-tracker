const fs = require('fs');
const path = require('path');

describe('Offline UX — status banner in HTML', () => {
  test('index.html has an offline status banner element', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    expect(html).toMatch(/id=["']offline-banner["']/);
  });
});

describe('Offline UX — CSS styles', () => {
  test('styles.css has offline-banner styles', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
    expect(css).toMatch(/\.offline-banner/);
  });
});

describe('Offline UX — JavaScript handling', () => {
  test('app.js listens for online/offline events', () => {
    const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    expect(appJs).toMatch(/['"]online['"]/);
    expect(appJs).toMatch(/['"]offline['"]/);
  });

  test('app.js has a function to update offline status', () => {
    const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    expect(appJs).toMatch(/offline|updateConnectionStatus/i);
  });
});

describe('Offline UX — service worker offline fallback', () => {
  test('service worker handles fetch failures gracefully', () => {
    const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
    // Should have a catch for failed fetches
    expect(sw).toMatch(/\.catch\s*\(/);
  });
});

const fs = require('fs');
const path = require('path');

describe('Install prompt — app.js handles beforeinstallprompt', () => {
  test('app.js listens for beforeinstallprompt event', () => {
    const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    expect(appJs).toMatch(/beforeinstallprompt/);
  });

  test('app.js stores the deferred prompt', () => {
    const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    expect(appJs).toMatch(/deferredPrompt|installPrompt/);
  });

  test('app.js has an install button handler', () => {
    const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    expect(appJs).toMatch(/install-btn|installBtn|install.*button/i);
  });
});

describe('Install prompt — UI element', () => {
  test('index.html has an install button', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    expect(html).toMatch(/id=["']install-btn["']/);
  });

  test('install button is hidden by default', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    expect(html).toMatch(/install-btn[\s\S]*hidden/);
  });
});

describe('Install prompt — CSS styles', () => {
  test('styles.css has install-btn styles', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
    expect(css).toMatch(/\.install-btn/);
  });
});

describe('Install prompt — appinstalled event', () => {
  test('app.js listens for appinstalled event', () => {
    const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    expect(appJs).toMatch(/appinstalled/);
  });
});

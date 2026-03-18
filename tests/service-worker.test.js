const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'sw.js');
let sw;

beforeAll(() => {
  sw = fs.readFileSync(swPath, 'utf8');
});

describe('sw.js — file exists', () => {
  test('file exists', () => {
    expect(fs.existsSync(swPath)).toBe(true);
  });
});

describe('sw.js — service worker structure', () => {
  test('has an install event listener', () => {
    expect(sw).toMatch(/addEventListener\s*\(\s*['"]install['"]/);
  });

  test('has a fetch event listener', () => {
    expect(sw).toMatch(/addEventListener\s*\(\s*['"]fetch['"]/);
  });

  test('has an activate event listener', () => {
    expect(sw).toMatch(/addEventListener\s*\(\s*['"]activate['"]/);
  });

  test('defines a cache name constant', () => {
    expect(sw).toMatch(/CACHE_NAME|cacheName|CACHE_VERSION/);
  });

  test('lists app shell files to cache', () => {
    expect(sw).toMatch(/APP_SHELL|appShell|urlsToCache|SHELL_URLS/);
  });

  test('uses cache.addAll or cache.add during install', () => {
    expect(sw).toMatch(/\.addAll\s*\(|\.add\s*\(/);
  });

  test('implements cache-first fetch strategy', () => {
    expect(sw).toMatch(/caches\.match|cache\.match/);
  });
});

describe('sw.js — registration in index.html', () => {
  test('app.js or index.html registers the service worker', () => {
    const appJsPath = path.join(__dirname, '..', 'app.js');
    const htmlPath = path.join(__dirname, '..', 'index.html');
    const appJs = fs.existsSync(appJsPath) ? fs.readFileSync(appJsPath, 'utf8') : '';
    const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';
    const combined = appJs + html;
    expect(combined).toMatch(/serviceWorker\.register/);
  });
});

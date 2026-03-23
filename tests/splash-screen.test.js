const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', 'manifest.json');
let manifest;

beforeAll(() => {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
});

describe('Splash screen — manifest fields', () => {
  test('manifest has background_color for splash', () => {
    expect(manifest.background_color).toBeDefined();
    expect(typeof manifest.background_color).toBe('string');
    expect(manifest.background_color.length).toBeGreaterThan(0);
  });

  test('manifest has theme_color for splash', () => {
    expect(manifest.theme_color).toBeDefined();
    expect(typeof manifest.theme_color).toBe('string');
    expect(manifest.theme_color.length).toBeGreaterThan(0);
  });

  test('manifest has name for splash text', () => {
    expect(manifest.name).toBeDefined();
    expect(manifest.name.length).toBeGreaterThan(0);
  });

  test('manifest has 512x512 icon for splash', () => {
    const icon512 = manifest.icons.find(i => i.sizes === '512x512');
    expect(icon512).toBeDefined();
  });
});

describe('Splash screen — iOS meta tags', () => {
  const htmlFiles = ['index.html', 'chart.html', 'week.html', 'heatmap.html', 'correlation.html', 'settings.html'];

  htmlFiles.forEach(file => {
    test(`${file} has apple-mobile-web-app-capable meta tag`, () => {
      const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      expect(html).toMatch(/name=["']apple-mobile-web-app-capable["']/);
    });

    test(`${file} has apple-mobile-web-app-status-bar-style meta tag`, () => {
      const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      expect(html).toMatch(/name=["']apple-mobile-web-app-status-bar-style["']/);
    });
  });
});

describe('Splash screen — CSS loading screen', () => {
  test('styles.css has splash-screen styles', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
    expect(css).toMatch(/\.splash-screen/);
  });

  test('index.html has a splash-screen element', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    expect(html).toMatch(/class=["']splash-screen["']/);
  });

  test('app.js hides splash screen on load', () => {
    const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    expect(appJs).toMatch(/splash/i);
  });
});

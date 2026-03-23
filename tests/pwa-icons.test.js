const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'icons');
const manifestPath = path.join(__dirname, '..', 'manifest.json');

let manifest;
beforeAll(() => {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
});

describe('PWA Icons — file existence', () => {
  test('icons directory exists', () => {
    expect(fs.existsSync(iconsDir)).toBe(true);
    expect(fs.statSync(iconsDir).isDirectory()).toBe(true);
  });

  test('icon-192.png exists', () => {
    expect(fs.existsSync(path.join(iconsDir, 'icon-192.png'))).toBe(true);
  });

  test('icon-512.png exists', () => {
    expect(fs.existsSync(path.join(iconsDir, 'icon-512.png'))).toBe(true);
  });

  test('icon files are non-empty', () => {
    const icon192 = fs.statSync(path.join(iconsDir, 'icon-192.png'));
    const icon512 = fs.statSync(path.join(iconsDir, 'icon-512.png'));
    expect(icon192.size).toBeGreaterThan(100);
    expect(icon512.size).toBeGreaterThan(100);
  });
});

describe('PWA Icons — manifest configuration', () => {
  test('manifest has at least 2 icon sizes', () => {
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  test('manifest includes a 192x192 icon', () => {
    const icon192 = manifest.icons.find(i => i.sizes === '192x192');
    expect(icon192).toBeDefined();
    expect(icon192.src).toMatch(/icon-192/);
    expect(icon192.type).toBe('image/png');
  });

  test('manifest includes a 512x512 icon', () => {
    const icon512 = manifest.icons.find(i => i.sizes === '512x512');
    expect(icon512).toBeDefined();
    expect(icon512.src).toMatch(/icon-512/);
    expect(icon512.type).toBe('image/png');
  });

  test('icons have purpose field for maskable support', () => {
    manifest.icons.forEach(icon => {
      expect(icon.purpose).toBeDefined();
      expect(icon.purpose).toMatch(/any|maskable/);
    });
  });
});

describe('PWA Icons — apple-touch-icon in HTML', () => {
  const htmlFiles = ['index.html', 'chart.html', 'week.html', 'heatmap.html', 'correlation.html', 'settings.html'];

  htmlFiles.forEach(file => {
    test(`${file} has apple-touch-icon link`, () => {
      const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      expect(html).toMatch(/rel=["']apple-touch-icon["']/);
    });
  });
});

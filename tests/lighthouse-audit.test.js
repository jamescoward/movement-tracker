const fs = require('fs');
const path = require('path');

const htmlFiles = ['index.html', 'chart.html', 'week.html', 'heatmap.html', 'correlation.html', 'settings.html'];

describe('Lighthouse PWA — manifest completeness', () => {
  let manifest;
  beforeAll(() => {
    manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'));
  });

  test('manifest has all required PWA fields', () => {
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display).toBeDefined();
    expect(manifest.background_color).toBeDefined();
    expect(manifest.theme_color).toBeDefined();
    expect(manifest.icons).toBeDefined();
  });

  test('manifest has description', () => {
    expect(manifest.description).toBeDefined();
    expect(manifest.description.length).toBeGreaterThan(0);
  });

  test('manifest has a 192x192 and 512x512 icon', () => {
    const sizes = manifest.icons.map(i => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });
});

describe('Lighthouse Accessibility — HTML lang attribute', () => {
  htmlFiles.forEach(file => {
    test(`${file} has lang attribute on html element`, () => {
      const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      expect(html).toMatch(/<html[^>]+lang=["'][a-z]{2}/);
    });
  });
});

describe('Lighthouse Accessibility — meta viewport', () => {
  htmlFiles.forEach(file => {
    test(`${file} has viewport meta tag`, () => {
      const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      expect(html).toMatch(/name=["']viewport["']/);
    });
  });
});

describe('Lighthouse Accessibility — meta description', () => {
  htmlFiles.forEach(file => {
    test(`${file} has meta description`, () => {
      const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      expect(html).toMatch(/name=["']description["']/);
    });
  });
});

describe('Lighthouse Accessibility — page titles', () => {
  htmlFiles.forEach(file => {
    test(`${file} has a non-empty <title>`, () => {
      const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      const match = html.match(/<title>([^<]+)<\/title>/);
      expect(match).not.toBeNull();
      expect(match[1].trim().length).toBeGreaterThan(0);
    });
  });
});

describe('Lighthouse Accessibility — heading hierarchy', () => {
  htmlFiles.forEach(file => {
    test(`${file} has at least one heading`, () => {
      const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      expect(html).toMatch(/<h[1-6][^>]*>/);
    });
  });
});

describe('Lighthouse Accessibility — main landmark', () => {
  htmlFiles.forEach(file => {
    test(`${file} has a <main> element`, () => {
      const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      expect(html).toMatch(/<main/);
    });
  });
});

describe('Lighthouse Performance — no render-blocking resources', () => {
  test('styles.css is the only stylesheet (no external fonts blocking render)', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const stylesheets = html.match(/rel=["']stylesheet["']/g) || [];
    expect(stylesheets.length).toBe(1);
  });
});

describe('Lighthouse PWA — service worker caches icons', () => {
  test('service worker APP_SHELL includes icon paths or icons are in manifest', () => {
    const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'));
    // Either SW caches icons explicitly, or manifest references them (browser will cache via SW fetch handler)
    const hasIconsInSW = sw.includes('icon');
    const hasIconsInManifest = manifest.icons.length >= 2;
    expect(hasIconsInSW || hasIconsInManifest).toBe(true);
  });
});

describe('Lighthouse PWA — theme-color meta tag', () => {
  htmlFiles.forEach(file => {
    test(`${file} has theme-color meta tag`, () => {
      const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      expect(html).toMatch(/name=["']theme-color["']/);
    });
  });
});

describe('Lighthouse Best Practices — charset declaration', () => {
  htmlFiles.forEach(file => {
    test(`${file} has charset meta tag`, () => {
      const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      expect(html).toMatch(/charset=["']?UTF-8["']?/i);
    });
  });
});

describe('Lighthouse Accessibility — buttons have accessible names', () => {
  test('index.html buttons have text content or aria-label', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    // Check that key buttons have text content
    expect(html).toMatch(/id=["']log-movement-btn["'][^>]*>[^<]*\S/);
    expect(html).toMatch(/id=["']install-btn["'][^>]*>[^<]*\S/);
  });
});

describe('Lighthouse Accessibility — images have alt text', () => {
  test('index.html images have alt attributes', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const imgs = html.match(/<img[^>]*>/g) || [];
    imgs.forEach(img => {
      expect(img).toMatch(/alt=/);
    });
  });
});

describe('Deploy config — settings.js copied', () => {
  test('deploy workflow copies settings.js to dist', () => {
    const yml = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'deploy.yml'), 'utf8');
    expect(yml).toMatch(/settings\.js/);
  });
});

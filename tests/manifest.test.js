const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', 'manifest.json');
let manifest;

beforeAll(() => {
  const raw = fs.readFileSync(manifestPath, 'utf8');
  manifest = JSON.parse(raw);
});

describe('manifest.json', () => {
  test('file exists', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
  });

  test('has a name', () => {
    expect(typeof manifest.name).toBe('string');
    expect(manifest.name.length).toBeGreaterThan(0);
  });

  test('has a short_name', () => {
    expect(typeof manifest.short_name).toBe('string');
    expect(manifest.short_name.length).toBeGreaterThan(0);
  });

  test('has a theme_color (not blue or pink)', () => {
    expect(typeof manifest.theme_color).toBe('string');
    expect(manifest.theme_color.length).toBeGreaterThan(0);
    // Must not be plain blue or pink
    expect(manifest.theme_color.toLowerCase()).not.toMatch(/^#0000ff$/);
    expect(manifest.theme_color.toLowerCase()).not.toMatch(/^#ff69b4$/);
  });

  test('has a background_color', () => {
    expect(typeof manifest.background_color).toBe('string');
    expect(manifest.background_color.length).toBeGreaterThan(0);
  });

  test('has a start_url', () => {
    expect(typeof manifest.start_url).toBe('string');
    expect(manifest.start_url.length).toBeGreaterThan(0);
  });

  test('has a display mode', () => {
    const validModes = ['standalone', 'fullscreen', 'minimal-ui', 'browser'];
    expect(validModes).toContain(manifest.display);
  });

  test('has an icons array with at least one entry', () => {
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(1);
    const icon = manifest.icons[0];
    expect(typeof icon.src).toBe('string');
    expect(typeof icon.sizes).toBe('string');
    expect(typeof icon.type).toBe('string');
  });
});

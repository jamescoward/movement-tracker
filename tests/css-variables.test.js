const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'styles.css');
let css;

beforeAll(() => {
  css = fs.readFileSync(cssPath, 'utf8');
});

describe('styles.css — file exists', () => {
  test('file exists', () => {
    expect(fs.existsSync(cssPath)).toBe(true);
  });
});

describe('styles.css — CSS custom properties (colour palette)', () => {
  test('defines at least one CSS custom property in :root', () => {
    expect(css).toMatch(/:root\s*\{[^}]*--/);
  });

  test('defines a primary colour variable', () => {
    expect(css).toMatch(/--color-primary\s*:/);
  });

  test('defines a background colour variable', () => {
    expect(css).toMatch(/--color-bg\s*:/);
  });

  test('defines a surface/card colour variable', () => {
    expect(css).toMatch(/--color-surface\s*:/);
  });

  test('defines a text colour variable', () => {
    expect(css).toMatch(/--color-text\s*:/);
  });

  test('defines a accent colour variable', () => {
    expect(css).toMatch(/--color-accent\s*:/);
  });
});

describe('styles.css — responsive layout', () => {
  test('includes a box-sizing rule', () => {
    expect(css).toMatch(/box-sizing\s*:\s*border-box/);
  });

  test('styles the header element', () => {
    expect(css).toMatch(/\bheader\b/);
  });

  test('styles the main element', () => {
    expect(css).toMatch(/\bmain\b/);
  });

  test('styles the nav element', () => {
    expect(css).toMatch(/\bnav\b/);
  });

  test('includes at least one media query for responsiveness', () => {
    expect(css).toMatch(/@media/);
  });
});

const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'app.js');
let appJs;

beforeAll(() => {
  appJs = fs.readFileSync(appJsPath, 'utf8');
});

describe('app.js', () => {
  test('file exists', () => {
    expect(fs.existsSync(appJsPath)).toBe(true);
  });

  test('registers service worker when supported', () => {
    expect(appJs).toMatch(/serviceWorker/);
    expect(appJs).toMatch(/register/);
  });

  test('uses DOMContentLoaded or equivalent init pattern', () => {
    expect(appJs).toMatch(/DOMContentLoaded|window\.addEventListener/);
  });
});

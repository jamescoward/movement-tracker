/* @jest-environment jsdom */
'use strict';

const fs = require('fs');
const path = require('path');

// ─── File existence ──────────────────────────────────────────────────────────

describe('data-io — files', () => {
  test('data-io.js file exists', () => {
    expect(fs.existsSync(path.join(__dirname, '..', 'data-io.js'))).toBe(true);
  });

  test('settings.html file exists', () => {
    expect(fs.existsSync(path.join(__dirname, '..', 'settings.html'))).toBe(true);
  });
});

// ─── HTML structure ──────────────────────────────────────────────────────────

describe('settings.html — structure', () => {
  let htmlDoc;

  beforeAll(() => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'settings.html'), 'utf8');
    const parser = new DOMParser();
    htmlDoc = parser.parseFromString(html, 'text/html');
  });

  test('has a valid DOCTYPE', () => {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'settings.html'), 'utf8');
    expect(raw.trim().toLowerCase().startsWith('<!doctype html>')).toBe(true);
  });

  test('has lang attribute on html element', () => {
    expect(htmlDoc.documentElement.getAttribute('lang')).toBe('en');
  });

  test('has a <main> element', () => {
    expect(htmlDoc.querySelector('main')).not.toBeNull();
  });

  test('has a <nav> element with navigation links', () => {
    const nav = htmlDoc.querySelector('nav');
    expect(nav).not.toBeNull();
    const links = nav.querySelectorAll('a');
    expect(links.length).toBeGreaterThanOrEqual(3);
  });

  test('settings nav link has aria-current="page"', () => {
    const links = Array.from(htmlDoc.querySelectorAll('nav a'));
    const settingsLink = links.find((l) => l.getAttribute('href') && l.getAttribute('href').includes('settings'));
    expect(settingsLink).not.toBeNull();
    expect(settingsLink.getAttribute('aria-current')).toBe('page');
  });

  test('has an export JSON button #export-json-btn', () => {
    const btn = htmlDoc.getElementById('export-json-btn');
    expect(btn).not.toBeNull();
    expect(btn.tagName.toLowerCase()).toBe('button');
  });

  test('has an export CSV button #export-csv-btn', () => {
    const btn = htmlDoc.getElementById('export-csv-btn');
    expect(btn).not.toBeNull();
    expect(btn.tagName.toLowerCase()).toBe('button');
  });

  test('has a file input for import #import-file-input', () => {
    const input = htmlDoc.getElementById('import-file-input');
    expect(input).not.toBeNull();
    expect(input.getAttribute('type')).toBe('file');
    expect(input.getAttribute('accept')).toBe('.json');
  });

  test('has an import mode selector #import-mode', () => {
    const select = htmlDoc.getElementById('import-mode');
    expect(select).not.toBeNull();
  });

  test('import mode selector has merge and overwrite options', () => {
    const select = htmlDoc.getElementById('import-mode');
    const options = Array.from(select.querySelectorAll('option'));
    const values = options.map((o) => o.getAttribute('value'));
    expect(values).toContain('merge');
    expect(values).toContain('overwrite');
  });

  test('has an import button #import-btn', () => {
    const btn = htmlDoc.getElementById('import-btn');
    expect(btn).not.toBeNull();
    expect(btn.tagName.toLowerCase()).toBe('button');
  });

  test('has a toast element #save-toast', () => {
    const toast = htmlDoc.getElementById('save-toast');
    expect(toast).not.toBeNull();
    expect(toast.hasAttribute('hidden')).toBe(true);
  });

  test('includes data-io.js script', () => {
    const scripts = Array.from(htmlDoc.querySelectorAll('script[src]'));
    const srcs = scripts.map((el) => el.getAttribute('src'));
    expect(srcs.some((s) => s.includes('data-io.js'))).toBe(true);
  });

  test('includes storage.js script', () => {
    const scripts = Array.from(htmlDoc.querySelectorAll('script[src]'));
    const srcs = scripts.map((el) => el.getAttribute('src'));
    expect(srcs.some((s) => s.includes('storage.js'))).toBe(true);
  });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readBlob(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsText(blob);
  });
}

// Sets up mocks for download (createObjectURL + anchor) and returns captured data
function setupDownloadMocks() {
  let capturedBlob;
  let downloadFilename;
  const clickMock = jest.fn();

  const createObjectURL = jest.fn((blob) => { capturedBlob = blob; return 'blob:mock-url'; });
  const revokeObjectURL = jest.fn();
  global.URL.createObjectURL = createObjectURL;
  global.URL.revokeObjectURL = revokeObjectURL;

  const origCreateElement = document.createElement.bind(document);
  jest.spyOn(document, 'createElement').mockImplementation((tag) => {
    if (tag === 'a') {
      const anchor = { href: '', style: {} };
      Object.defineProperty(anchor, 'download', {
        set(val) { downloadFilename = val; },
        get() { return downloadFilename; },
      });
      anchor.click = clickMock;
      return anchor;
    }
    return origCreateElement(tag);
  });

  return {
    getBlob: () => capturedBlob,
    getFilename: () => downloadFilename,
    clickMock,
    restore: () => document.createElement.mockRestore(),
  };
}

// ─── data-io.js module behaviour ─────────────────────────────────────────────

describe('data-io.js — module', () => {
  let dataIO;
  let storage;

  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();

    document.body.innerHTML = `
      <button id="export-json-btn">Export JSON</button>
      <button id="export-csv-btn">Export CSV</button>
      <input type="file" id="import-file-input" accept=".json" />
      <select id="import-mode">
        <option value="merge">Merge</option>
        <option value="overwrite">Overwrite</option>
      </select>
      <button id="import-btn">Import</button>
      <div id="save-toast" role="status" aria-live="polite" hidden></div>
    `;

    storage = require('../storage.js');
    dataIO = require('../data-io.js');
  });

  // ── initDataIO() ──────────────────────────────────────────────────────────

  describe('initDataIO()', () => {
    test('exports initDataIO function', () => {
      expect(typeof dataIO.initDataIO).toBe('function');
    });

    test('does not throw when called', () => {
      expect(() => dataIO.initDataIO()).not.toThrow();
    });
  });

  // ── JSON export ───────────────────────────────────────────────────────────

  describe('exportJSON()', () => {
    test('exports exportJSON function', () => {
      expect(typeof dataIO.exportJSON).toBe('function');
    });

    test('creates a downloadable JSON blob URL', () => {
      storage.saveMovement({ notes: 'test' });
      const mocks = setupDownloadMocks();

      dataIO.exportJSON();

      expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(mocks.getBlob()).toBeInstanceOf(Blob);
      expect(mocks.clickMock).toHaveBeenCalled();
      mocks.restore();
    });

    test('exported JSON contains all movements', () => {
      storage.saveMovement({ notes: 'one' });
      storage.saveMovement({ notes: 'two' });
      const mocks = setupDownloadMocks();

      dataIO.exportJSON();

      return readBlob(mocks.getBlob()).then((text) => {
        const parsed = JSON.parse(text);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed).toHaveLength(2);
        mocks.restore();
      });
    });

    test('download filename includes date and .json extension', () => {
      storage.saveMovement({ notes: 'test' });
      const mocks = setupDownloadMocks();

      dataIO.exportJSON();
      expect(mocks.getFilename()).toMatch(/\.json$/);
      expect(mocks.getFilename()).toMatch(/movement/i);
      mocks.restore();
    });
  });

  // ── CSV export ────────────────────────────────────────────────────────────

  describe('exportCSV()', () => {
    test('exports exportCSV function', () => {
      expect(typeof dataIO.exportCSV).toBe('function');
    });

    test('generates CSV with header row', () => {
      storage.saveMovement({ notes: 'test' });
      const mocks = setupDownloadMocks();

      dataIO.exportCSV();

      return readBlob(mocks.getBlob()).then((text) => {
        const lines = text.trim().split('\n');
        expect(lines[0]).toContain('timestamp');
        expect(lines[0]).toContain('justEaten');
        expect(lines[0]).toContain('notes');
        mocks.restore();
      });
    });

    test('CSV has one data row per movement', () => {
      storage.saveMovement({ notes: 'first' });
      storage.saveMovement({ notes: 'second' });
      const mocks = setupDownloadMocks();

      dataIO.exportCSV();

      return readBlob(mocks.getBlob()).then((text) => {
        const lines = text.trim().split('\n');
        // 1 header + 2 data rows
        expect(lines).toHaveLength(3);
        mocks.restore();
      });
    });

    test('CSV correctly encodes flag values as true/false', () => {
      storage.saveMovement({ flags: { justEaten: true, resting: true } });
      const mocks = setupDownloadMocks();

      dataIO.exportCSV();

      return readBlob(mocks.getBlob()).then((text) => {
        const lines = text.trim().split('\n');
        expect(lines[1]).toContain('true');
        mocks.restore();
      });
    });

    test('CSV escapes notes containing commas', () => {
      storage.saveMovement({ notes: 'big kick, very strong' });
      const mocks = setupDownloadMocks();

      dataIO.exportCSV();

      return readBlob(mocks.getBlob()).then((text) => {
        const lines = text.trim().split('\n');
        // Notes with commas should be quoted
        expect(lines[1]).toContain('"big kick, very strong"');
        mocks.restore();
      });
    });

    test('download filename has .csv extension', () => {
      storage.saveMovement({ notes: 'test' });
      const mocks = setupDownloadMocks();

      dataIO.exportCSV();
      expect(mocks.getFilename()).toMatch(/\.csv$/);
      mocks.restore();
    });
  });

  // ── Import ────────────────────────────────────────────────────────────────

  describe('handleImport()', () => {
    test('exports handleImport function', () => {
      expect(typeof dataIO.handleImport).toBe('function');
    });

    test('shows error toast when no file is selected', () => {
      jest.useFakeTimers();
      dataIO.initDataIO();

      // No file selected on input
      const input = document.getElementById('import-file-input');
      Object.defineProperty(input, 'files', { value: [], writable: true });

      dataIO.handleImport();

      const toast = document.getElementById('save-toast');
      expect(toast.hidden).toBe(false);
      expect(toast.textContent).toMatch(/select.*file/i);

      jest.useRealTimers();
    });

    test('merge mode adds new records without removing existing', (done) => {
      storage.saveMovement({ notes: 'existing' });

      const importRecords = [
        { id: 'import-1', timestamp: '2024-06-01T09:00:00.000Z', flags: { justEaten: false, crunchedUp: false, listeningToMusic: false, resting: false, active: false }, notes: 'imported' },
      ];

      const file = new File([JSON.stringify(importRecords)], 'test.json', { type: 'application/json' });
      const input = document.getElementById('import-file-input');
      Object.defineProperty(input, 'files', { value: [file], writable: true });

      document.getElementById('import-mode').value = 'merge';

      dataIO.initDataIO();
      dataIO.handleImport();

      // FileReader is async, wait a tick
      setTimeout(() => {
        const all = storage.getMovements();
        expect(all).toHaveLength(2);
        expect(all.some((m) => m.notes === 'existing')).toBe(true);
        expect(all.some((m) => m.notes === 'imported')).toBe(true);
        done();
      }, 50);
    });

    test('overwrite mode replaces all existing data', (done) => {
      storage.saveMovement({ notes: 'existing' });

      const importRecords = [
        { id: 'import-1', timestamp: '2024-06-01T09:00:00.000Z', flags: { justEaten: false, crunchedUp: false, listeningToMusic: false, resting: false, active: false }, notes: 'replacement' },
      ];

      const file = new File([JSON.stringify(importRecords)], 'test.json', { type: 'application/json' });
      const input = document.getElementById('import-file-input');
      Object.defineProperty(input, 'files', { value: [file], writable: true });

      document.getElementById('import-mode').value = 'overwrite';

      dataIO.initDataIO();
      dataIO.handleImport();

      setTimeout(() => {
        const all = storage.getMovements();
        expect(all).toHaveLength(1);
        expect(all[0].notes).toBe('replacement');
        done();
      }, 50);
    });

    test('shows error toast on invalid JSON import', (done) => {
      const file = new File(['not valid json!!!'], 'bad.json', { type: 'application/json' });
      const input = document.getElementById('import-file-input');
      Object.defineProperty(input, 'files', { value: [file], writable: true });

      dataIO.initDataIO();
      dataIO.handleImport();

      setTimeout(() => {
        const toast = document.getElementById('save-toast');
        expect(toast.hidden).toBe(false);
        expect(toast.textContent).toMatch(/invalid|error/i);
        done();
      }, 50);
    });

    test('shows error toast when imported data is not an array', (done) => {
      const file = new File([JSON.stringify({ not: 'array' })], 'bad.json', { type: 'application/json' });
      const input = document.getElementById('import-file-input');
      Object.defineProperty(input, 'files', { value: [file], writable: true });

      dataIO.initDataIO();
      dataIO.handleImport();

      setTimeout(() => {
        const toast = document.getElementById('save-toast');
        expect(toast.hidden).toBe(false);
        expect(toast.textContent).toMatch(/invalid|error/i);
        done();
      }, 50);
    });

    test('shows success toast on valid import', (done) => {
      const importRecords = [
        { id: 'import-1', timestamp: '2024-06-01T09:00:00.000Z', flags: { justEaten: false, crunchedUp: false, listeningToMusic: false, resting: false, active: false }, notes: 'good' },
      ];
      const file = new File([JSON.stringify(importRecords)], 'test.json', { type: 'application/json' });
      const input = document.getElementById('import-file-input');
      Object.defineProperty(input, 'files', { value: [file], writable: true });

      document.getElementById('import-mode').value = 'merge';

      dataIO.initDataIO();
      dataIO.handleImport();

      setTimeout(() => {
        const toast = document.getElementById('save-toast');
        expect(toast.hidden).toBe(false);
        expect(toast.textContent).toMatch(/imported|success/i);
        done();
      }, 50);
    });
  });

  // ── showToast() ───────────────────────────────────────────────────────────

  describe('showToast()', () => {
    test('exports showToast function', () => {
      expect(typeof dataIO.showToast).toBe('function');
    });

    test('makes toast visible with message', () => {
      jest.useFakeTimers();
      dataIO.showToast('Test message');
      const toast = document.getElementById('save-toast');
      expect(toast.hidden).toBe(false);
      expect(toast.textContent).toBe('Test message');
      jest.useRealTimers();
    });

    test('hides toast after 3 seconds', () => {
      jest.useFakeTimers();
      dataIO.showToast('Test');
      jest.advanceTimersByTime(3000);
      expect(document.getElementById('save-toast').hidden).toBe(true);
      jest.useRealTimers();
    });
  });
});

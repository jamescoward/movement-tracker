/* @jest-environment jsdom */
'use strict';

const fs = require('fs');
const path = require('path');

// ─── File existence ──────────────────────────────────────────────────────────

describe('log.js — file', () => {
  test('log.js file exists', () => {
    expect(fs.existsSync(path.join(__dirname, '..', 'log.js'))).toBe(true);
  });
});

// ─── HTML structure ──────────────────────────────────────────────────────────

describe('index.html — logging UI structure', () => {
  let htmlDoc;

  beforeAll(() => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    // Use jsdom's built-in DOMParser (available in jsdom environment)
    const parser = new DOMParser();
    htmlDoc = parser.parseFromString(html, 'text/html');
  });

  test('has a #log-movement-btn button', () => {
    expect(htmlDoc.getElementById('log-movement-btn')).not.toBeNull();
  });

  test('#log-movement-btn is a <button> element', () => {
    expect(htmlDoc.getElementById('log-movement-btn').tagName.toLowerCase()).toBe('button');
  });

  test('has a time input #movement-time', () => {
    const el = htmlDoc.getElementById('movement-time');
    expect(el).not.toBeNull();
    expect(el.getAttribute('type')).toBe('time');
  });

  test('has a flags-grid container for dynamic flag rendering', () => {
    const grid = htmlDoc.getElementById('flags-grid');
    expect(grid).not.toBeNull();
    expect(grid.className).toContain('flags-grid');
  });

  test('has a notes textarea #movement-notes', () => {
    const el = htmlDoc.getElementById('movement-notes');
    expect(el).not.toBeNull();
    expect(el.tagName.toLowerCase()).toBe('textarea');
  });

  test('has a toast element #save-toast', () => {
    expect(htmlDoc.getElementById('save-toast')).not.toBeNull();
  });

  test('#save-toast starts hidden', () => {
    expect(htmlDoc.getElementById('save-toast').hasAttribute('hidden')).toBe(true);
  });

  test('has a recent movements list #recent-movements', () => {
    const el = htmlDoc.getElementById('recent-movements');
    expect(el).not.toBeNull();
    expect(el.tagName.toLowerCase()).toBe('ul');
  });

  test('includes log.js script', () => {
    const scripts = Array.from(htmlDoc.querySelectorAll('script[src]'));
    const srcs = scripts.map((el) => el.getAttribute('src'));
    expect(srcs.some((s) => s.includes('log.js'))).toBe(true);
  });
});

// ─── log.js module behaviour ─────────────────────────────────────────────────

describe('log.js — module', () => {
  let log;
  let storage;

  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    jest.useFakeTimers();

    // Minimal DOM fixture matching what index.html will provide
    document.body.innerHTML = `
      <input type="time" id="movement-time" />
      <fieldset class="flags-group">
        <div class="flags-grid">
          <button class="flag-toggle" data-flag="justEaten" aria-pressed="false">Just eaten</button>
          <button class="flag-toggle" data-flag="crunchedUp" aria-pressed="false">Crunched up</button>
          <button class="flag-toggle" data-flag="listeningToMusic" aria-pressed="false">Listening to music</button>
          <button class="flag-toggle" data-flag="resting" aria-pressed="false">Resting</button>
          <button class="flag-toggle" data-flag="active" aria-pressed="false">Active</button>
        </div>
      </fieldset>
      <textarea id="movement-notes"></textarea>
      <button id="log-movement-btn">Log Movement</button>
      <div id="save-toast" hidden>Movement logged</div>
      <ul id="recent-movements"></ul>
    `;

    storage = require('../storage.js');
    log = require('../log.js');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── initLogForm() ────────────────────────────────────────────────────────

  describe('initLogForm()', () => {
    test('sets the time input to the current HH:MM', () => {
      jest.setSystemTime(new Date(2024, 0, 15, 14, 30)); // 14:30
      log.initLogForm();
      expect(document.getElementById('movement-time').value).toBe('14:30');
    });

    test('pads single-digit hours and minutes', () => {
      jest.setSystemTime(new Date(2024, 0, 15, 9, 5)); // 09:05
      log.initLogForm();
      expect(document.getElementById('movement-time').value).toBe('09:05');
    });

    test('clicking a flag toggle adds flag-toggle--active class', () => {
      log.initLogForm();
      const btn = document.querySelector('[data-flag="justEaten"]');
      btn.click();
      expect(btn.classList.contains('flag-toggle--active')).toBe(true);
    });

    test('clicking an active flag toggle removes flag-toggle--active class', () => {
      log.initLogForm();
      const btn = document.querySelector('[data-flag="justEaten"]');
      btn.click();
      btn.click();
      expect(btn.classList.contains('flag-toggle--active')).toBe(false);
    });

    test('clicking a flag toggle sets aria-pressed="true"', () => {
      log.initLogForm();
      const btn = document.querySelector('[data-flag="justEaten"]');
      btn.click();
      expect(btn.getAttribute('aria-pressed')).toBe('true');
    });

    test('clicking an active flag toggle sets aria-pressed="false"', () => {
      log.initLogForm();
      const btn = document.querySelector('[data-flag="justEaten"]');
      btn.click();
      btn.click();
      expect(btn.getAttribute('aria-pressed')).toBe('false');
    });

    test('renders recent movements on init', () => {
      log.initLogForm();
      const list = document.getElementById('recent-movements');
      expect(list.innerHTML.length).toBeGreaterThan(0);
    });

    test('clicking #log-movement-btn triggers a save', () => {
      log.initLogForm();
      document.getElementById('movement-time').value = '12:00';
      document.getElementById('log-movement-btn').click();
      expect(storage.getMovements().length).toBe(1);
    });
  });

  // ── handleSave() ─────────────────────────────────────────────────────────

  describe('handleSave()', () => {
    test('saves a movement to storage', () => {
      log.initLogForm();
      document.getElementById('movement-time').value = '10:00';
      log.handleSave();
      expect(storage.getMovements().length).toBe(1);
    });

    test('saved record has correct flags when none are toggled', () => {
      log.initLogForm();
      document.getElementById('movement-time').value = '10:00';
      log.handleSave();
      const [record] = storage.getMovements();
      expect(record.flags.justEaten).toBe(false);
      expect(record.flags.active).toBe(false);
    });

    test('saved record reflects toggled flags', () => {
      log.initLogForm();
      document.getElementById('movement-time').value = '10:00';
      document.querySelector('[data-flag="justEaten"]').click();
      document.querySelector('[data-flag="resting"]').click();
      log.handleSave();
      const [record] = storage.getMovements();
      expect(record.flags.justEaten).toBe(true);
      expect(record.flags.resting).toBe(true);
      expect(record.flags.crunchedUp).toBe(false);
    });

    test('saved record includes notes text', () => {
      log.initLogForm();
      document.getElementById('movement-time').value = '10:00';
      document.getElementById('movement-notes').value = 'Strong kick after lunch';
      log.handleSave();
      const [record] = storage.getMovements();
      expect(record.notes).toBe('Strong kick after lunch');
    });

    test('resets all flag toggles after save', () => {
      log.initLogForm();
      document.getElementById('movement-time').value = '10:00';
      document.querySelector('[data-flag="justEaten"]').click();
      log.handleSave();
      document.querySelectorAll('.flag-toggle').forEach((btn) => {
        expect(btn.classList.contains('flag-toggle--active')).toBe(false);
        expect(btn.getAttribute('aria-pressed')).toBe('false');
      });
    });

    test('clears notes textarea after save', () => {
      log.initLogForm();
      document.getElementById('movement-time').value = '10:00';
      document.getElementById('movement-notes').value = 'test note';
      log.handleSave();
      expect(document.getElementById('movement-notes').value).toBe('');
    });

    test('shows the toast after save', () => {
      log.initLogForm();
      document.getElementById('movement-time').value = '10:00';
      log.handleSave();
      expect(document.getElementById('save-toast').hidden).toBe(false);
    });

    test('re-renders recent movements after save', () => {
      log.initLogForm();
      document.getElementById('movement-time').value = '10:00';
      log.handleSave();
      const items = document.querySelectorAll('.movement-item');
      expect(items.length).toBe(1);
    });
  });

  // ── showToast() ───────────────────────────────────────────────────────────

  describe('showToast()', () => {
    test('makes the toast visible', () => {
      log.showToast('Movement logged');
      expect(document.getElementById('save-toast').hidden).toBe(false);
    });

    test('sets the toast text content', () => {
      log.showToast('Test message');
      expect(document.getElementById('save-toast').textContent).toBe('Test message');
    });

    test('hides the toast after 3 seconds', () => {
      log.showToast('Movement logged');
      jest.advanceTimersByTime(3000);
      expect(document.getElementById('save-toast').hidden).toBe(true);
    });

    test('toast remains visible before 3 seconds elapse', () => {
      log.showToast('Movement logged');
      jest.advanceTimersByTime(2999);
      expect(document.getElementById('save-toast').hidden).toBe(false);
    });
  });

  // ── renderRecentMovements() ───────────────────────────────────────────────

  describe('renderRecentMovements()', () => {
    test('shows an empty-state item when no movements today', () => {
      log.renderRecentMovements();
      const list = document.getElementById('recent-movements');
      expect(list.innerHTML).toMatch(/no movements/i);
    });

    test('renders one list item per movement saved today', () => {
      storage.saveMovement({});
      storage.saveMovement({});
      log.renderRecentMovements();
      const items = document.querySelectorAll('.movement-item');
      expect(items.length).toBe(2);
    });

    test('each movement item has a .movement-time element', () => {
      storage.saveMovement({});
      log.renderRecentMovements();
      expect(document.querySelector('.movement-time')).not.toBeNull();
    });

    test('displays notes text when notes are present', () => {
      storage.saveMovement({ notes: 'big kick' });
      log.renderRecentMovements();
      expect(document.getElementById('recent-movements').innerHTML).toContain('big kick');
    });

    test('does not show notes element when notes are empty', () => {
      storage.saveMovement({ notes: '' });
      log.renderRecentMovements();
      expect(document.querySelector('.movement-notes')).toBeNull();
    });

    test('does not render movements from yesterday', () => {
      // Manually insert a movement from yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const raw = JSON.parse(localStorage.getItem('movement_tracker_data') || '[]');
      raw.push({ id: 'old1', timestamp: yesterday.toISOString(), flags: {}, notes: '' });
      localStorage.setItem('movement_tracker_data', JSON.stringify(raw));

      log.renderRecentMovements();
      const items = document.querySelectorAll('.movement-item');
      expect(items.length).toBe(0);
    });
  });
});

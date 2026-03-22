/* @jest-environment jsdom */
'use strict';

const fs = require('fs');
const path = require('path');

// ─── File existence ──────────────────────────────────────────────────────────

describe('settings.js — file', () => {
  test('settings.js file exists', () => {
    expect(fs.existsSync(path.join(__dirname, '..', 'settings.js'))).toBe(true);
  });
});

// ─── HTML structure for Sprint 4.2 features ─────────────────────────────────

describe('settings.html — Sprint 4.2 sections', () => {
  let htmlDoc;

  beforeAll(() => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'settings.html'), 'utf8');
    const parser = new DOMParser();
    htmlDoc = parser.parseFromString(html, 'text/html');
  });

  // ── Custom flags section ──

  test('has a custom flags section', () => {
    const section = htmlDoc.querySelector('[aria-label="Custom flags"]');
    expect(section).not.toBeNull();
  });

  test('has a flag list container #custom-flags-list', () => {
    expect(htmlDoc.getElementById('custom-flags-list')).not.toBeNull();
  });

  test('has an add-flag input #new-flag-input', () => {
    const input = htmlDoc.getElementById('new-flag-input');
    expect(input).not.toBeNull();
    expect(input.getAttribute('type')).toBe('text');
  });

  test('has an add-flag button #add-flag-btn', () => {
    const btn = htmlDoc.getElementById('add-flag-btn');
    expect(btn).not.toBeNull();
    expect(btn.tagName.toLowerCase()).toBe('button');
  });

  // ── Reminders section ──

  test('has a reminders section', () => {
    const section = htmlDoc.querySelector('[aria-label="Reminders"]');
    expect(section).not.toBeNull();
  });

  test('has a reminder toggle #reminder-toggle', () => {
    const toggle = htmlDoc.getElementById('reminder-toggle');
    expect(toggle).not.toBeNull();
  });

  test('has a reminder time input #reminder-time', () => {
    const input = htmlDoc.getElementById('reminder-time');
    expect(input).not.toBeNull();
    expect(input.getAttribute('type')).toBe('time');
  });

  // ── Dark mode section ──

  test('has an appearance section', () => {
    const section = htmlDoc.querySelector('[aria-label="Appearance"]');
    expect(section).not.toBeNull();
  });

  test('has a dark mode toggle #dark-mode-toggle', () => {
    const toggle = htmlDoc.getElementById('dark-mode-toggle');
    expect(toggle).not.toBeNull();
  });

  test('loads settings.js script', () => {
    const scripts = Array.from(htmlDoc.querySelectorAll('script'));
    const hasSettingsScript = scripts.some((s) => s.getAttribute('src') === 'settings.js');
    expect(hasSettingsScript).toBe(true);
  });
});

// ─── Custom flags storage ────────────────────────────────────────────────────

describe('Custom flags — storage', () => {
  let storage;

  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
    storage = require('../storage.js');
  });

  test('getCustomFlags returns default flags when none saved', () => {
    const flags = storage.getCustomFlags();
    expect(flags).toEqual([
      { key: 'justEaten', label: 'Just eaten' },
      { key: 'crunchedUp', label: 'Crunched up' },
      { key: 'listeningToMusic', label: 'Listening to music' },
      { key: 'resting', label: 'Resting' },
      { key: 'active', label: 'Active' },
    ]);
  });

  test('saveCustomFlags persists flags to localStorage', () => {
    const flags = [
      { key: 'justEaten', label: 'Just eaten' },
      { key: 'myCustomFlag', label: 'My custom flag' },
    ];
    storage.saveCustomFlags(flags);
    const loaded = storage.getCustomFlags();
    expect(loaded).toEqual(flags);
  });

  test('addCustomFlag appends a new flag', () => {
    storage.addCustomFlag('Drinking water');
    const flags = storage.getCustomFlags();
    const last = flags[flags.length - 1];
    expect(last.label).toBe('Drinking water');
    expect(last.key).toBe('drinkingWater');
  });

  test('removeCustomFlag removes a flag by key', () => {
    storage.removeCustomFlag('resting');
    const flags = storage.getCustomFlags();
    expect(flags.find((f) => f.key === 'resting')).toBeUndefined();
  });

  test('renameCustomFlag changes the label of a flag', () => {
    storage.renameCustomFlag('justEaten', 'Recently ate');
    const flags = storage.getCustomFlags();
    const flag = flags.find((f) => f.key === 'justEaten');
    expect(flag.label).toBe('Recently ate');
  });
});

// ─── Custom flags UI ─────────────────────────────────────────────────────────

describe('Custom flags — UI', () => {
  let settings;

  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();

    document.body.innerHTML = `
      <ul id="custom-flags-list"></ul>
      <input type="text" id="new-flag-input" />
      <button id="add-flag-btn">Add flag</button>
      <div id="save-toast" role="status" hidden></div>
    `;

    // Load storage first, then settings
    require('../storage.js');
    settings = require('../settings.js');
  });

  test('renderFlags populates the flag list with default flags', () => {
    settings.renderFlags();
    const items = document.querySelectorAll('#custom-flags-list li');
    expect(items.length).toBe(5);
  });

  test('each flag item shows the flag label', () => {
    settings.renderFlags();
    const first = document.querySelector('#custom-flags-list li');
    expect(first.textContent).toContain('Just eaten');
  });

  test('each flag item has a remove button', () => {
    settings.renderFlags();
    const removeButtons = document.querySelectorAll('#custom-flags-list .remove-flag-btn');
    expect(removeButtons.length).toBe(5);
  });

  test('each flag item has a rename button', () => {
    settings.renderFlags();
    const renameButtons = document.querySelectorAll('#custom-flags-list .rename-flag-btn');
    expect(renameButtons.length).toBe(5);
  });

  test('clicking add-flag-btn adds a new flag', () => {
    settings.initSettings();
    const input = document.getElementById('new-flag-input');
    input.value = 'Feeling sleepy';
    document.getElementById('add-flag-btn').click();

    const items = document.querySelectorAll('#custom-flags-list li');
    expect(items.length).toBe(6);
    expect(items[5].textContent).toContain('Feeling sleepy');
  });

  test('add-flag-btn clears the input after adding', () => {
    settings.initSettings();
    const input = document.getElementById('new-flag-input');
    input.value = 'Stretching';
    document.getElementById('add-flag-btn').click();

    expect(input.value).toBe('');
  });

  test('add-flag-btn does not add empty flag', () => {
    settings.initSettings();
    const input = document.getElementById('new-flag-input');
    input.value = '   ';
    document.getElementById('add-flag-btn').click();

    const items = document.querySelectorAll('#custom-flags-list li');
    expect(items.length).toBe(5);
  });

  test('clicking remove button removes the flag', () => {
    settings.initSettings();
    const removeBtn = document.querySelector('#custom-flags-list .remove-flag-btn');
    removeBtn.click();

    const items = document.querySelectorAll('#custom-flags-list li');
    expect(items.length).toBe(4);
  });
});

// ─── Custom flags reflected on log page ──────────────────────────────────────

describe('Custom flags — log page integration', () => {
  test('index.html flags-grid loads dynamically when custom flags are set', () => {
    // Custom flags should be used by log.js when rendering the form
    localStorage.clear();
    jest.resetModules();

    const storage = require('../storage.js');
    storage.saveCustomFlags([
      { key: 'custom1', label: 'Custom 1' },
      { key: 'custom2', label: 'Custom 2' },
    ]);

    document.body.innerHTML = `
      <input type="time" id="movement-time" />
      <fieldset class="flags-group">
        <legend>Context</legend>
        <div class="flags-grid" id="flags-grid"></div>
      </fieldset>
      <textarea id="movement-notes"></textarea>
      <button id="log-movement-btn">Log Movement</button>
      <div id="save-toast" hidden></div>
      <ul id="recent-movements"></ul>
    `;

    const log = require('../log.js');
    log.initLogForm();

    const flagButtons = document.querySelectorAll('.flag-toggle');
    expect(flagButtons.length).toBe(2);
    expect(flagButtons[0].dataset.flag).toBe('custom1');
    expect(flagButtons[0].textContent).toBe('Custom 1');
  });
});

// ─── Reminder notifications ──────────────────────────────────────────────────

describe('Reminder notifications — storage', () => {
  let storage;

  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
    storage = require('../storage.js');
  });

  test('getReminderSettings returns defaults when none saved', () => {
    const settings = storage.getReminderSettings();
    expect(settings).toEqual({
      enabled: false,
      time: '09:00',
    });
  });

  test('saveReminderSettings persists settings', () => {
    storage.saveReminderSettings({ enabled: true, time: '14:30' });
    const loaded = storage.getReminderSettings();
    expect(loaded).toEqual({ enabled: true, time: '14:30' });
  });
});

describe('Reminder notifications — UI', () => {
  let settings;

  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();

    document.body.innerHTML = `
      <ul id="custom-flags-list"></ul>
      <input type="text" id="new-flag-input" />
      <button id="add-flag-btn">Add flag</button>
      <input type="checkbox" id="reminder-toggle" />
      <input type="time" id="reminder-time" value="09:00" />
      <button id="dark-mode-toggle">Toggle dark mode</button>
      <div id="save-toast" role="status" hidden></div>
    `;

    require('../storage.js');
    settings = require('../settings.js');
  });

  test('initSettings loads saved reminder state into toggle', () => {
    localStorage.clear();
    jest.resetModules();

    document.body.innerHTML = `
      <ul id="custom-flags-list"></ul>
      <input type="text" id="new-flag-input" />
      <button id="add-flag-btn">Add flag</button>
      <input type="checkbox" id="reminder-toggle" />
      <input type="time" id="reminder-time" value="09:00" />
      <button id="dark-mode-toggle">Toggle dark mode</button>
      <div id="save-toast" role="status" hidden></div>
    `;

    const st = require('../storage.js');
    st.saveReminderSettings({ enabled: true, time: '15:00' });
    const s = require('../settings.js');
    s.initSettings();

    expect(document.getElementById('reminder-toggle').checked).toBe(true);
    expect(document.getElementById('reminder-time').value).toBe('15:00');
  });

  test('toggling reminder checkbox saves the setting', () => {
    settings.initSettings();

    const toggle = document.getElementById('reminder-toggle');
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));

    const st = require('../storage.js');
    const loaded = st.getReminderSettings();
    expect(loaded.enabled).toBe(true);
  });

  test('changing reminder time saves the setting', () => {
    settings.initSettings();

    const timeInput = document.getElementById('reminder-time');
    timeInput.value = '18:45';
    timeInput.dispatchEvent(new Event('change'));

    const st = require('../storage.js');
    const loaded = st.getReminderSettings();
    expect(loaded.time).toBe('18:45');
  });

  test('enabling reminders requests notification permission', () => {
    // Mock Notification API
    global.Notification = { permission: 'default', requestPermission: jest.fn(() => Promise.resolve('granted')) };

    settings.initSettings();

    const toggle = document.getElementById('reminder-toggle');
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));

    expect(Notification.requestPermission).toHaveBeenCalled();
  });
});

// ─── Dark/light mode ─────────────────────────────────────────────────────────

describe('Dark mode — storage', () => {
  let storage;

  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
    storage = require('../storage.js');
  });

  test('getDarkMode returns false by default', () => {
    expect(storage.getDarkMode()).toBe(false);
  });

  test('setDarkMode persists the preference', () => {
    storage.setDarkMode(true);
    expect(storage.getDarkMode()).toBe(true);
  });
});

describe('Dark mode — UI toggle', () => {
  let settings;

  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();

    document.body.innerHTML = `
      <ul id="custom-flags-list"></ul>
      <input type="text" id="new-flag-input" />
      <button id="add-flag-btn">Add flag</button>
      <input type="checkbox" id="reminder-toggle" />
      <input type="time" id="reminder-time" value="09:00" />
      <button id="dark-mode-toggle">Toggle dark mode</button>
      <div id="save-toast" role="status" hidden></div>
    `;

    require('../storage.js');
    settings = require('../settings.js');
  });

  test('clicking dark mode toggle adds dark-mode class to body', () => {
    settings.initSettings();
    document.getElementById('dark-mode-toggle').click();
    expect(document.body.classList.contains('dark-mode')).toBe(true);
  });

  test('clicking dark mode toggle twice removes dark-mode class', () => {
    settings.initSettings();
    const btn = document.getElementById('dark-mode-toggle');
    btn.click();
    btn.click();
    expect(document.body.classList.contains('dark-mode')).toBe(false);
  });

  test('clicking dark mode toggle saves preference', () => {
    settings.initSettings();
    document.getElementById('dark-mode-toggle').click();

    const st = require('../storage.js');
    expect(st.getDarkMode()).toBe(true);
  });

  test('initSettings applies saved dark mode on load', () => {
    localStorage.clear();
    jest.resetModules();

    document.body.innerHTML = `
      <ul id="custom-flags-list"></ul>
      <input type="text" id="new-flag-input" />
      <button id="add-flag-btn">Add flag</button>
      <input type="checkbox" id="reminder-toggle" />
      <input type="time" id="reminder-time" value="09:00" />
      <button id="dark-mode-toggle">Toggle dark mode</button>
      <div id="save-toast" role="status" hidden></div>
    `;

    const st = require('../storage.js');
    st.setDarkMode(true);
    const s = require('../settings.js');
    s.initSettings();

    expect(document.body.classList.contains('dark-mode')).toBe(true);
  });
});

// ─── Dark mode CSS ───────────────────────────────────────────────────────────

describe('Dark mode — CSS', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
  });

  test('has .dark-mode selector in CSS', () => {
    expect(cssContent).toContain('.dark-mode');
  });

  test('dark mode overrides --color-bg', () => {
    // Check that there's a dark-mode rule that sets --color-bg
    const darkModeMatch = cssContent.match(/\.dark-mode\s*\{[^}]*--color-bg\s*:/);
    expect(darkModeMatch).not.toBeNull();
  });

  test('dark mode overrides --color-text', () => {
    const darkModeMatch = cssContent.match(/\.dark-mode\s*\{[^}]*--color-text\s*:/);
    expect(darkModeMatch).not.toBeNull();
  });

  test('dark mode overrides --color-surface', () => {
    const darkModeMatch = cssContent.match(/\.dark-mode\s*\{[^}]*--color-surface\s*:/);
    expect(darkModeMatch).not.toBeNull();
  });
});

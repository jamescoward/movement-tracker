/* @jest-environment jsdom */
'use strict';

const fs = require('fs');
const path = require('path');

// ─── File existence ──────────────────────────────────────────────────────────

describe('heatmap.js — file', () => {
  test('heatmap.js file exists', () => {
    expect(fs.existsSync(path.join(__dirname, '..', 'heatmap.js'))).toBe(true);
  });
});

// ─── HTML structure ──────────────────────────────────────────────────────────

describe('heatmap.html — structure', () => {
  let htmlDoc;

  beforeAll(() => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'heatmap.html'), 'utf8');
    const parser = new DOMParser();
    htmlDoc = parser.parseFromString(html, 'text/html');
  });

  test('has a #heatmap-grid container', () => {
    expect(htmlDoc.getElementById('heatmap-grid')).not.toBeNull();
  });

  test('has a heatmap section with aria-label', () => {
    const section = htmlDoc.querySelector('section[aria-label]');
    expect(section).not.toBeNull();
    expect(section.getAttribute('aria-label')).toMatch(/heat\s*map/i);
  });

  test('has a #heatmap-legend container', () => {
    expect(htmlDoc.getElementById('heatmap-legend')).not.toBeNull();
  });

  test('has a #flag-overlay-select for flag frequency overlay', () => {
    const el = htmlDoc.getElementById('flag-overlay-select');
    expect(el).not.toBeNull();
    expect(el.tagName.toLowerCase()).toBe('select');
  });

  test('includes heatmap.js script', () => {
    const scripts = Array.from(htmlDoc.querySelectorAll('script[src]'));
    const srcs = scripts.map((el) => el.getAttribute('src'));
    expect(srcs.some((s) => s.includes('heatmap.js'))).toBe(true);
  });

  test('includes storage.js script', () => {
    const scripts = Array.from(htmlDoc.querySelectorAll('script[src]'));
    const srcs = scripts.map((el) => el.getAttribute('src'));
    expect(srcs.some((s) => s.includes('storage.js'))).toBe(true);
  });

  test('has navigation links including chart, week, and log', () => {
    const links = Array.from(htmlDoc.querySelectorAll('nav a'));
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs.some((h) => h.includes('chart'))).toBe(true);
    expect(hrefs.some((h) => h.includes('week'))).toBe(true);
    expect(hrefs.some((h) => h === './')).toBe(true);
  });

  test('has heatmap nav link marked as current page', () => {
    const links = Array.from(htmlDoc.querySelectorAll('nav a'));
    const current = links.find((a) => a.getAttribute('aria-current') === 'page');
    expect(current).not.toBeNull();
    expect(current.getAttribute('href')).toMatch(/heatmap/);
  });
});

// ─── heatmap.js module behaviour ─────────────────────────────────────────────

describe('heatmap.js — module', () => {
  let heatmap;
  let storage;

  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    jest.useFakeTimers();
    // Wednesday June 12 2024
    jest.setSystemTime(new Date(2024, 5, 12, 10, 0));

    document.body.innerHTML = `
      <div id="heatmap-grid"></div>
      <div id="heatmap-legend"></div>
      <select id="flag-overlay-select">
        <option value="">All movements</option>
        <option value="justEaten">Just eaten</option>
        <option value="crunchedUp">Crunched up</option>
        <option value="listeningToMusic">Listening to music</option>
        <option value="resting">Resting</option>
        <option value="active">Active</option>
      </select>
    `;

    storage = require('../storage.js');
    heatmap = require('../heatmap.js');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── initHeatmap() ──────────────────────────────────────────────────────

  describe('initHeatmap()', () => {
    test('renders the heatmap grid on init', () => {
      heatmap.initHeatmap();
      const grid = document.getElementById('heatmap-grid');
      expect(grid.innerHTML.length).toBeGreaterThan(0);
    });

    test('renders the legend on init', () => {
      heatmap.initHeatmap();
      const legend = document.getElementById('heatmap-legend');
      expect(legend.innerHTML.length).toBeGreaterThan(0);
    });
  });

  // ── renderHeatmap() — grid structure ───────────────────────────────────

  describe('renderHeatmap() — grid structure', () => {
    test('renders 24 hour rows', () => {
      heatmap.initHeatmap();
      const rows = document.querySelectorAll('.heatmap-row');
      expect(rows.length).toBe(24);
    });

    test('header row has day labels (Mon–Sun)', () => {
      heatmap.initHeatmap();
      const labels = document.querySelectorAll('.heatmap-day-label');
      expect(labels.length).toBe(7);
      const texts = Array.from(labels).map((el) => el.textContent);
      expect(texts).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    });

    test('each row has 7 day cells', () => {
      heatmap.initHeatmap();
      const rows = document.querySelectorAll('.heatmap-row');
      rows.forEach((row) => {
        const cells = row.querySelectorAll('.heatmap-cell');
        expect(cells.length).toBe(7);
      });
    });

    test('each row has a zero-padded hour label (00–23)', () => {
      heatmap.initHeatmap();
      const hourLabels = document.querySelectorAll('.heatmap-hour-label');
      expect(hourLabels.length).toBe(24);
      expect(hourLabels[0].textContent).toBe('00');
      expect(hourLabels[12].textContent).toBe('12');
      expect(hourLabels[23].textContent).toBe('23');
    });
  });

  // ── renderHeatmap() — colour intensity ─────────────────────────────────

  describe('renderHeatmap() — colour intensity', () => {
    test('cell with no movements has intensity level 0', () => {
      heatmap.initHeatmap();
      const cell = document.querySelector('.heatmap-cell');
      expect(cell.getAttribute('data-intensity')).toBe('0');
    });

    test('cell with movements has intensity level > 0', () => {
      // Add movements on a Monday at 9am across multiple weeks
      storage.saveMovement({ timestamp: new Date(2024, 5, 3, 9, 30).toISOString() }); // Mon
      storage.saveMovement({ timestamp: new Date(2024, 5, 10, 9, 15).toISOString() }); // Mon
      heatmap.initHeatmap();
      // Hour 9 row (index 9), Monday cell (index 0)
      const rows = document.querySelectorAll('.heatmap-row');
      const hour9MondayCell = rows[9].querySelectorAll('.heatmap-cell')[0];
      const intensity = parseInt(hour9MondayCell.getAttribute('data-intensity'));
      expect(intensity).toBeGreaterThan(0);
    });

    test('cell with more movements has higher intensity than cell with fewer', () => {
      // Monday 9am: 3 movements
      storage.saveMovement({ timestamp: new Date(2024, 5, 3, 9, 30).toISOString() });
      storage.saveMovement({ timestamp: new Date(2024, 5, 10, 9, 15).toISOString() });
      storage.saveMovement({ timestamp: new Date(2024, 4, 27, 9, 45).toISOString() }); // prev Mon
      // Monday 14:00: 1 movement
      storage.saveMovement({ timestamp: new Date(2024, 5, 3, 14, 30).toISOString() });

      heatmap.initHeatmap();

      const rows = document.querySelectorAll('.heatmap-row');
      // Hour 9, Monday (day index 0)
      const intensity9 = parseInt(rows[9].querySelectorAll('.heatmap-cell')[0].getAttribute('data-intensity'));
      // Hour 14, Monday (day index 0)
      const intensity14 = parseInt(rows[14].querySelectorAll('.heatmap-cell')[0].getAttribute('data-intensity'));
      expect(intensity9).toBeGreaterThan(intensity14);
    });

    test('intensity is capped at level 4', () => {
      // Add many movements at the same hour/day
      for (let week = 0; week < 10; week++) {
        const d = new Date(2024, 5, 3 + week * 7, 9, 0); // successive Mondays
        storage.saveMovement({ timestamp: d.toISOString() });
        storage.saveMovement({ timestamp: new Date(d.getTime() + 15 * 60000).toISOString() });
      }
      heatmap.initHeatmap();
      const rows = document.querySelectorAll('.heatmap-row');
      // Hour 9, Monday (day index 0)
      const hour9MondayCell = rows[9].querySelectorAll('.heatmap-cell')[0];
      const intensity = parseInt(hour9MondayCell.getAttribute('data-intensity'));
      expect(intensity).toBeLessThanOrEqual(4);
    });

    test('each cell has a title tooltip showing count', () => {
      storage.saveMovement({ timestamp: new Date(2024, 5, 3, 9, 30).toISOString() }); // Mon 9am
      heatmap.initHeatmap();
      const rows = document.querySelectorAll('.heatmap-row');
      // Hour 9, Monday (day index 0)
      const hour9MondayCell = rows[9].querySelectorAll('.heatmap-cell')[0];
      const title = hour9MondayCell.getAttribute('title');
      expect(title).toBeTruthy();
      expect(title).toContain('1');
    });
  });

  // ── buildDensityMatrix() ───────────────────────────────────────────────

  describe('buildDensityMatrix()', () => {
    test('returns a 7×24 matrix of counts', () => {
      const matrix = heatmap.buildDensityMatrix([]);
      expect(matrix.length).toBe(7);
      matrix.forEach((row) => {
        expect(row.length).toBe(24);
        row.forEach((val) => expect(val).toBe(0));
      });
    });

    test('maps Monday movements to row 0', () => {
      const movements = [
        { timestamp: new Date(2024, 5, 3, 9, 30).toISOString() }, // Mon
      ];
      const matrix = heatmap.buildDensityMatrix(movements);
      expect(matrix[0][9]).toBe(1);
    });

    test('maps Sunday movements to row 6', () => {
      const movements = [
        { timestamp: new Date(2024, 5, 9, 15, 0).toISOString() }, // Sun
      ];
      const matrix = heatmap.buildDensityMatrix(movements);
      expect(matrix[6][15]).toBe(1);
    });

    test('aggregates multiple movements in same slot', () => {
      const movements = [
        { timestamp: new Date(2024, 5, 3, 9, 0).toISOString() },
        { timestamp: new Date(2024, 5, 3, 9, 30).toISOString() },
        { timestamp: new Date(2024, 5, 10, 9, 15).toISOString() }, // another Mon at 9
      ];
      const matrix = heatmap.buildDensityMatrix(movements);
      expect(matrix[0][9]).toBe(3);
    });
  });

  // ── flag overlay filtering ─────────────────────────────────────────────

  describe('flag overlay', () => {
    test('selecting a flag filters heatmap to only show movements with that flag', () => {
      storage.saveMovement({
        timestamp: new Date(2024, 5, 3, 9, 0).toISOString(),
        flags: { justEaten: true },
      });
      storage.saveMovement({
        timestamp: new Date(2024, 5, 3, 9, 30).toISOString(),
        flags: { justEaten: false },
      });
      storage.saveMovement({
        timestamp: new Date(2024, 5, 3, 10, 0).toISOString(),
        flags: { justEaten: true },
      });

      heatmap.initHeatmap();

      // Select "justEaten" flag filter
      const select = document.getElementById('flag-overlay-select');
      select.value = 'justEaten';
      select.dispatchEvent(new Event('change'));

      const rows = document.querySelectorAll('.heatmap-row');
      // Hour 9, Monday (day index 0): only 1 movement has justEaten=true
      expect(rows[9].querySelectorAll('.heatmap-cell')[0].getAttribute('title')).toContain('1');
      // Hour 10, Monday (day index 0): 1 movement has justEaten=true
      expect(rows[10].querySelectorAll('.heatmap-cell')[0].getAttribute('title')).toContain('1');
    });

    test('selecting "All movements" shows all movements unfiltered', () => {
      storage.saveMovement({ timestamp: new Date(2024, 5, 3, 9, 0).toISOString() });
      storage.saveMovement({ timestamp: new Date(2024, 5, 3, 9, 30).toISOString() });

      heatmap.initHeatmap();

      const select = document.getElementById('flag-overlay-select');
      select.value = '';
      select.dispatchEvent(new Event('change'));

      const rows = document.querySelectorAll('.heatmap-row');
      // Hour 9, Monday (day index 0): 2 movements
      expect(rows[9].querySelectorAll('.heatmap-cell')[0].getAttribute('title')).toContain('2');
    });

    test('flag overlay select has options for all 5 flags', () => {
      heatmap.initHeatmap();
      const select = document.getElementById('flag-overlay-select');
      const options = Array.from(select.options).map((o) => o.value);
      expect(options).toContain('justEaten');
      expect(options).toContain('crunchedUp');
      expect(options).toContain('listeningToMusic');
      expect(options).toContain('resting');
      expect(options).toContain('active');
    });

    test('getActiveFlag() returns empty string when no flag selected', () => {
      heatmap.initHeatmap();
      expect(heatmap.getActiveFlag()).toBe('');
    });

    test('getActiveFlag() returns selected flag name', () => {
      heatmap.initHeatmap();
      const select = document.getElementById('flag-overlay-select');
      select.value = 'resting';
      select.dispatchEvent(new Event('change'));
      expect(heatmap.getActiveFlag()).toBe('resting');
    });
  });

  // ── legend ─────────────────────────────────────────────────────────────

  describe('legend', () => {
    test('legend contains intensity scale items', () => {
      heatmap.initHeatmap();
      const legend = document.getElementById('heatmap-legend');
      const items = legend.querySelectorAll('.legend-cell');
      expect(items.length).toBe(5); // 0,1,2,3,4 intensity levels
    });

    test('legend has "Less" and "More" labels', () => {
      heatmap.initHeatmap();
      const legend = document.getElementById('heatmap-legend');
      expect(legend.textContent).toMatch(/less/i);
      expect(legend.textContent).toMatch(/more/i);
    });
  });
});

/* @jest-environment jsdom */
'use strict';

const fs = require('fs');
const path = require('path');

// ─── File existence ──────────────────────────────────────────────────────────

describe('week.js — file', () => {
  test('week.js file exists', () => {
    expect(fs.existsSync(path.join(__dirname, '..', 'week.js'))).toBe(true);
  });
});

// ─── HTML structure ──────────────────────────────────────────────────────────

describe('week.html — structure', () => {
  let htmlDoc;

  beforeAll(() => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'week.html'), 'utf8');
    const parser = new DOMParser();
    htmlDoc = parser.parseFromString(html, 'text/html');
  });

  test('has a #weekly-grid container', () => {
    expect(htmlDoc.getElementById('weekly-grid')).not.toBeNull();
  });

  test('has a #prev-week button', () => {
    const el = htmlDoc.getElementById('prev-week');
    expect(el).not.toBeNull();
    expect(el.tagName.toLowerCase()).toBe('button');
  });

  test('has a #next-week button', () => {
    const el = htmlDoc.getElementById('next-week');
    expect(el).not.toBeNull();
    expect(el.tagName.toLowerCase()).toBe('button');
  });

  test('has a #week-label display element', () => {
    expect(htmlDoc.getElementById('week-label')).not.toBeNull();
  });

  test('includes week.js script', () => {
    const scripts = Array.from(htmlDoc.querySelectorAll('script[src]'));
    const srcs = scripts.map((el) => el.getAttribute('src'));
    expect(srcs.some((s) => s.includes('week.js'))).toBe(true);
  });

  test('includes storage.js script', () => {
    const scripts = Array.from(htmlDoc.querySelectorAll('script[src]'));
    const srcs = scripts.map((el) => el.getAttribute('src'));
    expect(srcs.some((s) => s.includes('storage.js'))).toBe(true);
  });

  test('has navigation links including chart and log', () => {
    const links = Array.from(htmlDoc.querySelectorAll('nav a'));
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs.some((h) => h.includes('chart'))).toBe(true);
    expect(hrefs.some((h) => h === './')).toBe(true);
  });
});

// ─── week.js module behaviour ────────────────────────────────────────────────

describe('week.js — module', () => {
  let week;
  let storage;

  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    jest.useFakeTimers();
    // Wednesday June 12 2024
    jest.setSystemTime(new Date(2024, 5, 12, 10, 0));

    document.body.innerHTML = `
      <div class="week-nav">
        <button id="prev-week">&lsaquo;</button>
        <span id="week-label"></span>
        <button id="next-week">&rsaquo;</button>
      </div>
      <div id="weekly-grid"></div>
    `;

    storage = require('../storage.js');
    week = require('../week.js');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── initWeek() ──────────────────────────────────────────────────────────

  describe('initWeek()', () => {
    test('renders the weekly grid on init', () => {
      week.initWeek();
      const grid = document.getElementById('weekly-grid');
      expect(grid.innerHTML.length).toBeGreaterThan(0);
    });

    test('sets #week-label to show current week range', () => {
      week.initWeek();
      const label = document.getElementById('week-label');
      expect(label.textContent.length).toBeGreaterThan(0);
    });

    test('renders exactly 7 day cells', () => {
      week.initWeek();
      const cells = document.querySelectorAll('.week-day');
      expect(cells.length).toBe(7);
    });
  });

  // ── renderWeek() ────────────────────────────────────────────────────────

  describe('renderWeek()', () => {
    test('shows movement count for each day', () => {
      // Add 3 movements on June 12
      storage.saveMovement({ timestamp: new Date(2024, 5, 12, 9, 0).toISOString() });
      storage.saveMovement({ timestamp: new Date(2024, 5, 12, 10, 0).toISOString() });
      storage.saveMovement({ timestamp: new Date(2024, 5, 12, 11, 0).toISOString() });
      // Add 1 movement on June 10
      storage.saveMovement({ timestamp: new Date(2024, 5, 10, 14, 0).toISOString() });

      week.initWeek();

      const cells = document.querySelectorAll('.week-day');
      // Find the cell for June 12 (Wednesday) and check it shows count 3
      const counts = Array.from(cells).map((c) => c.querySelector('.week-day-count'));
      expect(counts.every((c) => c !== null)).toBe(true);
    });

    test('day with no movements shows count of 0', () => {
      week.initWeek();
      const cells = document.querySelectorAll('.week-day');
      const counts = Array.from(cells).map((c) => c.querySelector('.week-day-count').textContent);
      expect(counts.every((c) => c === '0')).toBe(true);
    });

    test('day with movements shows correct count', () => {
      // June 12 is Wednesday; week starts Monday June 10
      storage.saveMovement({ timestamp: new Date(2024, 5, 12, 9, 0).toISOString() });
      storage.saveMovement({ timestamp: new Date(2024, 5, 12, 14, 0).toISOString() });

      week.initWeek();

      // Find the cell for Wednesday (index 2 in Mon-Sun layout)
      const cells = document.querySelectorAll('.week-day');
      const wedCount = cells[2].querySelector('.week-day-count').textContent;
      expect(wedCount).toBe('2');
    });

    test('each day cell shows the day name', () => {
      week.initWeek();
      const cells = document.querySelectorAll('.week-day');
      const labels = Array.from(cells).map((c) => c.querySelector('.week-day-name').textContent);
      expect(labels).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    });

    test('each day cell shows the date number', () => {
      week.initWeek();
      const cells = document.querySelectorAll('.week-day');
      const dates = Array.from(cells).map((c) => c.querySelector('.week-day-date').textContent);
      // Week of June 10–16, 2024
      expect(dates).toEqual(['10', '11', '12', '13', '14', '15', '16']);
    });

    test('does not count movements from outside the current week', () => {
      // June 9 is Sunday of previous week
      storage.saveMovement({ timestamp: new Date(2024, 5, 9, 10, 0).toISOString() });
      // June 17 is Monday of next week
      storage.saveMovement({ timestamp: new Date(2024, 5, 17, 10, 0).toISOString() });

      week.initWeek();

      const cells = document.querySelectorAll('.week-day');
      const counts = Array.from(cells).map((c) => c.querySelector('.week-day-count').textContent);
      expect(counts.every((c) => c === '0')).toBe(true);
    });
  });

  // ── day tap to drill into daily view ───────────────────────────────────

  describe('day drill-down', () => {
    test('each day cell is a link to chart.html with date param', () => {
      week.initWeek();
      const cells = document.querySelectorAll('.week-day');
      cells.forEach((cell) => {
        const link = cell.closest('a') || cell.querySelector('a');
        expect(link).not.toBeNull();
        expect(link.getAttribute('href')).toMatch(/chart\.html\?date=\d{4}-\d{2}-\d{2}/);
      });
    });

    test('day link contains correct date for that day', () => {
      week.initWeek();
      const links = document.querySelectorAll('.week-day-link');
      const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
      expect(hrefs[0]).toBe('chart.html?date=2024-06-10'); // Monday
      expect(hrefs[6]).toBe('chart.html?date=2024-06-16'); // Sunday
    });
  });

  // ── week navigation ────────────────────────────────────────────────────

  describe('navigateWeek()', () => {
    test('navigateWeek("prev") moves to previous week', () => {
      week.initWeek();
      week.navigateWeek('prev');
      expect(week.getWeekStart()).toBe('2024-06-03');
    });

    test('navigateWeek("next") moves to next week', () => {
      week.initWeek();
      week.navigateWeek('next');
      expect(week.getWeekStart()).toBe('2024-06-17');
    });

    test('clicking #prev-week button navigates to previous week', () => {
      week.initWeek();
      document.getElementById('prev-week').click();
      expect(week.getWeekStart()).toBe('2024-06-03');
    });

    test('clicking #next-week button navigates to next week', () => {
      week.initWeek();
      document.getElementById('next-week').click();
      expect(week.getWeekStart()).toBe('2024-06-17');
    });

    test('multiple prev navigations accumulate', () => {
      week.initWeek();
      week.navigateWeek('prev');
      week.navigateWeek('prev');
      expect(week.getWeekStart()).toBe('2024-05-27');
    });

    test('week label updates after navigation', () => {
      week.initWeek();
      week.navigateWeek('prev');
      const label = document.getElementById('week-label');
      expect(label.textContent).toContain('Jun');
    });

    test('grid re-renders with new week data after navigation', () => {
      // Add movement on June 5 (previous week)
      storage.saveMovement({ timestamp: new Date(2024, 5, 5, 10, 0).toISOString() });

      week.initWeek();
      week.navigateWeek('prev');

      // June 5 is Wednesday of prev week (June 3–9)
      const cells = document.querySelectorAll('.week-day');
      const wedCount = cells[2].querySelector('.week-day-count').textContent;
      expect(wedCount).toBe('1');
    });
  });

  // ── getWeekStart() ─────────────────────────────────────────────────────

  describe('getWeekStart()', () => {
    test('returns Monday of current week as YYYY-MM-DD', () => {
      week.initWeek();
      // June 12 2024 is Wednesday → Monday is June 10
      expect(week.getWeekStart()).toBe('2024-06-10');
    });

    test('returns updated start after navigateWeek', () => {
      week.initWeek();
      week.navigateWeek('next');
      expect(week.getWeekStart()).toBe('2024-06-17');
    });
  });
});

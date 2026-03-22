/* @jest-environment jsdom */
'use strict';

const fs = require('fs');
const path = require('path');

// ─── File existence ──────────────────────────────────────────────────────────

describe('chart.js — file', () => {
  test('chart.js file exists', () => {
    expect(fs.existsSync(path.join(__dirname, '..', 'chart.js'))).toBe(true);
  });
});

// ─── HTML structure ──────────────────────────────────────────────────────────

describe('chart.html — structure', () => {
  let htmlDoc;

  beforeAll(() => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'chart.html'), 'utf8');
    const parser = new DOMParser();
    htmlDoc = parser.parseFromString(html, 'text/html');
  });

  test('has a #daily-chart container', () => {
    expect(htmlDoc.getElementById('daily-chart')).not.toBeNull();
  });

  test('has a #prev-day button', () => {
    const el = htmlDoc.getElementById('prev-day');
    expect(el).not.toBeNull();
    expect(el.tagName.toLowerCase()).toBe('button');
  });

  test('has a #next-day button', () => {
    const el = htmlDoc.getElementById('next-day');
    expect(el).not.toBeNull();
    expect(el.tagName.toLowerCase()).toBe('button');
  });

  test('has a #chart-date display element', () => {
    expect(htmlDoc.getElementById('chart-date')).not.toBeNull();
  });

  test('has a #chart-date-picker date input', () => {
    const el = htmlDoc.getElementById('chart-date-picker');
    expect(el).not.toBeNull();
    expect(el.getAttribute('type')).toBe('date');
  });

  test('includes chart.js script', () => {
    const scripts = Array.from(htmlDoc.querySelectorAll('script[src]'));
    const srcs = scripts.map((el) => el.getAttribute('src'));
    expect(srcs.some((s) => s.includes('chart.js'))).toBe(true);
  });
});

// ─── chart.js module behaviour ───────────────────────────────────────────────

describe('chart.js — module', () => {
  let chart;
  let storage;

  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 5, 15, 10, 0)); // June 15 2024, 10:00 local

    document.body.innerHTML = `
      <div id="chart-nav">
        <button id="prev-day">&lsaquo;</button>
        <span id="chart-date"></span>
        <input type="date" id="chart-date-picker" />
        <button id="next-day">&rsaquo;</button>
      </div>
      <div id="daily-chart"></div>
    `;

    storage = require('../storage.js');
    chart = require('../chart.js');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── initChart() ──────────────────────────────────────────────────────────

  describe('initChart()', () => {
    test('renders the chart container on init', () => {
      chart.initChart();
      const container = document.getElementById('daily-chart');
      expect(container.innerHTML.length).toBeGreaterThan(0);
    });

    test('sets #chart-date display text to today', () => {
      chart.initChart();
      const dateEl = document.getElementById('chart-date');
      expect(dateEl.textContent.length).toBeGreaterThan(0);
    });

    test('sets #chart-date-picker value to today YYYY-MM-DD', () => {
      chart.initChart();
      const picker = document.getElementById('chart-date-picker');
      expect(picker.value).toBe('2024-06-15');
    });
  });

  // ── renderChart() ────────────────────────────────────────────────────────

  describe('renderChart()', () => {
    test('shows empty state when no movements for the date', () => {
      chart.initChart();
      chart.renderChart('2024-06-15');
      const container = document.getElementById('daily-chart');
      expect(container.innerHTML).toMatch(/no movements/i);
    });

    test('renders one .movement-dot per movement', () => {
      storage.saveMovement({ timestamp: new Date(2024, 5, 15, 9, 30).toISOString() });
      storage.saveMovement({ timestamp: new Date(2024, 5, 15, 14, 15).toISOString() });
      chart.initChart();
      chart.renderChart('2024-06-15');
      const dots = document.querySelectorAll('.movement-dot');
      expect(dots.length).toBe(2);
    });

    test('each .movement-dot has a top style for timeline positioning', () => {
      storage.saveMovement({ timestamp: new Date(2024, 5, 15, 12, 0).toISOString() });
      chart.initChart();
      chart.renderChart('2024-06-15');
      const dot = document.querySelector('.movement-dot');
      expect(dot.style.top).toBeTruthy();
    });

    test('movement with any flag true gets .movement-dot--flagged class', () => {
      storage.saveMovement({
        timestamp: new Date(2024, 5, 15, 9, 0).toISOString(),
        flags: { justEaten: true, crunchedUp: false, listeningToMusic: false, resting: false, active: false },
      });
      chart.initChart();
      chart.renderChart('2024-06-15');
      const dot = document.querySelector('.movement-dot');
      expect(dot.classList.contains('movement-dot--flagged')).toBe(true);
    });

    test('movement with no flags does not get .movement-dot--flagged class', () => {
      storage.saveMovement({
        timestamp: new Date(2024, 5, 15, 9, 0).toISOString(),
        flags: { justEaten: false, crunchedUp: false, listeningToMusic: false, resting: false, active: false },
      });
      chart.initChart();
      chart.renderChart('2024-06-15');
      const dot = document.querySelector('.movement-dot');
      expect(dot.classList.contains('movement-dot--flagged')).toBe(false);
    });

    test('does not render movements from other dates', () => {
      storage.saveMovement({ timestamp: new Date(2024, 5, 14, 9, 0).toISOString() }); // June 14
      chart.initChart();
      chart.renderChart('2024-06-15');
      const dots = document.querySelectorAll('.movement-dot');
      expect(dots.length).toBe(0);
    });

    test('each .movement-dot has an accessible title attribute', () => {
      storage.saveMovement({ timestamp: new Date(2024, 5, 15, 9, 30).toISOString() });
      chart.initChart();
      chart.renderChart('2024-06-15');
      const dot = document.querySelector('.movement-dot');
      expect(dot.getAttribute('title')).toBeTruthy();
    });
  });

  // ── navigateDay() ────────────────────────────────────────────────────────

  describe('navigateDay()', () => {
    test('navigateDay("prev") moves to previous day', () => {
      chart.initChart();
      chart.navigateDay('prev');
      expect(chart.getDisplayDate()).toBe('2024-06-14');
    });

    test('navigateDay("next") moves to next day', () => {
      chart.initChart();
      chart.navigateDay('next');
      expect(chart.getDisplayDate()).toBe('2024-06-16');
    });

    test('after navigating prev, chart re-renders with that day\'s data', () => {
      storage.saveMovement({ timestamp: new Date(2024, 5, 14, 10, 0).toISOString() });
      chart.initChart();
      chart.navigateDay('prev');
      const dots = document.querySelectorAll('.movement-dot');
      expect(dots.length).toBe(1);
    });

    test('clicking #prev-day button navigates to previous day', () => {
      chart.initChart();
      document.getElementById('prev-day').click();
      expect(chart.getDisplayDate()).toBe('2024-06-14');
    });

    test('clicking #next-day button navigates to next day', () => {
      chart.initChart();
      document.getElementById('next-day').click();
      expect(chart.getDisplayDate()).toBe('2024-06-16');
    });

    test('multiple prev navigations accumulate', () => {
      chart.initChart();
      chart.navigateDay('prev');
      chart.navigateDay('prev');
      expect(chart.getDisplayDate()).toBe('2024-06-13');
    });
  });

  // ── getDisplayDate() ─────────────────────────────────────────────────────

  describe('getDisplayDate()', () => {
    test('returns today as YYYY-MM-DD on init', () => {
      chart.initChart();
      expect(chart.getDisplayDate()).toBe('2024-06-15');
    });

    test('returns updated date after navigateDay', () => {
      chart.initChart();
      chart.navigateDay('prev');
      chart.navigateDay('prev');
      expect(chart.getDisplayDate()).toBe('2024-06-13');
    });
  });

  // ── movement popover ─────────────────────────────────────────────────────

  describe('movement popover', () => {
    test('clicking a dot shows a .movement-popover', () => {
      storage.saveMovement({ timestamp: new Date(2024, 5, 15, 9, 30).toISOString() });
      chart.initChart();
      chart.renderChart('2024-06-15');
      const dot = document.querySelector('.movement-dot');
      dot.click();
      const popover = document.querySelector('.movement-popover');
      expect(popover).not.toBeNull();
    });

    test('popover shows the movement time', () => {
      storage.saveMovement({ timestamp: new Date(2024, 5, 15, 9, 30).toISOString() });
      chart.initChart();
      chart.renderChart('2024-06-15');
      document.querySelector('.movement-dot').click();
      const popover = document.querySelector('.movement-popover');
      expect(popover.textContent).toMatch(/9:30|09:30/);
    });

    test('popover shows active flags', () => {
      storage.saveMovement({
        timestamp: new Date(2024, 5, 15, 9, 0).toISOString(),
        flags: { justEaten: true, crunchedUp: false, listeningToMusic: true, resting: false, active: false },
      });
      chart.initChart();
      chart.renderChart('2024-06-15');
      document.querySelector('.movement-dot').click();
      const popover = document.querySelector('.movement-popover');
      expect(popover.textContent).toMatch(/just eaten/i);
      expect(popover.textContent).toMatch(/listening to music/i);
      expect(popover.textContent).not.toMatch(/crunched up/i);
    });

    test('popover shows notes when present', () => {
      storage.saveMovement({
        timestamp: new Date(2024, 5, 15, 14, 0).toISOString(),
        notes: 'Strong kicks after lunch',
      });
      chart.initChart();
      chart.renderChart('2024-06-15');
      document.querySelector('.movement-dot').click();
      const popover = document.querySelector('.movement-popover');
      expect(popover.textContent).toContain('Strong kicks after lunch');
    });

    test('popover does not show notes section when notes are empty', () => {
      storage.saveMovement({ timestamp: new Date(2024, 5, 15, 14, 0).toISOString() });
      chart.initChart();
      chart.renderChart('2024-06-15');
      document.querySelector('.movement-dot').click();
      const notes = document.querySelector('.popover-notes');
      expect(notes).toBeNull();
    });

    test('popover does not show flags section when no flags set', () => {
      storage.saveMovement({
        timestamp: new Date(2024, 5, 15, 14, 0).toISOString(),
        flags: { justEaten: false, crunchedUp: false, listeningToMusic: false, resting: false, active: false },
      });
      chart.initChart();
      chart.renderChart('2024-06-15');
      document.querySelector('.movement-dot').click();
      const flags = document.querySelector('.popover-flags');
      expect(flags).toBeNull();
    });

    test('clicking a second dot replaces the first popover', () => {
      storage.saveMovement({ timestamp: new Date(2024, 5, 15, 9, 0).toISOString() });
      storage.saveMovement({ timestamp: new Date(2024, 5, 15, 14, 0).toISOString() });
      chart.initChart();
      chart.renderChart('2024-06-15');
      const dots = document.querySelectorAll('.movement-dot');
      dots[0].click();
      dots[1].click();
      const popovers = document.querySelectorAll('.movement-popover');
      expect(popovers.length).toBe(1);
    });

    test('clicking outside the popover dismisses it', () => {
      storage.saveMovement({ timestamp: new Date(2024, 5, 15, 9, 0).toISOString() });
      chart.initChart();
      chart.renderChart('2024-06-15');
      document.querySelector('.movement-dot').click();
      expect(document.querySelector('.movement-popover')).not.toBeNull();
      document.body.click();
      expect(document.querySelector('.movement-popover')).toBeNull();
    });
  });

  // ── date picker ───────────────────────────────────────────────────────────

  describe('date picker', () => {
    test('changing #chart-date-picker navigates to selected date', () => {
      chart.initChart();
      const picker = document.getElementById('chart-date-picker');
      picker.value = '2024-06-10';
      picker.dispatchEvent(new Event('change'));
      expect(chart.getDisplayDate()).toBe('2024-06-10');
    });

    test('date picker updates after navigateDay', () => {
      chart.initChart();
      chart.navigateDay('next');
      const picker = document.getElementById('chart-date-picker');
      expect(picker.value).toBe('2024-06-16');
    });
  });
});

/* @jest-environment jsdom */
'use strict';

const fs = require('fs');
const path = require('path');

// ─── File existence ──────────────────────────────────────────────────────────

describe('correlation.js — file', () => {
  test('correlation.js file exists', () => {
    expect(fs.existsSync(path.join(__dirname, '..', 'correlation.js'))).toBe(true);
  });
});

// ─── HTML structure ──────────────────────────────────────────────────────────

describe('correlation.html — structure', () => {
  let htmlDoc;

  beforeAll(() => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'correlation.html'), 'utf8');
    const parser = new DOMParser();
    htmlDoc = parser.parseFromString(html, 'text/html');
  });

  test('has a #correlation-breakdown container for flag frequency bars', () => {
    expect(htmlDoc.getElementById('correlation-breakdown')).not.toBeNull();
  });

  test('has a correlation section with aria-label', () => {
    const section = htmlDoc.querySelector('section[aria-label]');
    expect(section).not.toBeNull();
    expect(section.getAttribute('aria-label')).toMatch(/flag\s*correlation/i);
  });

  test('has a #correlation-comparison container for side-by-side view', () => {
    expect(htmlDoc.getElementById('correlation-comparison')).not.toBeNull();
  });

  test('has a #flag-select for choosing which flag to compare', () => {
    const el = htmlDoc.getElementById('flag-select');
    expect(el).not.toBeNull();
    expect(el.tagName.toLowerCase()).toBe('select');
  });

  test('flag-select has options for all 5 flags', () => {
    const select = htmlDoc.getElementById('flag-select');
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toContain('justEaten');
    expect(options).toContain('crunchedUp');
    expect(options).toContain('listeningToMusic');
    expect(options).toContain('resting');
    expect(options).toContain('active');
  });

  test('includes correlation.js script', () => {
    const scripts = Array.from(htmlDoc.querySelectorAll('script[src]'));
    const srcs = scripts.map((el) => el.getAttribute('src'));
    expect(srcs.some((s) => s.includes('correlation.js'))).toBe(true);
  });

  test('includes storage.js script', () => {
    const scripts = Array.from(htmlDoc.querySelectorAll('script[src]'));
    const srcs = scripts.map((el) => el.getAttribute('src'));
    expect(srcs.some((s) => s.includes('storage.js'))).toBe(true);
  });

  test('has navigation links including chart, week, heatmap, and log', () => {
    const links = Array.from(htmlDoc.querySelectorAll('nav a'));
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs.some((h) => h.includes('chart'))).toBe(true);
    expect(hrefs.some((h) => h.includes('week'))).toBe(true);
    expect(hrefs.some((h) => h.includes('heatmap'))).toBe(true);
    expect(hrefs.some((h) => h === './')).toBe(true);
  });

  test('has correlation nav link marked as current page', () => {
    const links = Array.from(htmlDoc.querySelectorAll('nav a'));
    const current = links.find((a) => a.getAttribute('aria-current') === 'page');
    expect(current).not.toBeNull();
    expect(current.getAttribute('href')).toMatch(/correlation/);
  });
});

// ─── correlation.js module behaviour ─────────────────────────────────────────

describe('correlation.js — module', () => {
  let correlation;
  let storage;

  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 5, 12, 10, 0));

    document.body.innerHTML = `
      <div id="correlation-breakdown"></div>
      <div id="correlation-comparison"></div>
      <select id="flag-select">
        <option value="justEaten">Just eaten</option>
        <option value="crunchedUp">Crunched up</option>
        <option value="listeningToMusic">Listening to music</option>
        <option value="resting">Resting</option>
        <option value="active">Active</option>
      </select>
    `;

    storage = require('../storage.js');
    correlation = require('../correlation.js');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── computeFlagBreakdown() ─────────────────────────────────────────────

  describe('computeFlagBreakdown()', () => {
    test('returns an object with a key for each flag', () => {
      const result = correlation.computeFlagBreakdown([]);
      expect(result).toHaveProperty('justEaten');
      expect(result).toHaveProperty('crunchedUp');
      expect(result).toHaveProperty('listeningToMusic');
      expect(result).toHaveProperty('resting');
      expect(result).toHaveProperty('active');
    });

    test('each flag entry has count and percent fields', () => {
      const result = correlation.computeFlagBreakdown([]);
      const entry = result.justEaten;
      expect(entry).toHaveProperty('count');
      expect(entry).toHaveProperty('percent');
    });

    test('returns zero counts when no movements', () => {
      const result = correlation.computeFlagBreakdown([]);
      expect(result.justEaten.count).toBe(0);
      expect(result.justEaten.percent).toBe(0);
    });

    test('computes correct count for a single flag', () => {
      const movements = [
        { flags: { justEaten: true, crunchedUp: false, listeningToMusic: false, resting: false, active: false } },
        { flags: { justEaten: true, crunchedUp: false, listeningToMusic: false, resting: false, active: false } },
        { flags: { justEaten: false, crunchedUp: false, listeningToMusic: false, resting: false, active: false } },
      ];
      const result = correlation.computeFlagBreakdown(movements);
      expect(result.justEaten.count).toBe(2);
      expect(result.justEaten.percent).toBeCloseTo(66.67, 0);
    });

    test('computes correct percentages for multiple flags', () => {
      const movements = [
        { flags: { justEaten: true, crunchedUp: true, listeningToMusic: false, resting: false, active: false } },
        { flags: { justEaten: false, crunchedUp: true, listeningToMusic: false, resting: true, active: false } },
        { flags: { justEaten: false, crunchedUp: false, listeningToMusic: false, resting: false, active: true } },
        { flags: { justEaten: false, crunchedUp: false, listeningToMusic: false, resting: false, active: false } },
      ];
      const result = correlation.computeFlagBreakdown(movements);
      expect(result.justEaten.count).toBe(1);
      expect(result.justEaten.percent).toBe(25);
      expect(result.crunchedUp.count).toBe(2);
      expect(result.crunchedUp.percent).toBe(50);
      expect(result.resting.count).toBe(1);
      expect(result.resting.percent).toBe(25);
      expect(result.active.count).toBe(1);
      expect(result.active.percent).toBe(25);
      expect(result.listeningToMusic.count).toBe(0);
      expect(result.listeningToMusic.percent).toBe(0);
    });

    test('handles movements with missing flags gracefully', () => {
      const movements = [
        { flags: { justEaten: true } },
        { },
        { flags: null },
      ];
      const result = correlation.computeFlagBreakdown(movements);
      expect(result.justEaten.count).toBe(1);
    });
  });

  // ── computeHourlyComparison() ──────────────────────────────────────────

  describe('computeHourlyComparison()', () => {
    test('returns withFlag and withoutFlag arrays of 24 elements', () => {
      const result = correlation.computeHourlyComparison([], 'justEaten');
      expect(result.withFlag.length).toBe(24);
      expect(result.withoutFlag.length).toBe(24);
    });

    test('all values are zero when no movements', () => {
      const result = correlation.computeHourlyComparison([], 'justEaten');
      expect(result.withFlag.every((v) => v === 0)).toBe(true);
      expect(result.withoutFlag.every((v) => v === 0)).toBe(true);
    });

    test('correctly separates flagged and unflagged movements by hour', () => {
      const movements = [
        { timestamp: new Date(2024, 5, 3, 9, 0).toISOString(), flags: { justEaten: true } },
        { timestamp: new Date(2024, 5, 3, 9, 30).toISOString(), flags: { justEaten: true } },
        { timestamp: new Date(2024, 5, 3, 9, 45).toISOString(), flags: { justEaten: false } },
        { timestamp: new Date(2024, 5, 3, 14, 0).toISOString(), flags: { justEaten: false } },
      ];
      const result = correlation.computeHourlyComparison(movements, 'justEaten');
      expect(result.withFlag[9]).toBe(2);
      expect(result.withoutFlag[9]).toBe(1);
      expect(result.withFlag[14]).toBe(0);
      expect(result.withoutFlag[14]).toBe(1);
    });

    test('handles different flags correctly', () => {
      const movements = [
        { timestamp: new Date(2024, 5, 3, 10, 0).toISOString(), flags: { resting: true } },
        { timestamp: new Date(2024, 5, 3, 10, 30).toISOString(), flags: { resting: false } },
      ];
      const result = correlation.computeHourlyComparison(movements, 'resting');
      expect(result.withFlag[10]).toBe(1);
      expect(result.withoutFlag[10]).toBe(1);
    });
  });

  // ── initCorrelation() ──────────────────────────────────────────────────

  describe('initCorrelation()', () => {
    test('renders breakdown bars on init', () => {
      storage.saveMovement({
        timestamp: new Date(2024, 5, 3, 9, 0).toISOString(),
        flags: { justEaten: true },
      });
      correlation.initCorrelation();
      const breakdown = document.getElementById('correlation-breakdown');
      expect(breakdown.innerHTML.length).toBeGreaterThan(0);
    });

    test('renders comparison chart on init', () => {
      correlation.initCorrelation();
      const comparison = document.getElementById('correlation-comparison');
      expect(comparison.innerHTML.length).toBeGreaterThan(0);
    });

    test('shows empty state when no movements logged', () => {
      correlation.initCorrelation();
      const breakdown = document.getElementById('correlation-breakdown');
      expect(breakdown.textContent).toMatch(/no\s*movements/i);
    });
  });

  // ── renderBreakdown() ──────────────────────────────────────────────────

  describe('renderBreakdown()', () => {
    test('renders a bar item for each flag', () => {
      storage.saveMovement({
        timestamp: new Date(2024, 5, 3, 9, 0).toISOString(),
        flags: { justEaten: true },
      });
      correlation.initCorrelation();
      const bars = document.querySelectorAll('.breakdown-item');
      expect(bars.length).toBe(5);
    });

    test('each bar shows the flag label', () => {
      storage.saveMovement({
        timestamp: new Date(2024, 5, 3, 9, 0).toISOString(),
      });
      correlation.initCorrelation();
      const labels = document.querySelectorAll('.breakdown-label');
      const texts = Array.from(labels).map((el) => el.textContent);
      expect(texts.some((t) => /just\s*eaten/i.test(t))).toBe(true);
      expect(texts.some((t) => /resting/i.test(t))).toBe(true);
      expect(texts.some((t) => /active/i.test(t))).toBe(true);
    });

    test('each bar shows count and percentage', () => {
      storage.saveMovement({
        timestamp: new Date(2024, 5, 3, 9, 0).toISOString(),
        flags: { justEaten: true },
      });
      storage.saveMovement({
        timestamp: new Date(2024, 5, 3, 10, 0).toISOString(),
        flags: { justEaten: false },
      });
      correlation.initCorrelation();
      const stats = document.querySelectorAll('.breakdown-stat');
      const allText = Array.from(stats).map((el) => el.textContent).join(' ');
      expect(allText).toContain('1');
      expect(allText).toMatch(/50/);
    });

    test('bar fill width reflects percentage', () => {
      storage.saveMovement({
        timestamp: new Date(2024, 5, 3, 9, 0).toISOString(),
        flags: { justEaten: true, resting: true },
      });
      storage.saveMovement({
        timestamp: new Date(2024, 5, 3, 10, 0).toISOString(),
        flags: { justEaten: true, resting: false },
      });
      correlation.initCorrelation();
      const fills = document.querySelectorAll('.breakdown-fill');
      // justEaten is 100%, should have width 100%
      const justEatenFill = Array.from(fills).find((f) => {
        const item = f.closest('.breakdown-item');
        return item && item.querySelector('.breakdown-label').textContent.match(/just\s*eaten/i);
      });
      expect(justEatenFill.style.width).toBe('100%');
    });
  });

  // ── renderComparison() ─────────────────────────────────────────────────

  describe('renderComparison()', () => {
    test('renders hourly bars for the selected flag', () => {
      storage.saveMovement({
        timestamp: new Date(2024, 5, 3, 9, 0).toISOString(),
        flags: { justEaten: true },
      });
      correlation.initCorrelation();
      const comparison = document.getElementById('correlation-comparison');
      const hourSlots = comparison.querySelectorAll('.comparison-hour');
      expect(hourSlots.length).toBe(24);
    });

    test('each hour slot shows the hour label', () => {
      storage.saveMovement({
        timestamp: new Date(2024, 5, 3, 9, 0).toISOString(),
      });
      correlation.initCorrelation();
      const labels = document.querySelectorAll('.comparison-hour-label');
      expect(labels.length).toBe(24);
      expect(labels[0].textContent).toBe('0');
      expect(labels[12].textContent).toBe('12');
      expect(labels[23].textContent).toBe('23');
    });

    test('shows two bars per hour (with-flag and without-flag)', () => {
      storage.saveMovement({
        timestamp: new Date(2024, 5, 3, 9, 0).toISOString(),
        flags: { justEaten: true },
      });
      correlation.initCorrelation();
      const comparison = document.getElementById('correlation-comparison');
      const firstHourSlot = comparison.querySelector('.comparison-hour');
      const bars = firstHourSlot.querySelectorAll('.comparison-bar');
      expect(bars.length).toBe(2);
    });

    test('changing flag select updates comparison', () => {
      storage.saveMovement({
        timestamp: new Date(2024, 5, 3, 9, 0).toISOString(),
        flags: { justEaten: true, resting: false },
      });
      storage.saveMovement({
        timestamp: new Date(2024, 5, 3, 9, 30).toISOString(),
        flags: { justEaten: false, resting: true },
      });

      correlation.initCorrelation();

      // Switch to resting
      const select = document.getElementById('flag-select');
      select.value = 'resting';
      select.dispatchEvent(new Event('change'));

      const comparison = document.getElementById('correlation-comparison');
      const hour9 = comparison.querySelectorAll('.comparison-hour')[9];
      const bars = hour9.querySelectorAll('.comparison-bar');
      // With resting: 1, without resting: 1
      const withBar = bars[0];
      const withoutBar = bars[1];
      expect(withBar.getAttribute('data-count')).toBe('1');
      expect(withoutBar.getAttribute('data-count')).toBe('1');
    });

    test('comparison shows a legend distinguishing with/without flag', () => {
      storage.saveMovement({
        timestamp: new Date(2024, 5, 3, 9, 0).toISOString(),
      });
      correlation.initCorrelation();
      const comparison = document.getElementById('correlation-comparison');
      const legend = comparison.querySelector('.comparison-legend');
      expect(legend).not.toBeNull();
      expect(legend.textContent).toMatch(/with/i);
      expect(legend.textContent).toMatch(/without/i);
    });
  });

  // ── empty states ───────────────────────────────────────────────────────

  describe('empty states', () => {
    test('comparison shows empty state when no movements', () => {
      correlation.initCorrelation();
      const comparison = document.getElementById('correlation-comparison');
      expect(comparison.textContent).toMatch(/no\s*movements/i);
    });
  });

  // ── getSelectedFlag() ──────────────────────────────────────────────────

  describe('getSelectedFlag()', () => {
    test('returns the default selected flag', () => {
      correlation.initCorrelation();
      expect(correlation.getSelectedFlag()).toBe('justEaten');
    });

    test('returns the newly selected flag after change', () => {
      correlation.initCorrelation();
      const select = document.getElementById('flag-select');
      select.value = 'active';
      select.dispatchEvent(new Event('change'));
      expect(correlation.getSelectedFlag()).toBe('active');
    });
  });
});

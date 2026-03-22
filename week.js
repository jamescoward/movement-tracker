'use strict';

var _storage = typeof require !== 'undefined'
  ? require('./storage.js')
  : window;

// ─── State ───────────────────────────────────────────────────────────────────

let _weekStart = null; // YYYY-MM-DD string (always a Monday)

// ─── Public API ──────────────────────────────────────────────────────────────

function getWeekStart() {
  return _weekStart;
}

function initWeek() {
  _weekStart = _mondayOf(new Date());
  _updateUI();
  renderWeek();

  const prevBtn = document.getElementById('prev-week');
  const nextBtn = document.getElementById('next-week');

  if (prevBtn) prevBtn.addEventListener('click', () => navigateWeek('prev'));
  if (nextBtn) nextBtn.addEventListener('click', () => navigateWeek('next'));
}

function renderWeek() {
  const grid = document.getElementById('weekly-grid');
  if (!grid) return;

  const days = _weekDays(_weekStart);
  const movements = _storage.getMovements();

  grid.innerHTML = '';

  days.forEach((day) => {
    const dateStr = _dateStr(day);
    const count = movements.filter((m) => _localDateStr(m.timestamp) === dateStr).length;

    const link = document.createElement('a');
    link.className = 'week-day-link';
    link.href = `chart.html?date=${dateStr}`;

    const cell = document.createElement('div');
    cell.className = 'week-day';

    const nameEl = document.createElement('span');
    nameEl.className = 'week-day-name';
    nameEl.textContent = day.toLocaleDateString(undefined, { weekday: 'short' });

    const dateEl = document.createElement('span');
    dateEl.className = 'week-day-date';
    dateEl.textContent = String(day.getDate());

    const countEl = document.createElement('span');
    countEl.className = 'week-day-count';
    countEl.textContent = String(count);

    cell.appendChild(nameEl);
    cell.appendChild(dateEl);
    cell.appendChild(countEl);
    link.appendChild(cell);
    grid.appendChild(link);
  });
}

function navigateWeek(direction) {
  const d = new Date(_weekStart + 'T12:00:00');
  if (direction === 'prev') {
    d.setDate(d.getDate() - 7);
  } else if (direction === 'next') {
    d.setDate(d.getDate() + 7);
  }
  _weekStart = _dateStr(d);
  _updateUI();
  renderWeek();
}

// ─── Private helpers ─────────────────────────────────────────────────────────

function _mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return _dateStr(d);
}

function _weekDays(mondayStr) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayStr + 'T12:00:00');
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function _dateStr(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${dy}`;
}

function _localDateStr(timestamp) {
  return _dateStr(new Date(timestamp));
}

function _updateUI() {
  const label = document.getElementById('week-label');
  if (!label) return;

  const days = _weekDays(_weekStart);
  const mon = days[0];
  const sun = days[6];

  const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  label.textContent = `${fmt(mon)} – ${fmt(sun)}`;
}

// ─── Browser initialisation ─────────────────────────────────────────────────

if (typeof window !== 'undefined' && typeof module === 'undefined') {
  window.addEventListener('DOMContentLoaded', initWeek);
}

if (typeof module !== 'undefined') {
  module.exports = { initWeek, renderWeek, navigateWeek, getWeekStart };
}

'use strict';

const { getMovements } = typeof require !== 'undefined'
  ? require('./storage.js')
  : window;

// ─── State ───────────────────────────────────────────────────────────────────

let _currentDate = null; // YYYY-MM-DD string

// ─── Public API ───────────────────────────────────────────────────────────────

function getDisplayDate() {
  return _currentDate;
}

function initChart() {
  _currentDate = _todayStr();
  _updateUI();
  renderChart(_currentDate);

  const prevBtn = document.getElementById('prev-day');
  const nextBtn = document.getElementById('next-day');
  const picker  = document.getElementById('chart-date-picker');

  if (prevBtn) prevBtn.addEventListener('click', () => navigateDay('prev'));
  if (nextBtn) nextBtn.addEventListener('click', () => navigateDay('next'));
  if (picker)  picker.addEventListener('change', (e) => {
    _currentDate = e.target.value;
    _updateUI();
    renderChart(_currentDate);
  });
}

function renderChart(dateStr) {
  const container = document.getElementById('daily-chart');
  if (!container) return;

  const movements = getMovements().filter((m) => _localDateStr(m.timestamp) === dateStr);

  if (movements.length === 0) {
    container.innerHTML = '<p class="chart-empty">No movements logged for this day.</p>';
    return;
  }

  const timeline = document.createElement('div');
  timeline.className = 'timeline';

  // Add hour gridlines and labels
  for (let h = 0; h < 24; h++) {
    const pct = ((h / 24) * 100).toFixed(2);

    const line = document.createElement('div');
    line.className = 'hour-line';
    line.style.top = `${pct}%`;

    const label = document.createElement('span');
    label.className = 'hour-label';
    label.textContent = `${String(h).padStart(2, '0')}:00`;
    line.appendChild(label);

    timeline.appendChild(line);
  }

  movements.forEach((m) => {
    const dot = document.createElement('div');
    dot.className = 'movement-dot';

    if (_hasFlagSet(m.flags)) {
      dot.classList.add('movement-dot--flagged');
    }

    dot.style.top = `${_topPercent(m.timestamp)}%`;

    const timeStr = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    dot.setAttribute('title', timeStr);
    dot.setAttribute('aria-label', `Movement at ${timeStr}`);

    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      _showPopover(dot, m);
    });

    timeline.appendChild(dot);
  });

  container.innerHTML = '';
  container.appendChild(timeline);
}

function navigateDay(direction) {
  // Use noon to avoid DST edge-cases
  const d = new Date(_currentDate + 'T12:00:00');
  if (direction === 'prev') {
    d.setDate(d.getDate() - 1);
  } else if (direction === 'next') {
    d.setDate(d.getDate() + 1);
  }
  _currentDate = _localDateStr(d.toISOString());
  _updateUI();
  renderChart(_currentDate);
}

// ─── Popover ─────────────────────────────────────────────────────────────────

const FLAG_LABELS = {
  justEaten: 'Just eaten',
  crunchedUp: 'Crunched up',
  listeningToMusic: 'Listening to music',
  resting: 'Resting',
  active: 'Active',
};

function _dismissPopover() {
  const existing = document.querySelector('.movement-popover');
  if (existing) existing.remove();
}

function _showPopover(dot, movement) {
  _dismissPopover();

  const popover = document.createElement('div');
  popover.className = 'movement-popover';

  // Time
  const timeStr = new Date(movement.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timeEl = document.createElement('div');
  timeEl.className = 'popover-time';
  timeEl.textContent = timeStr;
  popover.appendChild(timeEl);

  // Flags (only if any are set)
  if (movement.flags && _hasFlagSet(movement.flags)) {
    const flagsEl = document.createElement('div');
    flagsEl.className = 'popover-flags';
    Object.entries(movement.flags).forEach(([key, val]) => {
      if (val) {
        const tag = document.createElement('span');
        tag.className = 'popover-flag';
        tag.textContent = FLAG_LABELS[key] || key;
        flagsEl.appendChild(tag);
      }
    });
    popover.appendChild(flagsEl);
  }

  // Notes (only if present)
  if (movement.notes) {
    const notesEl = document.createElement('div');
    notesEl.className = 'popover-notes';
    notesEl.textContent = movement.notes;
    popover.appendChild(notesEl);
  }

  dot.appendChild(popover);
}

// Dismiss popover on outside click
if (typeof document !== 'undefined') {
  document.addEventListener('click', _dismissPopover);
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _localDateStr(timestamp) {
  const d = new Date(timestamp);
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${dy}`;
}

function _todayStr() {
  return _localDateStr(new Date().toISOString());
}

function _hasFlagSet(flags) {
  if (!flags) return false;
  return Object.values(flags).some(Boolean);
}

function _topPercent(timestamp) {
  const d = new Date(timestamp);
  const minutes = d.getHours() * 60 + d.getMinutes();
  return ((minutes / (24 * 60)) * 100).toFixed(2);
}

function _updateUI() {
  const dateEl = document.getElementById('chart-date');
  const picker  = document.getElementById('chart-date-picker');

  if (dateEl) {
    dateEl.textContent = new Date(_currentDate + 'T12:00:00').toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }
  if (picker) picker.value = _currentDate;
}

// ─── Browser initialisation ───────────────────────────────────────────────────

if (typeof window !== 'undefined' && typeof module === 'undefined') {
  window.addEventListener('DOMContentLoaded', initChart);
}

if (typeof module !== 'undefined') {
  module.exports = { initChart, renderChart, navigateDay, getDisplayDate };
}

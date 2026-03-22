'use strict';

var _storage = typeof require !== 'undefined'
  ? require('./storage.js')
  : window;

// ─── State ───────────────────────────────────────────────────────────────────

let _activeFlag = '';

// ─── Public API ──────────────────────────────────────────────────────────────

function getActiveFlag() {
  return _activeFlag;
}

function initHeatmap() {
  _activeFlag = '';
  renderHeatmap();
  _renderLegend();

  const select = document.getElementById('flag-overlay-select');
  if (select) {
    select.addEventListener('change', (e) => {
      _activeFlag = e.target.value;
      renderHeatmap();
    });
  }
}

function renderHeatmap() {
  const grid = document.getElementById('heatmap-grid');
  if (!grid) return;

  const movements = _storage.getMovements();
  const filtered = _activeFlag
    ? movements.filter((m) => m.flags && m.flags[_activeFlag])
    : movements;

  const matrix = buildDensityMatrix(filtered);
  const maxCount = Math.max(1, ...matrix.flat());

  grid.innerHTML = '';

  // Hour labels header row
  const headerRow = document.createElement('div');
  headerRow.className = 'heatmap-header-row';
  const cornerCell = document.createElement('div');
  cornerCell.className = 'heatmap-corner';
  cornerCell.textContent = '';
  headerRow.appendChild(cornerCell);
  for (let h = 0; h < 24; h++) {
    const label = document.createElement('span');
    label.className = 'heatmap-hour-label';
    label.textContent = String(h);
    headerRow.appendChild(label);
  }
  grid.appendChild(headerRow);

  // Day rows
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (let d = 0; d < 7; d++) {
    const row = document.createElement('div');
    row.className = 'heatmap-row';

    const dayLabel = document.createElement('span');
    dayLabel.className = 'heatmap-day-label';
    dayLabel.textContent = dayNames[d];
    row.appendChild(dayLabel);

    for (let h = 0; h < 24; h++) {
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      const count = matrix[d][h];
      const intensity = _intensityLevel(count, maxCount);
      cell.setAttribute('data-intensity', String(intensity));
      cell.setAttribute('title', `${dayNames[d]} ${String(h).padStart(2, '0')}:00 — ${count} movement${count !== 1 ? 's' : ''}`);
      row.appendChild(cell);
    }

    grid.appendChild(row);
  }
}

function buildDensityMatrix(movements) {
  // 7 days (Mon=0 .. Sun=6) × 24 hours
  const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));

  movements.forEach((m) => {
    const d = new Date(m.timestamp);
    const jsDay = d.getDay(); // 0=Sun, 1=Mon, ...
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1; // Mon=0, Sun=6
    const hour = d.getHours();
    matrix[dayIndex][hour]++;
  });

  return matrix;
}

// ─── Private helpers ─────────────────────────────────────────────────────────

function _intensityLevel(count, maxCount) {
  if (count === 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function _renderLegend() {
  const legend = document.getElementById('heatmap-legend');
  if (!legend) return;

  legend.innerHTML = '';

  const lessLabel = document.createElement('span');
  lessLabel.className = 'legend-label';
  lessLabel.textContent = 'Less';
  legend.appendChild(lessLabel);

  for (let i = 0; i <= 4; i++) {
    const cell = document.createElement('div');
    cell.className = 'legend-cell';
    cell.setAttribute('data-intensity', String(i));
    legend.appendChild(cell);
  }

  const moreLabel = document.createElement('span');
  moreLabel.className = 'legend-label';
  moreLabel.textContent = 'More';
  legend.appendChild(moreLabel);
}

// ─── Browser initialisation ─────────────────────────────────────────────────

if (typeof window !== 'undefined' && typeof module === 'undefined') {
  window.addEventListener('DOMContentLoaded', initHeatmap);
}

if (typeof module !== 'undefined') {
  module.exports = { initHeatmap, renderHeatmap, buildDensityMatrix, getActiveFlag };
}

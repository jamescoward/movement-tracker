'use strict';

var _storage = typeof require !== 'undefined'
  ? require('./storage.js')
  : window;

// ─── State ──────────────────────────────────────────────────────────────────

var _selectedFlag = 'justEaten';

// ─── Public API ─────────────────────────────────────────────────────────────

function getSelectedFlag() {
  return _selectedFlag;
}

function computeFlagBreakdown(movements) {
  var flags = _storage.getCustomFlags();
  var result = {};
  var total = movements.length;

  flags.forEach(function (flag) {
    var count = 0;
    movements.forEach(function (m) {
      if (m.flags && m.flags[flag.key]) count++;
    });
    result[flag.key] = {
      count: count,
      percent: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
    };
  });

  return result;
}

function computeHourlyComparison(movements, flagKey) {
  var withFlag = Array(24).fill(0);
  var withoutFlag = Array(24).fill(0);

  movements.forEach(function (m) {
    var hour = new Date(m.timestamp).getHours();
    if (m.flags && m.flags[flagKey]) {
      withFlag[hour]++;
    } else {
      withoutFlag[hour]++;
    }
  });

  return { withFlag: withFlag, withoutFlag: withoutFlag };
}

function initCorrelation() {
  var select = document.getElementById('flag-select');
  if (select) {
    var flags = _storage.getCustomFlags();
    select.innerHTML = '';
    flags.forEach(function (flag) {
      var option = document.createElement('option');
      option.value = flag.key;
      option.textContent = flag.label;
      select.appendChild(option);
    });
    _selectedFlag = flags.length > 0 ? flags[0].key : _selectedFlag;
    select.value = _selectedFlag;

    select.addEventListener('change', function (e) {
      _selectedFlag = e.target.value;
      _renderComparison();
    });
  }

  _renderBreakdown();
  _renderComparison();
}

// ─── Private helpers ────────────────────────────────────────────────────────

function _renderBreakdown() {
  var container = document.getElementById('correlation-breakdown');
  if (!container) return;

  var movements = _storage.getMovements();
  container.innerHTML = '';

  if (movements.length === 0) {
    var empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No movements logged yet.';
    container.appendChild(empty);
    return;
  }

  var flags = _storage.getCustomFlags();
  var breakdown = computeFlagBreakdown(movements);

  flags.forEach(function (flag) {
    var item = document.createElement('div');
    item.className = 'breakdown-item';

    var label = document.createElement('span');
    label.className = 'breakdown-label';
    label.textContent = flag.label;
    item.appendChild(label);

    var barContainer = document.createElement('div');
    barContainer.className = 'breakdown-bar';

    var fill = document.createElement('div');
    fill.className = 'breakdown-fill';
    var entry = breakdown[flag.key] || { count: 0, percent: 0 };
    fill.style.width = entry.percent + '%';
    barContainer.appendChild(fill);
    item.appendChild(barContainer);

    var stat = document.createElement('span');
    stat.className = 'breakdown-stat';
    stat.textContent = entry.count + ' (' + Math.round(entry.percent) + '%)';
    item.appendChild(stat);

    container.appendChild(item);
  });
}

function _renderComparison() {
  var container = document.getElementById('correlation-comparison');
  if (!container) return;

  var movements = _storage.getMovements();
  container.innerHTML = '';

  if (movements.length === 0) {
    var empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No movements logged yet.';
    container.appendChild(empty);
    return;
  }

  var data = computeHourlyComparison(movements, _selectedFlag);
  var maxCount = Math.max(1, Math.max.apply(null, data.withFlag), Math.max.apply(null, data.withoutFlag));

  // Legend
  var legend = document.createElement('div');
  legend.className = 'comparison-legend';

  var withSwatch = document.createElement('span');
  withSwatch.className = 'legend-swatch legend-swatch--with';
  legend.appendChild(withSwatch);
  var flags = _storage.getCustomFlags();
  var selectedFlagObj = flags.find(function (f) { return f.key === _selectedFlag; });
  var selectedFlagLabel = selectedFlagObj ? selectedFlagObj.label : _selectedFlag;

  var withLabel = document.createElement('span');
  withLabel.className = 'legend-label';
  withLabel.textContent = 'With ' + selectedFlagLabel.toLowerCase();
  legend.appendChild(withLabel);

  var withoutSwatch = document.createElement('span');
  withoutSwatch.className = 'legend-swatch legend-swatch--without';
  legend.appendChild(withoutSwatch);
  var withoutLabel = document.createElement('span');
  withoutLabel.className = 'legend-label';
  withoutLabel.textContent = 'Without';
  legend.appendChild(withoutLabel);

  container.appendChild(legend);

  // Hour bars
  for (var h = 0; h < 24; h++) {
    var slot = document.createElement('div');
    slot.className = 'comparison-hour';

    var hourLabel = document.createElement('span');
    hourLabel.className = 'comparison-hour-label';
    hourLabel.textContent = String(h);
    slot.appendChild(hourLabel);

    var barsContainer = document.createElement('div');
    barsContainer.className = 'comparison-bars';

    var withBar = document.createElement('div');
    withBar.className = 'comparison-bar comparison-bar--with';
    withBar.setAttribute('data-count', String(data.withFlag[h]));
    withBar.style.width = (data.withFlag[h] / maxCount * 100) + '%';
    barsContainer.appendChild(withBar);

    var withoutBar = document.createElement('div');
    withoutBar.className = 'comparison-bar comparison-bar--without';
    withoutBar.setAttribute('data-count', String(data.withoutFlag[h]));
    withoutBar.style.width = (data.withoutFlag[h] / maxCount * 100) + '%';
    barsContainer.appendChild(withoutBar);

    slot.appendChild(barsContainer);
    container.appendChild(slot);
  }
}

// ─── Browser initialisation ─────────────────────────────────────────────────

if (typeof window !== 'undefined' && typeof module === 'undefined') {
  window.addEventListener('DOMContentLoaded', initCorrelation);
}

if (typeof module !== 'undefined') {
  module.exports = { initCorrelation, computeFlagBreakdown, computeHourlyComparison, getSelectedFlag };
}

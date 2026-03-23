'use strict';

const storage = typeof require !== 'undefined'
  ? require('./storage.js')
  : window;

// ─── Public API ───────────────────────────────────────────────────────────────

function initLogForm() {
  _renderFlagToggles();
  _bindFlagToggles();
  document.getElementById('log-movement-btn').addEventListener('click', handleSave);
  renderRecentMovements();
}

function handleSave() {
  const notesInput = document.getElementById('movement-notes');

  const timestamp = new Date();

  const flags = {};
  document.querySelectorAll('.flag-toggle').forEach((btn) => {
    flags[btn.dataset.flag] = btn.classList.contains('flag-toggle--active');
  });

  storage.saveMovement({ timestamp: timestamp.toISOString(), flags, notes: notesInput.value.trim() });

  // Reset notes only; flags persist so rapid repeated logging keeps the same context
  notesInput.value = '';

  showToast('Movement logged');
  renderRecentMovements();
}

function showToast(message) {
  const toast = document.getElementById('save-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  setTimeout(() => {
    toast.hidden = true;
  }, 3000);
}

function renderRecentMovements() {
  const list = document.getElementById('recent-movements');
  if (!list) return;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  const movements = storage.getMovements({ from: startOfDay, to: endOfDay });

  const flagLabelMap = {};
  storage.getCustomFlags().forEach((f) => { flagLabelMap[f.key] = f.label; });

  list.innerHTML = '';

  if (movements.length === 0) {
    list.innerHTML = '<li class="empty-state">No movements logged today yet.</li>';
    return;
  }

  movements.forEach((m) => {
    const li = document.createElement('li');
    li.className = 'movement-item';

    const time = new Date(m.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const timeSpan = document.createElement('span');
    timeSpan.className = 'movement-time';
    timeSpan.textContent = time;
    li.appendChild(timeSpan);

    const activeFlags = Object.entries(m.flags)
      .filter(([, v]) => v)
      .map(([k]) => flagLabelMap[k] || k);

    if (activeFlags.length > 0) {
      const flagSpan = document.createElement('span');
      flagSpan.className = 'movement-flags';
      flagSpan.textContent = activeFlags.join(', ');
      li.appendChild(flagSpan);
    }

    if (m.notes) {
      const notesSpan = document.createElement('span');
      notesSpan.className = 'movement-notes';
      notesSpan.textContent = m.notes;
      li.appendChild(notesSpan);
    }

    list.appendChild(li);
  });
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _renderFlagToggles() {
  const grid = document.getElementById('flags-grid');
  if (!grid) return;

  const flags = storage.getCustomFlags();
  grid.innerHTML = '';
  flags.forEach((flag) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'flag-toggle';
    btn.dataset.flag = flag.key;
    btn.setAttribute('aria-pressed', 'false');
    btn.textContent = flag.label;
    grid.appendChild(btn);
  });
}

function _bindFlagToggles() {
  document.querySelectorAll('.flag-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const isActive = btn.classList.toggle('flag-toggle--active');
      btn.setAttribute('aria-pressed', String(isActive));
    });
  });
}

// ─── Browser initialisation ───────────────────────────────────────────────────

if (typeof window !== 'undefined' && typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogForm);
  } else {
    initLogForm();
  }
}

if (typeof module !== 'undefined') {
  module.exports = { initLogForm, handleSave, showToast, renderRecentMovements };
}

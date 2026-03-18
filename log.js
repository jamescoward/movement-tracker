'use strict';

const { saveMovement, getMovements } = typeof require !== 'undefined'
  ? require('./storage.js')
  : window;

// ─── Public API ───────────────────────────────────────────────────────────────

function initLogForm() {
  _setTimeInputToNow();
  _bindFlagToggles();
  document.getElementById('log-movement-btn').addEventListener('click', handleSave);
  renderRecentMovements();
}

function handleSave() {
  const timeInput = document.getElementById('movement-time');
  const notesInput = document.getElementById('movement-notes');

  const [hours, minutes] = timeInput.value.split(':').map(Number);
  const timestamp = new Date();
  timestamp.setHours(hours, minutes, 0, 0);

  const flags = {};
  document.querySelectorAll('.flag-toggle').forEach((btn) => {
    flags[btn.dataset.flag] = btn.classList.contains('flag-toggle--active');
  });

  saveMovement({ timestamp: timestamp.toISOString(), flags, notes: notesInput.value.trim() });

  // Reset form
  document.querySelectorAll('.flag-toggle').forEach((btn) => {
    btn.classList.remove('flag-toggle--active');
    btn.setAttribute('aria-pressed', 'false');
  });
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

  const movements = getMovements({ from: startOfDay, to: endOfDay });

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
      .map(([k]) => k);

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

function _setTimeInputToNow() {
  const input = document.getElementById('movement-time');
  if (!input) return;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  input.value = `${hh}:${mm}`;
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
  window.addEventListener('DOMContentLoaded', initLogForm);
}

if (typeof module !== 'undefined') {
  module.exports = { initLogForm, handleSave, showToast, renderRecentMovements };
}

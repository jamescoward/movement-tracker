'use strict';

var storage = typeof require !== 'undefined'
  ? require('./storage.js')
  : window;

// ─── Custom flags UI ─────────────────────────────────────────────────────────

function renderFlags() {
  var list = document.getElementById('custom-flags-list');
  if (!list) return;

  var flags = storage.getCustomFlags();
  list.innerHTML = '';

  flags.forEach(function (flag) {
    var li = document.createElement('li');
    li.className = 'flag-item';

    var span = document.createElement('span');
    span.className = 'flag-label';
    span.textContent = flag.label;
    li.appendChild(span);

    var renameBtn = document.createElement('button');
    renameBtn.type = 'button';
    renameBtn.className = 'rename-flag-btn';
    renameBtn.textContent = 'Rename';
    renameBtn.setAttribute('aria-label', 'Rename ' + flag.label);
    renameBtn.addEventListener('click', function () {
      var newLabel = prompt('Rename flag:', flag.label);
      if (newLabel && newLabel.trim()) {
        storage.renameCustomFlag(flag.key, newLabel.trim());
        renderFlags();
      }
    });
    li.appendChild(renameBtn);

    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-flag-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.setAttribute('aria-label', 'Remove ' + flag.label);
    removeBtn.addEventListener('click', function () {
      storage.removeCustomFlag(flag.key);
      renderFlags();
    });
    li.appendChild(removeBtn);

    list.appendChild(li);
  });
}

function _bindAddFlag() {
  var btn = document.getElementById('add-flag-btn');
  var input = document.getElementById('new-flag-input');
  if (!btn || !input) return;

  btn.addEventListener('click', function () {
    var label = input.value.trim();
    if (!label) return;
    storage.addCustomFlag(label);
    input.value = '';
    renderFlags();
  });
}

// ─── Reminders UI ────────────────────────────────────────────────────────────

function _initReminders() {
  var toggle = document.getElementById('reminder-toggle');
  var timeInput = document.getElementById('reminder-time');
  if (!toggle || !timeInput) return;

  var saved = storage.getReminderSettings();
  toggle.checked = saved.enabled;
  timeInput.value = saved.time;

  toggle.addEventListener('change', function () {
    var current = storage.getReminderSettings();
    storage.saveReminderSettings({ enabled: toggle.checked, time: current.time });
    if (toggle.checked && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  });

  timeInput.addEventListener('change', function () {
    var current = storage.getReminderSettings();
    storage.saveReminderSettings({ enabled: current.enabled, time: timeInput.value });
  });
}

// ─── Dark mode UI ────────────────────────────────────────────────────────────

function _initDarkMode() {
  var btn = document.getElementById('dark-mode-toggle');
  if (!btn) return;

  var isDark = storage.getDarkMode();
  if (isDark) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  btn.setAttribute('aria-pressed', String(isDark));

  btn.addEventListener('click', function () {
    var isDark = document.body.classList.toggle('dark-mode');
    storage.setDarkMode(isDark);
    btn.setAttribute('aria-pressed', String(isDark));
  });
}

// ─── Init ────────────────────────────────────────────────────────────────────

function initSettings() {
  renderFlags();
  _bindAddFlag();
  _initReminders();
  _initDarkMode();
}

// ─── Browser initialisation ──────────────────────────────────────────────────

if (typeof window !== 'undefined' && typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettings);
  } else {
    initSettings();
  }
}

if (typeof module !== 'undefined') {
  module.exports = { initSettings: initSettings, renderFlags: renderFlags };
}

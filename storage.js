'use strict';

(function () {
  var STORAGE_KEY = 'movement_tracker_data';
  var STORAGE_LIMIT_BYTES = 5 * 1024 * 1024; // 5 MB typical localStorage limit
  var STORAGE_WARN_THRESHOLD = 0.8; // warn at 80%

  function _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function _defaultFlags(overrides) {
    return Object.assign(
      { justEaten: false, crunchedUp: false, listeningToMusic: false, resting: false, active: false },
      overrides || {}
    );
  }

  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function _save(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function saveMovement(input) {
    var records = _load();
    var record = {
      id: _generateId(),
      timestamp: (input && input.timestamp) || new Date().toISOString(),
      flags: _defaultFlags(input && input.flags),
      notes: (input && input.notes) || '',
    };
    records.push(record);
    _save(records);
    return record;
  }

  function getMovements(dateRange) {
    var records = _load();
    var sorted = records.slice().sort(function (a, b) { return new Date(a.timestamp) - new Date(b.timestamp); });
    if (!dateRange) return sorted;
    var from = dateRange.from ? new Date(dateRange.from) : null;
    var to = dateRange.to ? new Date(dateRange.to) : null;
    return sorted.filter(function (r) {
      var ts = new Date(r.timestamp);
      if (from && ts < from) return false;
      if (to && ts > to) return false;
      return true;
    });
  }

  function deleteMovement(id) {
    var records = _load();
    _save(records.filter(function (r) { return r.id !== id; }));
  }

  function exportData() {
    return JSON.stringify(_load());
  }

  function importData(json) {
    var incoming = JSON.parse(json); // throws on invalid JSON
    if (!Array.isArray(incoming)) throw new Error('importData: data must be an array');
    var existing = _load();
    var existingIds = new Set(existing.map(function (r) { return r.id; }));
    var merged = existing.concat(incoming.filter(function (r) { return !existingIds.has(r.id); }));
    _save(merged);
  }

  function checkStorageCapacity() {
    var raw = localStorage.getItem(STORAGE_KEY) || '';
    var used = new Blob([raw]).size;
    var percentUsed = used / STORAGE_LIMIT_BYTES;
    return {
      used: used,
      percentUsed: percentUsed,
      warn: percentUsed >= STORAGE_WARN_THRESHOLD,
    };
  }

  // ─── Custom flags ────────────────────────────────────────────────────────────

  var FLAGS_KEY = 'movement_tracker_flags';
  var DEFAULT_FLAGS = [
    { key: 'justEaten', label: 'Just eaten' },
    { key: 'crunchedUp', label: 'Crunched up' },
    { key: 'listeningToMusic', label: 'Listening to music' },
    { key: 'resting', label: 'Resting' },
    { key: 'active', label: 'Active' },
  ];

  function getCustomFlags() {
    try {
      var raw = localStorage.getItem(FLAGS_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_FLAGS.slice();
    } catch (_) {
      return DEFAULT_FLAGS.slice();
    }
  }

  function saveCustomFlags(flags) {
    localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
  }

  function _toCamelCase(str) {
    return str.trim().split(/\s+/).map(function (word, i) {
      if (i === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join('');
  }

  function addCustomFlag(label) {
    var flags = getCustomFlags();
    var key = _toCamelCase(label);
    flags.push({ key: key, label: label });
    saveCustomFlags(flags);
  }

  function removeCustomFlag(key) {
    var flags = getCustomFlags();
    saveCustomFlags(flags.filter(function (f) { return f.key !== key; }));
  }

  function renameCustomFlag(key, newLabel) {
    var flags = getCustomFlags();
    flags.forEach(function (f) {
      if (f.key === key) f.label = newLabel;
    });
    saveCustomFlags(flags);
  }

  // ─── Reminder settings ───────────────────────────────────────────────────────

  var REMINDER_KEY = 'movement_tracker_reminders';

  function getReminderSettings() {
    try {
      var raw = localStorage.getItem(REMINDER_KEY);
      return raw ? JSON.parse(raw) : { enabled: false, time: '09:00' };
    } catch (_) {
      return { enabled: false, time: '09:00' };
    }
  }

  function saveReminderSettings(settings) {
    localStorage.setItem(REMINDER_KEY, JSON.stringify(settings));
  }

  // ─── Dark mode ───────────────────────────────────────────────────────────────

  var DARK_MODE_KEY = 'movement_tracker_dark_mode';

  function getDarkMode() {
    try {
      return localStorage.getItem(DARK_MODE_KEY) === 'true';
    } catch (_) {
      return false;
    }
  }

  function setDarkMode(enabled) {
    localStorage.setItem(DARK_MODE_KEY, String(enabled));
  }

  var api = { saveMovement: saveMovement, getMovements: getMovements, deleteMovement: deleteMovement, exportData: exportData, importData: importData, checkStorageCapacity: checkStorageCapacity, getCustomFlags: getCustomFlags, saveCustomFlags: saveCustomFlags, addCustomFlag: addCustomFlag, removeCustomFlag: removeCustomFlag, renameCustomFlag: renameCustomFlag, getReminderSettings: getReminderSettings, saveReminderSettings: saveReminderSettings, getDarkMode: getDarkMode, setDarkMode: setDarkMode };

  if (typeof module !== 'undefined') {
    module.exports = api;
  } else {
    // Browser: expose as globals so log.js can pick them up
    Object.assign(window, api);
  }
}());

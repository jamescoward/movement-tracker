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

  var api = { saveMovement: saveMovement, getMovements: getMovements, deleteMovement: deleteMovement, exportData: exportData, importData: importData, checkStorageCapacity: checkStorageCapacity };

  if (typeof module !== 'undefined') {
    module.exports = api;
  } else {
    // Browser: expose as globals so log.js can pick them up
    Object.assign(window, api);
  }
}());

'use strict';

const STORAGE_KEY = 'movement_tracker_data';
const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024; // 5 MB typical localStorage limit
const STORAGE_WARN_THRESHOLD = 0.8; // warn at 80%

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
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function _save(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function saveMovement(input) {
  const records = _load();
  const record = {
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
  const records = _load();
  const sorted = records.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  if (!dateRange) return sorted;
  const from = dateRange.from ? new Date(dateRange.from) : null;
  const to = dateRange.to ? new Date(dateRange.to) : null;
  return sorted.filter((r) => {
    const ts = new Date(r.timestamp);
    if (from && ts < from) return false;
    if (to && ts > to) return false;
    return true;
  });
}

function deleteMovement(id) {
  const records = _load();
  _save(records.filter((r) => r.id !== id));
}

function exportData() {
  return JSON.stringify(_load());
}

function importData(json) {
  const incoming = JSON.parse(json); // throws on invalid JSON
  if (!Array.isArray(incoming)) throw new Error('importData: data must be an array');
  const existing = _load();
  const existingIds = new Set(existing.map((r) => r.id));
  const merged = existing.concat(incoming.filter((r) => !existingIds.has(r.id)));
  _save(merged);
}

function checkStorageCapacity() {
  const raw = localStorage.getItem(STORAGE_KEY) || '';
  const used = new Blob([raw]).size;
  const percentUsed = used / STORAGE_LIMIT_BYTES;
  return {
    used,
    percentUsed,
    warn: percentUsed >= STORAGE_WARN_THRESHOLD,
  };
}

if (typeof module !== 'undefined') {
  module.exports = { saveMovement, getMovements, deleteMovement, exportData, importData, checkStorageCapacity };
} else {
  // Browser: expose as globals so log.js can pick them up
  Object.assign(window, { saveMovement, getMovements, deleteMovement, exportData, importData, checkStorageCapacity });
}

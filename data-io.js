'use strict';

const storage = typeof require !== 'undefined'
  ? require('./storage.js')
  : window;

// ─── Public API ───────────────────────────────────────────────────────────────

function initDataIO() {
  var exportJsonBtn = document.getElementById('export-json-btn');
  var exportCsvBtn = document.getElementById('export-csv-btn');
  var importBtn = document.getElementById('import-btn');

  if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportJSON);
  if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportCSV);
  if (importBtn) importBtn.addEventListener('click', handleImport);
}

function exportJSON() {
  var json = storage.exportData();
  var blob = new Blob([json], { type: 'application/json' });
  var filename = 'movement-data-' + _dateStamp() + '.json';
  _downloadBlob(blob, filename);
}

function exportCSV() {
  var movements = storage.getMovements();
  var header = 'timestamp,justEaten,crunchedUp,listeningToMusic,resting,active,notes';
  var rows = movements.map(function (m) {
    var notes = m.notes || '';
    // Escape notes that contain commas or quotes
    if (notes.indexOf(',') !== -1 || notes.indexOf('"') !== -1) {
      notes = '"' + notes.replace(/"/g, '""') + '"';
    }
    return [
      m.timestamp,
      m.flags.justEaten,
      m.flags.crunchedUp,
      m.flags.listeningToMusic,
      m.flags.resting,
      m.flags.active,
      notes,
    ].join(',');
  });
  var csv = [header].concat(rows).join('\n');
  var blob = new Blob([csv], { type: 'text/csv' });
  var filename = 'movement-data-' + _dateStamp() + '.csv';
  _downloadBlob(blob, filename);
}

function handleImport() {
  var input = document.getElementById('import-file-input');
  if (!input || !input.files || input.files.length === 0) {
    showToast('Please select a file first');
    return;
  }

  var file = input.files[0];
  var mode = document.getElementById('import-mode').value;
  var reader = new FileReader();

  reader.onload = function (e) {
    try {
      var json = e.target.result;
      var incoming = JSON.parse(json);
      if (!Array.isArray(incoming)) {
        throw new Error('Invalid data: expected an array');
      }

      if (mode === 'overwrite') {
        // Clear existing data and import fresh
        localStorage.setItem('movement_tracker_data', JSON.stringify(incoming));
      } else {
        // Merge mode (default): use storage.importData which deduplicates
        storage.importData(json);
      }

      showToast('Data imported successfully');
    } catch (err) {
      showToast('Import error: invalid JSON file');
    }
  };

  reader.readAsText(file);
}

function showToast(message) {
  var toast = document.getElementById('save-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  setTimeout(function () {
    toast.hidden = true;
  }, 3000);
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _dateStamp() {
  var d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function _downloadBlob(blob, filename) {
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Browser initialisation ──────────────────────────────────────────────────

if (typeof window !== 'undefined' && typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDataIO);
  } else {
    initDataIO();
  }
}

if (typeof module !== 'undefined') {
  module.exports = { initDataIO: initDataIO, exportJSON: exportJSON, exportCSV: exportCSV, handleImport: handleImport, showToast: showToast };
}

/* @jest-environment jsdom */
'use strict';

const fs = require('fs');
const path = require('path');

const storagePath = path.join(__dirname, '..', 'storage.js');

describe('storage.js — file', () => {
  test('file exists', () => {
    expect(fs.existsSync(storagePath)).toBe(true);
  });
});

describe('storage.js — module', () => {
  let storage;

  beforeEach(() => {
    // Re-require fresh module and clear localStorage before each test
    jest.resetModules();
    localStorage.clear();
    storage = require('../storage.js');
  });

  // --- Schema ---

  describe('saveMovement()', () => {
    test('saves a movement and returns it with an id and timestamp', () => {
      const record = storage.saveMovement({});
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('timestamp');
    });

    test('saved record has the correct flags shape', () => {
      const record = storage.saveMovement({});
      expect(record.flags).toEqual({
        justEaten: false,
        crunchedUp: false,
        listeningToMusic: false,
        resting: false,
        active: false,
      });
    });

    test('saves a movement with custom flags', () => {
      const record = storage.saveMovement({ flags: { justEaten: true } });
      expect(record.flags.justEaten).toBe(true);
      expect(record.flags.crunchedUp).toBe(false);
    });

    test('saves a movement with notes', () => {
      const record = storage.saveMovement({ notes: 'strong kick' });
      expect(record.notes).toBe('strong kick');
    });

    test('uses provided timestamp if given', () => {
      const ts = '2024-06-01T10:00:00.000Z';
      const record = storage.saveMovement({ timestamp: ts });
      expect(record.timestamp).toBe(ts);
    });

    test('generated timestamp is a valid ISO-8601 string', () => {
      const record = storage.saveMovement({});
      expect(() => new Date(record.timestamp)).not.toThrow();
      expect(new Date(record.timestamp).toISOString()).toBe(record.timestamp);
    });

    test('each saved record gets a unique id', () => {
      const a = storage.saveMovement({});
      const b = storage.saveMovement({});
      expect(a.id).not.toBe(b.id);
    });

    test('persists to localStorage', () => {
      storage.saveMovement({ notes: 'test' });
      const raw = localStorage.getItem('movement_tracker_data');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
    });
  });

  // --- getMovements ---

  describe('getMovements()', () => {
    test('returns an empty array when no movements saved', () => {
      expect(storage.getMovements()).toEqual([]);
    });

    test('returns all saved movements when called with no args', () => {
      storage.saveMovement({ notes: 'one' });
      storage.saveMovement({ notes: 'two' });
      expect(storage.getMovements()).toHaveLength(2);
    });

    test('filters by date range when provided', () => {
      storage.saveMovement({ timestamp: '2024-06-01T08:00:00.000Z' });
      storage.saveMovement({ timestamp: '2024-06-02T08:00:00.000Z' });
      storage.saveMovement({ timestamp: '2024-06-03T08:00:00.000Z' });

      const results = storage.getMovements({
        from: '2024-06-01T00:00:00.000Z',
        to: '2024-06-02T23:59:59.999Z',
      });
      expect(results).toHaveLength(2);
    });

    test('returns movements sorted by timestamp ascending', () => {
      storage.saveMovement({ timestamp: '2024-06-01T10:00:00.000Z' });
      storage.saveMovement({ timestamp: '2024-06-01T08:00:00.000Z' });
      const results = storage.getMovements();
      expect(new Date(results[0].timestamp) <= new Date(results[1].timestamp)).toBe(true);
    });
  });

  // --- deleteMovement ---

  describe('deleteMovement()', () => {
    test('removes the movement with the given id', () => {
      const r = storage.saveMovement({ notes: 'to delete' });
      storage.deleteMovement(r.id);
      expect(storage.getMovements()).toHaveLength(0);
    });

    test('leaves other movements intact', () => {
      const keep = storage.saveMovement({ notes: 'keep' });
      const remove = storage.saveMovement({ notes: 'remove' });
      storage.deleteMovement(remove.id);
      const remaining = storage.getMovements();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(keep.id);
    });

    test('does nothing silently if id does not exist', () => {
      storage.saveMovement({});
      expect(() => storage.deleteMovement('non-existent-id')).not.toThrow();
      expect(storage.getMovements()).toHaveLength(1);
    });
  });

  // --- exportData ---

  describe('exportData()', () => {
    test('returns a JSON string', () => {
      storage.saveMovement({ notes: 'export me' });
      const json = storage.exportData();
      expect(typeof json).toBe('string');
      expect(() => JSON.parse(json)).not.toThrow();
    });

    test('exported JSON contains all saved movements', () => {
      storage.saveMovement({ notes: 'a' });
      storage.saveMovement({ notes: 'b' });
      const parsed = JSON.parse(storage.exportData());
      expect(parsed).toHaveLength(2);
    });

    test('returns valid JSON for empty store', () => {
      const json = storage.exportData();
      expect(JSON.parse(json)).toEqual([]);
    });
  });

  // --- importData ---

  describe('importData()', () => {
    test('imports records from a valid JSON string', () => {
      const data = JSON.stringify([
        {
          id: 'abc',
          timestamp: '2024-06-01T09:00:00.000Z',
          flags: { justEaten: false, crunchedUp: false, listeningToMusic: false, resting: false, active: false },
          notes: 'imported',
        },
      ]);
      storage.importData(data);
      expect(storage.getMovements()).toHaveLength(1);
      expect(storage.getMovements()[0].notes).toBe('imported');
    });

    test('merges imported records with existing ones (no duplicates by id)', () => {
      const existing = storage.saveMovement({ notes: 'existing' });
      const data = JSON.stringify([
        {
          id: existing.id,
          timestamp: existing.timestamp,
          flags: existing.flags,
          notes: 'should not duplicate',
        },
        {
          id: 'new-id',
          timestamp: '2024-06-02T10:00:00.000Z',
          flags: { justEaten: false, crunchedUp: false, listeningToMusic: false, resting: false, active: false },
          notes: 'new',
        },
      ]);
      storage.importData(data);
      expect(storage.getMovements()).toHaveLength(2);
    });

    test('throws on invalid JSON', () => {
      expect(() => storage.importData('not-json')).toThrow();
    });

    test('throws if imported data is not an array', () => {
      expect(() => storage.importData(JSON.stringify({ not: 'an array' }))).toThrow();
    });
  });

  // --- checkStorageCapacity ---

  describe('checkStorageCapacity()', () => {
    test('returns an object with used and percentUsed', () => {
      const result = storage.checkStorageCapacity();
      expect(result).toHaveProperty('used');
      expect(result).toHaveProperty('percentUsed');
    });

    test('warns when approaching limit', () => {
      const result = storage.checkStorageCapacity();
      expect(result).toHaveProperty('warn');
      expect(typeof result.warn).toBe('boolean');
    });

    test('warn is false when storage is nearly empty', () => {
      const result = storage.checkStorageCapacity();
      expect(result.warn).toBe(false);
    });
  });
});

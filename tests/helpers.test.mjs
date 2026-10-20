import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, formatTime, toDateKey } from '../src/lib/dates.js';
import {
  addAccount, getAccounts, setActiveUser, getActiveUser,
  savePlannerData, loadPlannerData,
} from '../src/lib/storage.js';

const backing = new Map();
globalThis.localStorage = {
  getItem: (key) => backing.get(key) ?? null,
  setItem: (key, value) => backing.set(key, value),
  removeItem: (key) => backing.delete(key),
};

test('date helper creates local calendar keys', () => {
  assert.equal(toDateKey(2026, 9, 25), '2026-10-25');
  assert.equal(formatTime('14:30'), '2:30 PM');
  assert.ok(formatDate('2026-10-25').includes('2026'));
});

test('demo profiles can be saved and signed out', () => {
  addAccount({ name: 'Jamie', email: 'jamie@example.com' });
  assert.equal(getAccounts()[0].name, 'Jamie');
  setActiveUser(getAccounts()[0]);
  assert.equal(getActiveUser().email, 'jamie@example.com');
  setActiveUser(null);
  assert.equal(getActiveUser(), null);
});

test('separate browser profiles use separate planner data keys', () => {
  savePlannerData('jamie@example.com', { courses: [{ id: 'a' }], events: [] });
  assert.equal(loadPlannerData('jamie@example.com').courses.length, 1);
  assert.equal(loadPlannerData('someone@example.com').courses.length, 0);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BS_DATA_RANGE,
  BS_MONTH_LENGTHS,
  adToBsIso,
  bsToAdIso,
  daysInMonth,
  formatBs,
  validateBsDate
} from './calendar-engine.js';

test('dataset covers the declared BS range', () => {
  for (let year = BS_DATA_RANGE.minYear; year <= BS_DATA_RANGE.maxYear; year += 1) {
    assert.equal(BS_MONTH_LENGTHS[year].length, 12);
    const total = BS_MONTH_LENGTHS[year].reduce((sum, value) => sum + value, 0);
    assert.ok(total >= 365 && total <= 366);
    for (let month = 1; month <= 12; month += 1) {
      assert.ok(daysInMonth(year, month) >= 29 && daysInMonth(year, month) <= 32);
    }
  }
});

test('validates BS boundaries', () => {
  assert.equal(validateBsDate(2081, 1, 1), true);
  assert.throws(() => validateBsDate(2081, 1, 33), /Invalid BS date/);
  assert.throws(() => daysInMonth(1999, 1), /Unsupported BS year/);
});

test('round-trips representative dates', () => {
  const samples = ['2000-01-01', '2017-03-28', '2024-07-24', '2030-01-01'];
  for (const ad of samples) assert.equal(bsToAdIso(...adToBsIso(ad).split('-').map(Number)), ad);
});

test('formats English and Nepali month names', () => {
  assert.equal(formatBs(2081, 4, 9), '09 Shrawan 2081');
  assert.equal(formatBs(2081, 4, 9, 'ne'), '09 साउन 2081');
});

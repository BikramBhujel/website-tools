const assert = require('node:assert/strict');
const planner = require('../planner.js');

function test(name, fn) {
  try {
    fn();
    console.log('✓', name);
  } catch (error) {
    console.error('✗', name);
    throw error;
  }
}

test('small open office requires at least one AP', () => {
  const result = planner.estimate({ lengthM: 10, widthM: 8, clients: 10, environment: 'open', band: '5' });
  assert.equal(result.recommendedAps, 1);
});

test('capacity can drive the recommendation', () => {
  const result = planner.estimate({ lengthM: 10, widthM: 8, clients: 160, environment: 'open', band: '5', maxClientsPerAp: 30, reservePercent: 20 });
  assert.ok(result.capacityAps > result.coverageAps);
  assert.equal(result.recommendedAps, result.capacityAps);
});

test('dense construction requires no fewer coverage APs than open space', () => {
  const common = { lengthM: 40, widthM: 25, clients: 30, band: '5', targetRssi: -67 };
  const open = planner.estimate({ ...common, environment: 'open' });
  const dense = planner.estimate({ ...common, environment: 'dense' });
  assert.ok(dense.coverageAps >= open.coverageAps);
});

test('6 GHz requires no fewer coverage APs than 5 GHz in the same layout model', () => {
  const common = { lengthM: 40, widthM: 25, clients: 30, environment: 'mixed', targetRssi: -67 };
  const five = planner.estimate({ ...common, band: '5' });
  const six = planner.estimate({ ...common, band: '6' });
  assert.ok(six.coverageAps >= five.coverageAps);
});

test('stricter RSSI target increases or preserves the coverage requirement', () => {
  const common = { lengthM: 50, widthM: 30, clients: 20, environment: 'mixed', band: '5' };
  const strict = planner.estimate({ ...common, targetRssi: -62 });
  const relaxed = planner.estimate({ ...common, targetRssi: -70 });
  assert.ok(strict.coverageAps >= relaxed.coverageAps);
});

test('placement grid returns exactly the recommended number of points', () => {
  const result = planner.estimate({ lengthM: 35, widthM: 20, clients: 90, environment: 'mixed', band: '5' });
  assert.equal(result.grid.points.length, result.recommendedAps);
  assert.ok(result.grid.points.every((point) => point.x > 0 && point.x < result.lengthM && point.y > 0 && point.y < result.widthM));
});

console.log('All Wi-Fi AP Planner tests passed.');
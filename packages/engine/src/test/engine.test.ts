import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBySize, recommendByDistance } from '../index.js';

test('calculateBySize returns exact row for known TV size', () => {
  const row = calculateBySize(75);
  assert.equal(row.distance_6h_m.toFixed(3), '5.604');
});

test('recommendByDistance recommends proper size for 3.2m at 6H', () => {
  const rec = recommendByDistance(3.2, '6H');
  assert.equal(rec.recommendedSizeInches, 43);
});

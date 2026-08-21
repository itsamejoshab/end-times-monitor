import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSourceOrigin } from '../scripts/source-origin.mjs';

const END_TIMES_PROVIDER_ORIGINS = {
  'End Time Headlines': 'US',
  'Protestia': 'US',
  'Rapture Ready': 'US',
  'The New York Times': 'US',
  'Tracking Bible Prophecy': 'US',
};

test('every End Times feed provider has a crawlable catalog origin', () => {
  for (const [provider, expectedOrigin] of Object.entries(END_TIMES_PROVIDER_ORIGINS)) {
    assert.equal(resolveSourceOrigin({ provider }), expectedOrigin, provider);
  }
});

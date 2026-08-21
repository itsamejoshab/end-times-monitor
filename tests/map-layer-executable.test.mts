import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getAllowedLayerKeys,
  isLayerCommandAllowed,
  isLayerEntitled,
  isLayerExecutable,
  LAYER_REGISTRY,
  sanitizeLayersForVariant,
} from '../src/config/map-layer-definitions';
import type { MapLayers } from '../src/types';

const RETAINED = [
  'ais',
  'bases',
  'cables',
  'ciiChoropleth',
  'climate',
  'conflicts',
  'cyberThreats',
  'datacenters',
  'diseaseOutbreaks',
  'displacement',
  'fires',
  'fuelShortages',
  'gpsJamming',
  'hotspots',
  'liveTankers',
  'military',
  'natural',
  'nuclear',
  'outages',
  'pipelines',
  'protests',
  'radiationWatch',
  'sanctions',
  'satellites',
  'tradeRoutes',
  'ucdpEvents',
  'waterways',
  'weather',
] as const;

const REMOVED = [
  'iranAttacks',
  'canadaRoads',
  'canadaAlerts',
  'flights',
  'irradiators',
  'spaceports',
  'economic',
  'minerals',
  'resilienceScore',
  'dayNight',
  'startupHubs',
  'stockExchanges',
  'positiveEvents',
  'miningSites',
  'storageFacilities',
  'webcams',
] as const;

describe('End Times map-layer inventory', () => {
  it('registers exactly the approved mission-focused inventory', () => {
    assert.deepEqual(Object.keys(LAYER_REGISTRY).sort(), [...RETAINED].sort());
  });

  it('contains no inherited premium metadata', () => {
    for (const definition of Object.values(LAYER_REGISTRY)) {
      assert.equal('premium' in definition, false, definition.key);
    }
  });

  it('makes removed layers non-executable and non-entitled', () => {
    for (const layer of REMOVED) {
      assert.equal(isLayerExecutable(layer, 'deck'), false, layer);
      assert.equal(isLayerEntitled(layer, true), false, layer);
      assert.equal(isLayerCommandAllowed(layer, true, 'deck', true), false, layer);
    }
  });

  it('preserves renderer constraints for retained layers', () => {
    assert.equal(isLayerExecutable('pipelines', 'svg'), true);
    assert.equal(isLayerExecutable('pipelines', 'globe'), true);
    assert.equal(isLayerExecutable('ciiChoropleth', 'deck'), true);
    assert.equal(isLayerExecutable('ciiChoropleth', 'globe'), true);
    assert.equal(isLayerExecutable('ciiChoropleth', 'svg'), false);
    assert.equal(isLayerExecutable('fuelShortages', 'deck'), true);
    assert.equal(isLayerExecutable('fuelShortages', 'globe'), false);
  });

  it('sanitizes historical saved keys off', () => {
    const historical = {
      conflicts: true,
      flights: true,
      webcams: true,
      resilienceScore: true,
    } as unknown as MapLayers;
    const sanitized = sanitizeLayersForVariant(historical, 'full');

    assert.equal(sanitized.conflicts, true);
    assert.equal(sanitized.flights, false);
    assert.equal(sanitized.webcams, false);
    assert.equal(sanitized.resilienceScore, false);
  });

  it('keeps every variant inside the mission inventory', () => {
    const retained = new Set<string>(RETAINED);
    for (const variant of ['full', 'tech', 'finance', 'happy', 'commodity', 'energy'] as const) {
      for (const layer of getAllowedLayerKeys(variant)) {
        assert.equal(retained.has(layer), true, `${variant}:${layer}`);
      }
    }
  });
});

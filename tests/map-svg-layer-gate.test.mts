import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

import { isLayerExecutable, isLayerToggleAllowed } from '../src/config/map-layer-definitions';
import type { MapLayers } from '../src/types';

const mapSrc = readFileSync(new URL('../src/components/Map.ts', import.meta.url), 'utf8');
const tier = { premium: false };

function extractMethods(): new () => {
  state: { layers: MapLayers; zoom: number };
  container: { querySelector: () => null };
  layerZoomOverrides: Record<string, boolean>;
  canToggleLayer: (layer: keyof MapLayers, currentlyEnabled: boolean | undefined) => boolean;
  onLayerChange?: (layer: keyof MapLayers, enabled: boolean, source: string) => void;
  scheduleRender(): void;
  render(): void;
  toggleLayer(layer: keyof MapLayers, source?: 'user' | 'programmatic'): void;
  enableLayer(layer: keyof MapLayers): void;
} {
  function extract(signature: string): string {
    const start = mapSrc.indexOf(signature);
    assert.ok(start >= 0, `Map must contain ${signature}`);
    const braceStart = mapSrc.indexOf('{', start);
    let depth = 0;
    let end = -1;
    for (let i = braceStart; i < mapSrc.length; i++) {
      if (mapSrc[i] === '{') depth++;
      else if (mapSrc[i] === '}' && --depth === 0) {
        end = i + 1;
        break;
      }
    }
    assert.ok(end > braceStart, `${signature} must have balanced braces`);
    return mapSrc.slice(start, end).replace(/^public\s+/, '');
  }

  const methods = [
    extract("public toggleLayer(layer: keyof MapLayers, source: 'user' | 'programmatic' = 'user'): void {"),
    extract('public enableLayer(layer: keyof MapLayers): void {'),
  ].join('\n');
  const js = ts.transpileModule(
    `const document = { querySelector: () => null };
     const MapComponent = { LAYER_ZOOM_THRESHOLDS: {}, ASYNC_DATA_LAYERS: new Set() };
     class MapHarness { ${methods} }`,
    { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None } },
  ).outputText;
  return new Function(
    `${js}\nreturn MapHarness;`,
  )() as new () => {
    state: { layers: MapLayers; zoom: number };
    container: { querySelector: () => null };
    layerZoomOverrides: Record<string, boolean>;
    canToggleLayer: (layer: keyof MapLayers, currentlyEnabled: boolean | undefined) => boolean;
    onLayerChange?: (layer: keyof MapLayers, enabled: boolean, source: string) => void;
    scheduleRender(): void;
    render(): void;
    toggleLayer(layer: keyof MapLayers, source?: 'user' | 'programmatic'): void;
    enableLayer(layer: keyof MapLayers): void;
  };
}

const MapHarness = extractMethods();

function makeMap(initialLayers: Partial<MapLayers> = {}) {
  const changes: Array<[keyof MapLayers, boolean, string]> = [];
  const map = new MapHarness();
  map.state = {
    zoom: 3,
    layers: { resilienceScore: false, ciiChoropleth: false, ...initialLayers } as MapLayers,
  };
  map.container = { querySelector: () => null };
  map.layerZoomOverrides = {};
  map.canToggleLayer = (layer, currentlyEnabled) => isLayerToggleAllowed(layer, currentlyEnabled === true, tier.premium);
  map.onLayerChange = (layer, enabled, source) => changes.push([layer, enabled, source]);
  map.scheduleRender = () => {};
  map.render = () => {};
  return { map, changes };
}

describe('SVG map layer toggle gate', () => {
  it('does not enable inherited non-inventory layers', () => {
    tier.premium = false;
    const fresh = makeMap();
    fresh.map.toggleLayer('resilienceScore');
    assert.equal(fresh.map.state.layers.resilienceScore, false);
    assert.deepEqual(fresh.changes, []);

    const stale = makeMap({ resilienceScore: true });
    stale.map.toggleLayer('resilienceScore');
    assert.equal(stale.map.state.layers.resilienceScore, true);
    assert.deepEqual(stale.changes, []);
  });

  it('keeps mission layers available without a subscription', () => {
    tier.premium = false;
    const map = makeMap();
    map.map.toggleLayer('ciiChoropleth');
    assert.equal(map.map.state.layers.ciiChoropleth, true);
  });

  it('gates programmatic enableLayer with the same inventory policy', () => {
    tier.premium = false;
    const free = makeMap();
    free.map.enableLayer('resilienceScore');
    assert.equal(free.map.state.layers.resilienceScore, false);

    tier.premium = true;
    const premium = makeMap();
    premium.map.enableLayer('resilienceScore');
    assert.equal(premium.map.state.layers.resilienceScore, false);
  });
});

describe('SVG map layer picker capability gate', () => {
  it('filters picker candidates through the canonical SVG renderer capability', () => {
    assert.equal(isLayerExecutable('ciiChoropleth', 'svg'), false);

    const methodStart = mapSrc.indexOf('private createLayerToggles(): HTMLElement {');
    const methodEnd = mapSrc.indexOf('private clearLayerExplanationOutsideClickHandler', methodStart);
    assert.ok(methodStart >= 0 && methodEnd > methodStart, 'Map must contain createLayerToggles');
    const pickerSrc = mapSrc.slice(methodStart, methodEnd);

    assert.match(
      pickerSrc,
      /getLayersForVariant\([\s\S]*?'svg'[\s\S]*?\.filter\(\(key\) => isLayerExecutable\(key, 'svg'\)\)/,
      'SVG picker candidates must pass the registry capability gate before buttons are rendered',
    );
  });
});

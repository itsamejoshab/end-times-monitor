import { beforeEach, describe, expect, it } from 'vitest';

import {
  bindLayerSearch,
  LAYER_REGISTRY,
  LAYER_SYNONYMS,
} from '@/config/map-layer-definitions';

describe('mission layer discovery', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="layer-picker">
        <input class="layer-search" />
        <div class="layer-toggle-row">
          <label class="layer-toggle" data-layer="liveTankers">Live Tanker Positions</label>
        </div>
        <div class="layer-toggle-row">
          <label class="layer-toggle" data-layer="conflicts">Conflict Zones</label>
        </div>
      </div>
    `;
  });

  it('keeps tanker search terms on the retained maritime layer', () => {
    expect(LAYER_REGISTRY.liveTankers.fallbackLabel).toContain('Tanker');
    expect(LAYER_SYNONYMS.tanker).toContain('liveTankers');
  });

  it('finds live tankers when the picker is searched for tanker', () => {
    const picker = document.querySelector<HTMLElement>('#layer-picker');
    const search = picker?.querySelector<HTMLInputElement>('.layer-search');
    const liveTankers = picker?.querySelector<HTMLElement>('[data-layer="liveTankers"]')?.closest<HTMLElement>('.layer-toggle-row');
    const conflicts = picker?.querySelector<HTMLElement>('[data-layer="conflicts"]')?.closest<HTMLElement>('.layer-toggle-row');

    expect(picker).not.toBeNull();
    expect(search).not.toBeNull();
    expect(liveTankers).not.toBeNull();
    expect(conflicts).not.toBeNull();

    bindLayerSearch(picker!);
    search!.value = 'tanker';
    search!.dispatchEvent(new Event('input'));

    expect(liveTankers!.style.display).toBe('');
    expect(conflicts!.style.display).toBe('none');
  });
});

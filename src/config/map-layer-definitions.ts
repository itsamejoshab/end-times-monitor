import type { MapLayers } from '@/types';

/**
 * The three concrete map renderers a layer can be painted by. This is the
 * single renderer axis: `'svg'` (D3/SVG mobile fallback in Map.ts), `'deck'`
 * (WebGL DeckGLMap), and `'globe'` (globe.gl GlobeMap). It mirrors
 * MapContainer's `RendererKind` (computed by `getPendingRendererKind()`), which
 * imports this type so the picker, dispatcher, and shell stay in lockstep.
 */
export type RendererKind = 'svg' | 'deck' | 'globe';
export type MapVariant = 'full' | 'tech' | 'finance' | 'happy' | 'commodity' | 'energy';

export interface LayerDefinition {
  key: keyof MapLayers;
  icon: string;
  i18nSuffix: string;
  fallbackLabel: string;
  /**
   * Every renderer that has a real paint path for this layer. A layer executes
   * (picker toggle / CMD+K dispatch) under a renderer only if that renderer is
   * listed here — this is the whole gate. A DeckGL-only layer is `['deck']`; a
   * layer painted by both DeckGL and the globe (e.g. the CII choropleth) is
   * `['deck', 'globe']`; a layer on every surface is `['svg', 'deck', 'globe']`.
   */
  renderers: RendererKind[];
}

export type LayerExplanationCoverage = 'curated' | 'fallback';

export interface LayerExplanation {
  key: keyof MapLayers;
  coverage: LayerExplanationCoverage;
  category: string;
  purpose: string;
  source: string;
  freshness: string;
  confidence: string;
  limitations: string[];
  related: string[];
  evidence: string[];
}

const def = (
  key: keyof MapLayers,
  icon: string,
  i18nSuffix: string,
  fallbackLabel: string,
  renderers: RendererKind[] = ['svg', 'deck', 'globe'],
): LayerDefinition => ({
  key, icon, i18nSuffix, fallbackLabel, renderers,
});

/**
 * End Times Monitor map-layer authority. Historical World Monitor fields can
 * still occur in persisted MapLayers objects during migration, but absent keys
 * are sanitized off and never appear in a picker or command.
 */
export const LAYER_REGISTRY = {
  hotspots:                 def('hotspots',                 '&#127919;', 'intelHotspots',            'Intel Hotspots'),
  conflicts:                def('conflicts',                '&#9876;',   'conflictZones',            'Conflict Zones'),

  bases:                    def('bases',                    '&#127963;', 'militaryBases',            'Military Bases'),
  nuclear:                  def('nuclear',                  '&#9762;',   'nuclearSites',             'Nuclear Sites'),
  radiationWatch:           def('radiationWatch',           '&#9762;',   'radiationWatch',           'Radiation Watch'),
  satellites:               def('satellites',               '&#128752;', 'satellites',               'Orbital Surveillance', ['svg', 'deck', 'globe']),

  cables:                   def('cables',                   '&#128268;', 'underseaCables',           'Undersea Cables'),
  pipelines:                def('pipelines',                '&#128738;', 'pipelines',                'Pipelines'),
  datacenters:              def('datacenters',              '&#128421;', 'aiDataCenters',            'AI Data Centers'),
  military:                 def('military',                 '&#9992;',   'militaryActivity',         'Military Activity'),
  ais:                      def('ais',                      '&#128674;', 'shipTraffic',              'Ship Traffic'),
  tradeRoutes:              def('tradeRoutes',              '&#9875;',   'tradeRoutes',              'Trade Routes'),
  protests:                 def('protests',                 '&#128226;', 'protests',                 'Protests'),
  ucdpEvents:               def('ucdpEvents',               '&#9876;',   'ucdpEvents',               'Armed Conflict Events'),
  displacement:             def('displacement',             '&#128101;', 'displacementFlows',        'Displacement Flows'),
  climate:                  def('climate',                  '&#127787;', 'climateAnomalies',         'Climate Anomalies'),
  weather:                  def('weather',                  '&#9928;',   'weatherAlerts',            'Severe Weather Alerts (NWS, ECCC, WMO SWIC)'),
  outages:                  def('outages',                  '&#128225;', 'internetOutages',          'Internet Disruptions'),
  cyberThreats:             def('cyberThreats',             '&#128737;', 'cyberThreats',             'Cyber Threats'),
  natural:                  def('natural',                  '&#127755;', 'naturalEvents',            'Natural Events'),
  fires:                    def('fires',                    '&#128293;', 'fires',                    'Fires'),
  waterways:                def('waterways',                '&#9875;',   'strategicWaterways',       'Chokepoints'),
  gpsJamming:               def('gpsJamming',               '&#128225;', 'gpsJamming',               'GPS Jamming'),
  // Painted by DeckGLMap AND GlobeMap (both build CII choropleth polygons);
  // the SVG/mobile fallback has no CII paint path, so this is deck + globe,
  // NOT svg. Previously mislabeled `['flat']`, which wrongly kept it out of
  // the globe layer picker even though GlobeMap renders it (#6773 / R8).
  ciiChoropleth:            def('ciiChoropleth',            '&#127758;', 'ciiChoropleth',            'CII Instability', ['deck', 'globe']),
  sanctions:                def('sanctions',                '&#128683;', 'sanctions',                'Sanctions', ['svg', 'deck']),
  diseaseOutbreaks:         def('diseaseOutbreaks',         '&#129440;', 'diseaseOutbreaks',         'Disease Outbreaks', ['deck']),
  fuelShortages:            def('fuelShortages',            '&#9881;',   'fuelShortages',            'Fuel Shortages', ['deck']),
  liveTankers:              def('liveTankers',              '&#128674;', 'liveTankers',              'Live Tanker Positions', ['deck']),
} satisfies Partial<Record<keyof MapLayers, LayerDefinition>>;

export type MapLayerKey = keyof typeof LAYER_REGISTRY;

export const V1_LAYER_EXPLANATION_KEYS = [
  'conflicts',
  'ucdpEvents',
  'ciiChoropleth',
  'natural',
  'weather',
  'ais',
  'waterways',
  'tradeRoutes',
  'cyberThreats',
  'hotspots',
] as const satisfies readonly (keyof MapLayers)[];

export const LAYER_EXPLANATIONS: Partial<Record<keyof MapLayers, LayerExplanation>> = {
  conflicts: {
    key: 'conflicts',
    coverage: 'curated',
    category: 'Conflict',
    purpose: 'Shows curated conflict zones and geopolitical boundary overlays so analysts can orient live signals against known theaters.',
    source: 'WorldMonitor conflict-zone registry, UCDP/ACLED conflict context, and documented boundary metadata such as the Korean DMZ.',
    freshness: 'Base zones are curated/static. Dynamic conflict-event inputs are tracked separately through ACLED/UCDP feeds and health signals.',
    confidence: 'Good for geographic orientation; not a real-time incident confirmation by itself.',
    limitations: [
      'Static zones can lag fast tactical changes.',
      'Some conflict evidence appears in UCDP Events, CII, or related panels rather than as a conflict-zone polygon.',
    ],
    related: ['UCDP Events', 'CII panel', 'Strategic Risk', 'Country brief'],
    evidence: ['docs/data-sources.mdx', 'docs/architecture.mdx', 'src/config/geo.ts'],
  },
  ucdpEvents: {
    key: 'ucdpEvents',
    coverage: 'curated',
    category: 'Conflict',
    purpose: 'Plots event-level armed conflict records with country, actors, date, and fatality ranges.',
    source: 'Uppsala Conflict Data Program GED API via the conflict service and UCDP event seed.',
    freshness: 'Seeded every 6 hours when the UCDP seed is healthy.',
    confidence: 'Higher editorial consistency than raw breaking feeds, but intentionally lagging and not a live battlefield feed.',
    limitations: [
      'Annual/research-grade release cadence can miss very recent events.',
      'Fatality ranges are estimates and should be interpreted as ranges, not exact counts.',
    ],
    related: ['UCDP Events panel', 'CII conflict component', 'Country timeline'],
    evidence: ['docs/architecture.mdx', 'src/services/conflict/index.ts', 'scripts/seed-ucdp-events.mjs'],
  },
  ciiChoropleth: {
    key: 'ciiChoropleth',
    coverage: 'curated',
    category: 'Country Risk',
    purpose: 'Colors countries by the current Country Instability Index score for broad strategic-risk triage.',
    source: 'WorldMonitor CII scoring service using conflict, unrest, advisories, cyber, AIS, aviation, natural-event, and news signals.',
    freshness: 'Risk-score cache is warm-pinged every 8 minutes; seed-meta and health.riskScores expose live, stale, partial, or degraded state against a 30-minute freshness budget.',
    confidence: 'Composite model signal, not an official country rating or probability forecast.',
    limitations: [
      'Sparse or degraded source families can reduce confidence even when a country still has a score.',
      'Country-level color can hide subnational variation and should be checked against panels before citation.',
    ],
    related: ['CII panel', 'Strategic Risk panel', 'Data freshness status', 'Country brief'],
    evidence: ['docs/strategic-risk.mdx', 'docs/architecture.mdx', 'src/services/cached-risk-scores.ts'],
  },
  natural: {
    key: 'natural',
    coverage: 'curated',
    category: 'Natural Disasters',
    purpose: 'Shows earthquakes, severe disaster alerts, and active Earth-observation events for situational awareness.',
    source: 'USGS earthquakes, GDACS alerts, and NASA EONET events merged into the natural events service.',
    freshness: 'Natural events are seeded every 3 hours; USGS earthquake expectations are documented at roughly 5-minute source cadence.',
    confidence: 'Strong for detected public disaster signals; confidence varies by hazard type and upstream reporting latency.',
    limitations: [
      'Low-severity GDACS alerts are filtered out to keep the map readable.',
      'EONET wildfires are freshness-filtered, so older open events may not appear as active map points.',
    ],
    related: ['Natural Events layer popups', 'Severe Weather Alerts (NWS, ECCC, WMO SWIC)', 'Country brief natural signals'],
    evidence: ['docs/data-sources.mdx', 'docs/architecture.mdx', 'server/worldmonitor/natural/v1/list-natural-events.ts'],
  },
  weather: {
    key: 'weather',
    coverage: 'curated',
    category: 'Weather',
    purpose: 'Shows active official severe-weather alerts from national meteorological services, merged into one weather:alerts:v1 feed.',
    source: 'United States National Weather Service (NWS), Environment and Climate Change Canada (ECCC), and WMO Severe Weather Information Centre (SWIC) CAP aggregation, seeded through the WorldMonitor relay.',
    freshness: 'NWS, ECCC, and SWIC alerts are seeded every 15 minutes by the relay and monitored against a 45-minute freshness budget.',
    confidence: 'Authoritative for alerts issued by the contributing national services, subject to upstream publication timing. NWS and ECCC render as polygons; SWIC geocoded alerts render at the issuing service country centroid with an explicit precision marker.',
    limitations: [
      'Most SWIC members publish geocodes, not polygons; those alerts appear as country-level points with the verbatim area description, not warned-area overlays.',
      'SWIC coverage depends on which WMO members currently publish to the aggregator; density varies by region.',
      'US and Canadian SWIC rows are skipped because NWS and ECCC already supply polygon-tier coverage for those countries.',
    ],
    related: ['Natural Events layer', 'Weather alert popups', 'Data freshness status'],
    evidence: ['scripts/ais-relay.cjs', 'scripts/_weather-alert-select.mjs', 'api/health.js', 'src/services/weather.ts'],
  },
  ais: {
    key: 'ais',
    coverage: 'curated',
    category: 'Maritime',
    purpose: 'Shows vessel density and AIS disruption signals around strategic waters and chokepoints.',
    source: 'AISStream relay snapshots, WorldMonitor maritime service, and chokepoint disruption classifiers.',
    freshness: 'AIS relay snapshots are rebuilt every 5 seconds by default; the server may cache the base density snapshot for 5 minutes, and the layer is disabled or stale when relay credentials/connectivity are unavailable.',
    confidence: 'Useful for maritime anomaly screening, but AIS is self-reported and vessels can go dark.',
    limitations: [
      'Terrestrial AIS coverage is uneven, with weaker Middle East, Asia, and open-ocean visibility documented.',
      'Dark shipping is inferred from gaps and congestion patterns, not direct proof of intent.',
    ],
    related: ['Supply Chain panel', 'Chokepoint strip', 'Military vessels', 'Country brief AIS signals'],
    evidence: ['docs/features.mdx', 'docs/architecture.mdx', 'src/services/maritime/index.ts', 'scripts/ais-relay.cjs'],
  },
  waterways: {
    key: 'waterways',
    coverage: 'curated',
    category: 'Maritime',
    purpose: 'Marks strategic waterways and chokepoints so disruption signals can be interpreted against fixed maritime geography.',
    source: 'WorldMonitor strategic-waterways registry with supply-chain chokepoint status overlays from AIS, NGA warnings, and PortWatch-derived feeds.',
    freshness: 'Waterway locations are static; live chokepoint status is warm-pinged every 30 minutes and transit summaries refresh every 10 minutes when the relay/PortWatch path is healthy.',
    confidence: 'High for fixed geography; live disruption confidence depends on the companion AIS, NGA, and PortWatch feeds.',
    limitations: [
      'A visible chokepoint marker does not mean there is an active disruption.',
      'Area geofences and modeled routes can simplify complex traffic patterns.',
    ],
    related: ['Supply Chain panel', 'Trade Routes layer', 'Route Explorer', 'Scenario Engine'],
    evidence: ['docs/architecture.mdx', 'docs/data-sources.mdx', 'src/config/geo.ts', 'server/worldmonitor/supply-chain/v1/get-chokepoint-status.ts'],
  },
  tradeRoutes: {
    key: 'tradeRoutes',
    coverage: 'curated',
    category: 'Maritime',
    purpose: 'Draws major container, energy, and bulk routes through strategic chokepoints for disruption-path reasoning.',
    source: 'WorldMonitor trade-route registry plus supply-chain chokepoint status and transit summaries.',
    freshness: 'Route geometry is static. Chokepoint status is warm-pinged every 30 minutes and transit summaries refresh every 10 minutes through supply-chain caches and relay paths.',
    confidence: 'Good for route-level exposure context; not a ship-level routing feed.',
    limitations: [
      'Routes are modeled corridors and may not match a specific voyage plan.',
      'Disruption overlays depend on current chokepoint and AIS health.',
    ],
    related: ['Supply Chain panel', 'Route Explorer', 'Scenario Engine', 'Waterways layer'],
    evidence: ['docs/data-sources.mdx', 'docs/architecture.mdx', 'src/config/trade-routes.ts', 'src/services/supply-chain/index.ts'],
  },
  cyberThreats: {
    key: 'cyberThreats',
    coverage: 'curated',
    category: 'Cyber',
    purpose: 'Maps geo-enriched indicators of compromise such as C2 servers, malware hosts, phishing, malicious URLs, and ransomware infrastructure.',
    source: 'abuse.ch Feodo Tracker and URLhaus, C2IntelFeeds, AlienVault OTX, AbuseIPDB, ransomware.live RSS/news feed, and IP geolocation enrichment.',
    freshness: 'Cyber threat seeds run every 2 hours; displayed IOCs use a 14-day rolling window and are capped for map performance.',
    confidence: 'Good for infrastructure visibility, but attribution and IP geolocation can be noisy.',
    limitations: [
      'IP geolocation can point to hosting infrastructure rather than an operator or victim.',
      'Feed availability, API keys, and per-feed abuse reports can bias coverage.',
    ],
    related: ['Cyber Threats map popups', 'CII cyber supplemental boost', 'Data freshness status'],
    evidence: ['docs/data-sources.mdx', 'docs/architecture.mdx', 'scripts/seed-cyber-threats.mjs', 'server/worldmonitor/cyber/v1/list-cyber-threats.ts'],
  },
  hotspots: {
    key: 'hotspots',
    coverage: 'curated',
    category: 'News / Hotspots',
    purpose: 'Highlights monitored geopolitical hotspots and raises their level when related news and escalation signals converge.',
    source: 'WorldMonitor hotspot registry, RSS/GDELT news intelligence, hotspot escalation scoring, military activity, and CII context.',
    freshness: 'Hotspot locations are curated/static. News feeds are freshness-tracked separately; live-news RSS cache expectations are around 5 minutes, while GDELT intelligence has longer seeded/cache budgets.',
    confidence: 'Useful as a triage cue, not a citation-grade claim without opening the underlying news and country context.',
    limitations: [
      'News volume and keyword matching can overrepresent highly covered regions.',
      'Low-profile events may be missed when RSS/GDELT coverage is sparse or delayed.',
    ],
    related: ['Live News panel', 'Strategic Risk panel', 'Country brief', 'Hotspot popups'],
    evidence: ['docs/data-sources.mdx', 'docs/architecture.mdx', 'src/config/geo.ts', 'src/services/hotspot-escalation.ts'],
  },
};

const VARIANT_LAYER_ORDER: Record<MapVariant, MapLayerKey[]> = {
  full: [
    'hotspots', 'conflicts', 'bases', 'nuclear', 'radiationWatch',
    'cables', 'pipelines', 'fuelShortages', 'datacenters', 'military',
    'ais', 'liveTankers', 'tradeRoutes', 'protests',
    'ucdpEvents', 'displacement', 'climate', 'weather',
    'outages', 'cyberThreats', 'natural', 'fires',
    'waterways', 'gpsJamming', 'satellites', 'ciiChoropleth', 'sanctions',
    'diseaseOutbreaks',
  ],
  tech: [
    'datacenters', 'cables', 'outages', 'cyberThreats', 'natural', 'fires',
  ],
  finance: [
    'tradeRoutes', 'cables', 'pipelines', 'outages', 'weather', 'waterways',
    'natural', 'cyberThreats', 'sanctions',
  ],
  happy: ['natural'],
  commodity: [
    'pipelines', 'waterways', 'tradeRoutes', 'ais', 'fires', 'climate',
    'natural', 'weather', 'outages', 'sanctions',
  ],
  energy: [
    'pipelines', 'fuelShortages', 'waterways', 'ais', 'liveTankers', 'tradeRoutes',
    'sanctions', 'fires', 'climate', 'weather', 'outages', 'natural',
  ],
};

const I18N_PREFIX = 'components.deckgl.layers.';

export function getLayersForVariant(variant: MapVariant, kind: RendererKind): LayerDefinition[] {
  const keys = VARIANT_LAYER_ORDER[variant] ?? VARIANT_LAYER_ORDER.full;
  return keys
    .map(k => LAYER_REGISTRY[k])
    .filter((definition): definition is LayerDefinition => Boolean(definition))
    .filter(d => d.renderers.includes(kind));
}

export function getAllowedLayerKeys(variant: MapVariant): Set<keyof MapLayers> {
  return new Set(VARIANT_LAYER_ORDER[variant] ?? VARIANT_LAYER_ORDER.full);
}

export function sanitizeLayersForVariant(layers: MapLayers, variant: MapVariant): MapLayers {
  const allowed = getAllowedLayerKeys(variant);
  const sanitized = { ...layers };
  for (const key of Object.keys(sanitized) as Array<keyof MapLayers>) {
    if (!allowed.has(key)) sanitized[key] = false;
  }
  return sanitized;
}

/**
 * Checks whether a layer can actually render under the active renderer. Used
 * by both the layer picker UI and the CMD+K dispatcher to hide / silently-skip
 * toggles that would be a no-op.
 *
 * The layer's declared `renderers` must include `kind`. Because the axis now
 * distinguishes `'svg'` from `'deck'`, a DeckGL-only layer (`['deck']`) is
 * naturally rejected on the SVG fallback and on the globe — no separate flag.
 */
export function isLayerExecutable(
  layerKey: keyof MapLayers,
  kind: RendererKind,
): boolean {
  const def = LAYER_REGISTRY[layerKey as MapLayerKey];
  if (!def) return false;
  return def.renderers.includes(kind);
}

/** Map access is mission-based, never subscription-based. */
export function isLayerEntitled(
  layerKey: keyof MapLayers,
  _hasPremium?: boolean,
): boolean {
  return Object.prototype.hasOwnProperty.call(LAYER_REGISTRY, layerKey);
}

export function isLayerToggleAllowed(
  layerKey: keyof MapLayers,
  _currentlyEnabled?: boolean,
  _hasPremium?: boolean,
): boolean {
  return Object.prototype.hasOwnProperty.call(LAYER_REGISTRY, layerKey);
}

export function isLayerCommandAllowed(
  layerKey: keyof MapLayers,
  _currentlyEnabled: boolean | undefined,
  kind: RendererKind,
  _hasPremium?: boolean,
): boolean {
  return isLayerExecutable(layerKey, kind);
}

/** @deprecated Map layers no longer have subscription gates. */
export function shouldSanitizeLockedLayers(
  _hasPremium: boolean,
  _tierResolved: boolean,
  _fallbackActive = false,
): boolean {
  return false;
}

/** @deprecated Map layers no longer have subscription gates. */
export function sanitizeLockedLayers(
  layers: MapLayers,
  _hasPremium: boolean,
): MapLayers {
  return layers;
}

export interface LockedLayerOwnershipResult {
  layers: MapLayers;
  gateOwned: Set<string>;
}

export function mapLayerStatesEqual(a: MapLayers, b: MapLayers): boolean {
  const keys = Object.keys(a) as Array<keyof MapLayers>;
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}

/**
 * Sanitize locked layers while remembering which enabled preferences the
 * free-tier gate forced off. Existing ownership is retained across idempotent
 * reconciliation passes where the persisted layer is already false.
 */
export function sanitizeLockedLayersWithOwnership(
  layers: MapLayers,
  _existingGateOwned: ReadonlySet<string>,
): LockedLayerOwnershipResult {
  return {
    layers,
    gateOwned: new Set(),
  };
}

/** @deprecated Map layers no longer have subscription gates. */
export function restoreGateOwnedLockedLayers(
  layers: MapLayers,
  _gateOwned: ReadonlySet<string>,
): MapLayers {
  return layers;
}

export const LAYER_SYNONYMS: Record<string, Array<keyof MapLayers>> = {
  ship: ['ais', 'tradeRoutes'],
  vessel: ['ais'],
  maritime: ['ais', 'waterways', 'tradeRoutes'],
  sea: ['ais', 'waterways', 'cables'],
  ocean: ['cables', 'waterways'],
  war: ['conflicts', 'ucdpEvents', 'military'],
  battle: ['conflicts', 'ucdpEvents'],
  army: ['military', 'bases'],
  navy: ['military', 'ais'],
  missile: ['military'],
  nuke: ['nuclear'],
  radiation: ['radiationWatch', 'nuclear'],
  radnet: ['radiationWatch'],
  safecast: ['radiationWatch'],
  anomaly: ['radiationWatch', 'climate'],
  space: ['satellites'],
  orbit: ['satellites'],
  internet: ['outages', 'cables', 'cyberThreats'],
  cyber: ['cyberThreats', 'outages'],
  hack: ['cyberThreats'],
  earthquake: ['natural'],
  volcano: ['natural'],
  tsunami: ['natural'],
  storm: ['weather', 'natural'],
  hurricane: ['weather', 'natural'],
  typhoon: ['weather', 'natural'],
  cyclone: ['weather', 'natural'],
  flood: ['weather', 'natural'],
  wildfire: ['fires'],
  forest: ['fires'],
  refugee: ['displacement'],
  migration: ['displacement'],
  riot: ['protests'],
  demonstration: ['protests'],
  oil: ['pipelines', 'fuelShortages', 'liveTankers'],
  gas: ['pipelines'],
  energy: ['pipelines', 'fuelShortages'],
  trade: ['tradeRoutes', 'waterways'],
  cloud: ['datacenters'],
  ai: ['datacenters'],
  tech: ['datacenters', 'cyberThreats', 'satellites'],
  gps: ['gpsJamming'],
  jamming: ['gpsJamming'],
  sanction: ['sanctions'],
  disease: ['diseaseOutbreaks'],
  outbreak: ['diseaseOutbreaks'],
  fuel: ['fuelShortages'],
  tanker: ['liveTankers'],
};

export function resolveLayerLabel(def: LayerDefinition, tFn?: (key: string) => string): string {
  if (tFn) {
    const translated = tFn(I18N_PREFIX + def.i18nSuffix);
    if (translated && translated !== I18N_PREFIX + def.i18nSuffix) return translated;
  }
  return def.fallbackLabel;
}

export function hasCuratedLayerExplanation(layerKey: keyof MapLayers): boolean {
  return LAYER_EXPLANATIONS[layerKey]?.coverage === 'curated';
}

export function getLayerExplanation(layerKey: keyof MapLayers): LayerExplanation {
  const curated = LAYER_EXPLANATIONS[layerKey];
  if (curated) return curated;

  return {
    key: layerKey,
    coverage: 'fallback',
    category: 'Layer',
    purpose: 'This layer can be toggled on the map, but a curated source and confidence card has not been added yet.',
    source: 'Not curated in the v1 layer-explainability set.',
    freshness: 'No layer-level freshness contract is declared here. Check the visible panel badges, popups, or data freshness status when available.',
    confidence: 'Unknown until source-specific metadata is added.',
    limitations: [
      'The lack of a curated card does not mean the layer is unsupported.',
      'Use layer popups and related panels for source-specific context.',
    ],
    related: ['Layer guide'],
    evidence: [],
  };
}

export function bindLayerSearch(container: HTMLElement): void {
  const searchInput = container.querySelector('.layer-search') as HTMLInputElement | null;
  if (!searchInput) return;
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    const synonymHits = new Set<string>();
    if (q) {
      for (const [alias, keys] of Object.entries(LAYER_SYNONYMS)) {
        if (alias.includes(q)) keys.forEach(k => synonymHits.add(k));
      }
    }
    container.querySelectorAll('.layer-toggle').forEach(label => {
      const el = label as HTMLElement;
      if (el.hasAttribute('data-layer-hidden')) return;
      const row = el.closest('.layer-toggle-row') as HTMLElement | null;
      const displayTarget = row ?? el;
      if (!q) { displayTarget.style.display = ''; return; }
      const key = label.getAttribute('data-layer') || '';
      const text = label.textContent?.toLowerCase() || '';
      const match = text.includes(q) || key.toLowerCase().includes(q) || synonymHits.has(key);
      displayTarget.style.display = match ? '' : 'none';
    });
  });
}

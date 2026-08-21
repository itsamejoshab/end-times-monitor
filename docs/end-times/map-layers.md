# End Times Monitor map layers

The map is an evidence index for the monitoring domains in
[`product-vision.md`](product-vision.md). A dataset does not receive a map
toggle merely because it is available.

## Active inventory

The authoritative inventory and renderer support live in
`src/config/map-layer-definitions.ts`.

- Current evidence: hotspots, conflicts, military activity, protests, UCDP
  events, displacement, natural events, fires, severe weather, outages, cyber
  threats, disease outbreaks, radiation observations, and fuel shortages.
- Strategic context: military bases, nuclear sites, cables, pipelines, AI data
  centers, AIS vessels, live tankers, trade routes, strategic waterways, GPS
  interference, satellites, sanctions, and climate anomalies.
- Temporary supporting signal: CII instability. CII is not the product's
  deterministic convergence level and should be retired when that layer ships.

All layers are available without a World Monitor subscription or account.
Most remain opt-in so the default map emphasizes a small current-evidence set.

## Removed map surfaces

Inherited regional, decorative, finance, tech, happy-news, webcam, resilience,
static-inventory, commodity-site, and civilian-flight toggles are not part of
the active inventory. Saved preferences containing those historical keys are
accepted only for migration and sanitized off before rendering.

The removal of a map toggle does not by itself remove an underlying dataset
that still has a justified, cited consumer in an event popup, country brief,
panel, supply-chain analysis, or deterministic convergence input.

## Provider credentials

Keep provider credentials server-side in `.env` or the deployment secret
store. Never expose them through `VITE_*` variables.

Obtain these free credentials first:

- `UCDP_ACCESS_TOKEN` for armed-conflict events.
- `AISSTREAM_API_KEY` for AIS and live tanker positions.
- `NASA_FIRMS_API_KEY` for fire detections.
- `CLOUDFLARE_API_TOKEN` for Radar outage data. Cloudflare Radar data is
  licensed CC BY-NC 4.0; review that non-commercial restriction before any
  public or commercial deployment.

Review access and redistribution terms before relying on ACLED. Keep UCDP and
GDELT fallbacks until an eligible myACLED account and intended use are
approved. Add `OTX_API_KEY`, `ABUSEIPDB_API_KEY`, and `URLHAUS_AUTH_KEY` only
after the cyber feeds' public-use terms are approved.

Do not obtain `WORLDMONITOR_API_KEY` to unlock map layers. Do not initially
purchase AviationStack or Wingbits access; civilian aviation is not an active
map layer, and military tracking retains its reviewed no-key primary source.

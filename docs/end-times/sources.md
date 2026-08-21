# End Times source registry

## Status

This registry records the owner-reviewed initial RSS selection for End Times
Monitor. It supplements the reliability metadata in
`shared/source-provenance.ts`; it does not turn any publisher into a doctrinal
authority.

The application uses these feeds to discover recent reported events. Source
reliability and agreement with the product's amillennial framework are separate
questions. Headlines remain attributed and linked to their publisher. Feed
registration does not grant republication rights, so public deployment requires
completion of the terms review in `shared/source-attribution-manifest.json`.

## Included feeds

- **Protestia** — `https://protestia.substack.com/feed`
  - Purpose: church controversies, institutional changes, and social issues.
  - Perspective: conservative evangelical polemics; reporting and commentary
    are mixed.
  - Use: discovery and source-attributed claims only. Labels such as apostasy or
    false teaching still require owner-approved criteria and cited evidence.
- **New York Times Terrorism** —
  `https://www.nytimes.com/svc/collections/v1/publish/https://www.nytimes.com/topic/subject/terrorism/rss.xml`
  - Purpose: established-news coverage of terrorism, prosecution, and related
    international events.
  - Perspective: mainstream U.S. newspaper with a center-left editorial
    reputation.
  - Use: event reporting and corroboration. Opinion-section entries are removed
    from the event-driven daily brief by the shared opinion classifier.
- **End Time Headlines** — `https://endtimeheadlines.org/feed/`
  - Purpose: discovery of recent events selected for an end-times audience.
  - Perspective: charismatic and dispensational; reporting and opinion are
    mixed.
  - Use: source-attributed discovery only. Explicit opinion entries do not enter
    the event-driven daily brief.
- **Rapture Ready** — `https://www.raptureready.com/feed/`
  - Purpose: daily roundup of links to current external reporting.
  - Perspective: pre-tribulation dispensational and therefore in direct
    disagreement with the product's no-secret-rapture framework.
  - Use: the parser exposes the linked event stories rather than the dated
    wrapper. Rapture Ready does not inform doctrine, prophetic fulfillment,
    convergence scoring, or date-setting.

## Initial exclusions

- **End Times Forecaster** — excluded because date-setting and speculative
  forecasting conflict with a non-negotiable product boundary.
- **Gatestone Institute** — excluded because the supplied endpoint is not a
  working official RSS feed and the publication is primarily policy commentary.
  A Google News proxy was not substituted.
- **End Times Truth** — excluded from the live pack because publishing is
  infrequent and primarily interpretive.
- **End Time Bible Prophecy** — excluded because it is primarily prophecy
  commentary rather than a current event feed.
- **Amillennial.org** — excluded from the event stream because it is primarily
  theological teaching and video commentary. Doctrinal alignment does not make
  commentary an event source.
- **Eschatology Today** — excluded because it mixes event references with
  prophetic interpretation and long-range prediction.

These exclusions can be revisited through owner review if a source launches a
stable, event-reporting RSS surface.

## Deferred taxonomy work

The proposed church apostasy, transgenderism, abortion, secularism, Islam,
persecution, and moral-collapse keyword groups are not activated by this feed
integration. Feed-panel categories, event-classification categories, and
theological interpretation remain separate until the deterministic taxonomy is
reviewed.

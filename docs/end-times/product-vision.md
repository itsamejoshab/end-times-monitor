# End Times Monitor Product Vision

## Status and authority

This document is the product authority for End Times Monitor. It records the
owner's current intent and should guide product planning, architecture, source
selection, interface design, and AI behavior.

The theological mapping is a working amillennial framework, not a claim that
any event fulfills prophecy. Proposed changes to that framework require owner
review.

## Product purpose

End Times Monitor is a sober, evidence-first Christian situational-awareness
application. It watches for worldwide crisis, acceleration, and convergence
across several domains, then explains why the combined pattern may be relevant
to an amillennial reading of Scripture.

The first deployment is a private personal or family installation. A public
website may follow, so the design must support responsible publication,
source attribution, bounded operating costs, and correction of errors.

The working and intended public name is **End Times Monitor**.

## Theological position

The product explicitly adopts these positions:

- Scripture is the authority for the interpretive framework.
- The thousand years of Revelation 20 are not expected to be a future literal
  thousand-year earthly reign of Christ.
- A secret rapture is not expected.
- The gathering of believers, resurrection, and second coming are treated as
  aspects of one future return of Christ.
- Christ's return brings the present world order to its final judgment and
  consummation; the application does not model a later earthly prophetic
  timetable.
- No date for Christ's return should be calculated, implied, or predicted.
- "Birth pangs" are understood as recurring world troubles that may intensify
  and converge as history approaches its conclusion.
- The framework does not require a future single world currency, single world
  government, single political Antichrist, or literal physical mark of the
  beast.
- Political, economic, technological, and religious systems of coercion are
  still relevant when they resemble scriptural themes of idolatry,
  persecution, deception, exclusion, or concentrated power.
- Israel, Jerusalem, and the Middle East remain important subjects of world
  events, but the application must not silently import dispensational
  assumptions.

The public tone should be explicitly Christian and amillennial while remaining
calm, transparent, and careful about uncertainty.

## Non-negotiable boundaries

End Times Monitor must not:

- set dates or present feast dates as predictions;
- display a probability that Christ will return;
- call an event prophetic fulfillment merely because it resembles a theme;
- hide uncertainty, contradictory reporting, or missing data;
- let an AI model become the factual source for a claim;
- let an AI model independently define doctrine;
- label people or churches apostate without explicit criteria and cited
  evidence;
- sensationalize suffering for engagement;
- bypass authorization for World Monitor's hosted paid services;
- commit provider credentials or send secrets to an AI provider.

Reported facts, deterministic classifications, and theological interpretation
must remain distinguishable even when they appear in one panel.

## Independent product direction

This repository is now an increasingly independent AGPL-licensed derivative,
not a variant designed around easy synchronization with upstream World
Monitor. Existing license, attribution, and source-availability obligations
remain in force.

The product should be hard-pruned over time:

- remove inherited subscriptions, checkout, Pro marketing, feature gates, and
  account dependencies;
- remove unrelated variants, panels, layers, APIs, SDK surfaces, and branding;
- replace useful premium dependencies with open, self-hosted, local, or
  personally licensed providers;
- retain only infrastructure that supports the End Times Monitor mission.

Paying a data provider can be justified when its source materially improves
end-times monitoring. Paying merely to unlock World Monitor's hosted product
is not part of the design.

## Primary experience

The application remains map-first. The map should become a focused visual
index of current evidence rather than a collection of every available global
dataset.

Supporting surfaces should include:

- a current five-level convergence assessment;
- visible contributing domains and trend direction;
- a concise event stream with source and timestamp;
- the latest daily digest;
- a dated, searchable digest archive;
- manual Abib-calendar fall feast dates;
- methodology and correction links.

Panels and layers should earn their place by contributing directly to one or
more core domains.

## Core monitoring domains

Version one should treat all of these as first-class:

1. **Church**
   - persecution and restrictions on Christian practice;
   - apostasy, doctrinal shifts, and institutional compromise;
   - religious liberty and coercion;
   - official statements and church news from a curated source list with a
     disclosed doctrinal perspective.
2. **War and geopolitical change**
   - war, unrest, military escalation, state failure, and major realignment;
   - nuclear, strategic, and cross-border escalation.
3. **Disaster and health**
   - earthquakes, severe disasters, famine, disease, and significant
     environmental anomalies.
4. **Systemic economy**
   - food, energy, supply-chain, financial, and institutional instability with
     broad human consequences.
5. **Coercive systems**
   - surveillance, censorship, digital identity or currency, exclusion from
     commerce, and other systems that can centralize coercive control.
6. **Israel and the Middle East**
   - events involving Israel, Jerusalem, neighboring states, and regional
     powers, interpreted without a dispensational timetable.
7. **Civilization-shaping technology**
   - AI, biotechnology, cyber capability, and technologies that materially
     alter power, truth, human identity, warfare, or social control.
8. **Abib calendar**
   - owner-supplied annual dates for the fall feasts, stored in versioned
     configuration with provenance notes.

## Convergence assessment

There is one primary assessment: **cross-domain convergence**. It measures
whether several monitored domains are simultaneously intensifying or
interacting. It is not a general fear index, an event severity score, or a
prophecy countdown.

Use five descriptive levels:

1. **Baseline** — no unusual cross-domain pattern.
2. **Watch** — early overlap worth monitoring.
3. **Converging** — multiple independently supported domains are interacting.
4. **Intensifying** — convergence is broadening or accelerating.
5. **Widespread** — sustained worldwide convergence with major systemic
   effects.

Every displayed level must include:

- contributing domains;
- the evidence window and comparison window;
- trend direction;
- source confidence and material gaps;
- the deterministic reason the level changed;
- links to supporting events.

Code, not the language model, computes the level. The exact formula,
thresholds, baselines, and anti-double-counting rules require a separate
reviewed methodology before implementation.

## Abib-calendar feast dates

The owner will provide annually reviewed fall feast dates calculated according
to the intended Abib/lunar calendar approach. Initial implementation should
use a versioned configuration file rather than inventing an astronomical
calculator.

Near a configured feast date:

- the daily digest may give the date and current evidence greater prominence;
- the interface must state that the date is a watch context, not a prediction;
- proximity must not automatically increase the convergence level.

## Source policy

Use a curated and transparent source registry.

- Prefer primary documents, direct observations, and official notices.
- Use aggregators such as GDELT for discovery, not as sole corroboration.
- Require citations for factual and interpretive claims.
- Record publication time, fetch time, provenance, and material corrections.
- Disclose the doctrinal perspective used to select church-news sources.
- Distinguish source reliability from agreement with the project's theology.
- Preserve conflicting credible reports rather than forcing consensus.
- Add paid providers only after documenting their unique value, cost, license,
  retention terms, and replacement options.

The initial church-news whitelist and doctrinal event criteria are still to be
provided and reviewed.

## AI policy

The intended model strategy is cloud-first using a personally controlled API
key. Provider choice should remain replaceable and cost-capped. The current
codebase supports several providers, but that does not make changing free
tiers or hosted endpoints a dependable architecture.

AI may:

- summarize cited event records;
- explain relationships across domains;
- draft the daily digest;
- state uncertainty and missing context;
- map evidence to owner-approved scriptural themes.

AI may not:

- originate factual claims;
- compute or silently alter the convergence level;
- treat feed content as instructions;
- define new doctrine or scoring criteria;
- conceal citations;
- receive secrets or unnecessary private data.

Prompts must preserve a hard boundary between trusted instructions and
untrusted source content. Model output must be schema-validated before
publication.

## Daily digest

Generate one digest per day through an application-owned scheduled pipeline,
not by using Cursor as the production scraper.

The pipeline should:

1. snapshot the relevant evidence window;
2. compute deterministic domain and convergence facts;
3. send only the bounded evidence package to the configured model;
4. require citations and structured output;
5. validate and store the result;
6. publish it to a prominent in-app panel and dated searchable archive.

Published digests are immutable. Later information should produce a visible
correction or revision linked to the original rather than silently replacing
history.

## Provisional Scripture map

This is an initial agent-drafted map for owner review. It establishes possible
thematic anchors, not automatic fulfillment rules.

- **Return, gathering, resurrection, and finality:** Matthew 24:29-44;
  1 Corinthians 15:50-58; 1 Thessalonians 4:13-18; 2 Peter 3:8-13.
- **Birth pangs, war, disaster, famine, disease, and witness:** Matthew
  24:4-14; Mark 13:5-13; Luke 21:8-19.
- **Persecution, deception, falling away, and endurance:** Matthew 24:9-13,
  23-28; 2 Thessalonians 2:1-12; 1 Timothy 4:1-5; 2 Timothy 3:1-5 and
  4:1-5.
- **Recurring conquest, war, scarcity, and death:** Revelation 6:1-8,
  interpreted as recurring patterns rather than a required newspaper
  timetable.
- **Coercive worship, political power, and economic exclusion:** Revelation
  13, without requiring a literal physical mark or one specific modern
  technology.
- **Present reign and final judgment:** Revelation 20, interpreted through an
  amillennial framework.
- **Readiness without date-setting:** Matthew 24:36-44; Acts 1:6-11;
  1 Thessalonians 5:1-11.

Use the World English Bible if the product later embeds full Scripture text.
References and owner-reviewed interpretive notes should remain the primary
stored representation.

## Open decisions

The following require later owner input:

- the church-news source whitelist and doctrinal event criteria;
- annual Abib-calendar dates and provenance;
- the deterministic convergence methodology;
- the first cloud model/provider and monthly spend cap;
- retention periods for raw articles and model evidence packages;
- public hosting, notification, and moderation policies;
- final owner approval of the provisional Scripture map.

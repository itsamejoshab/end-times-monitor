import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractRaptureReadyRoundupItems,
  extractTrackingBibleProphecyRoundupItems,
} from '../shared/roundup-feed-parser.js';
import { __testing__ } from '../server/worldmonitor/news/v1/list-feed-digest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const browserRssSource = readFileSync(resolve(__dirname, '../src/services/rss.ts'), 'utf8');

const ROUNDUP_HTML = `
  <p><a href="https://www.reuters.com/world/example?ref=rr">Iran &amp; allies hold talks</a><br />
  Officials met Tuesday to discuss a new agreement.</p>
  <p><a href="javascript:alert(1)">Unsafe link</a><br />Never include this.</p>
  <p><a href="https://www.raptureready.com/internal-story/">Internal wrapper</a><br />Skip it.</p>
  <p><a href="https://example.org/disaster">Storm damages <strong>hundreds</strong> of homes</a><br />
  Emergency crews reported widespread damage.</p>
  <p><a href="https://www.reuters.com/world/example?ref=rr">Duplicate link</a><br />Skip it.</p>
  <p><a href="https://example.net/third">Third valid story</a><br />Cap this when requested.</p>
`;

const TRACKING_BIBLE_PROPHECY_HTML = `
  <div class="paragraph"><ul>
    <li>&#8203;<a href="https://www.reuters.com/world/example?ref=tbp">Iran &amp; allies hold talks</a></li>
    <li><a href="javascript:alert(1)">Unsafe link</a></li>
    <li><a href="https://www.prophecyupdate.com/internal-story/">Transport wrapper</a></li>
    <li><a href="https://trackingbibleprophecy.org/internal-story/">Curator wrapper</a></li>
    <li><a href="https://example.org/disaster">Storm damages <strong>hundreds</strong> of homes</a>
      — Emergency crews reported widespread damage.</li>
    <li><a href="https://www.reuters.com/world/example?ref=tbp">Duplicate link</a></li>
    <li><a href="https://example.net/third">Third valid story</a></li>
  </ul></div>
`;

describe('Rapture Ready roundup parser', () => {
  it('extracts external linked stories, cleans text, and rejects unsafe or duplicate links', () => {
    const items = extractRaptureReadyRoundupItems(ROUNDUP_HTML, { maxItems: 5 });

    assert.deepEqual(items.map(({ title }) => title), [
      'Iran & allies hold talks',
      'Storm damages hundreds of homes',
      'Third valid story',
    ]);
    assert.equal(items[0]?.description, 'Officials met Tuesday to discuss a new agreement.');
    assert.ok(items.every(({ link }) => /^https?:\/\//.test(link)));
  });

  it('enforces the configured item cap', () => {
    const items = extractRaptureReadyRoundupItems(ROUNDUP_HTML, { maxItems: 2 });
    assert.equal(items.length, 2);
  });

  it('wires the same parser into the browser RSS path', () => {
    assert.match(browserRssSource, /feed\.roundupMode === 'rapture-ready'/);
    assert.match(browserRssSource, /extractRaptureReadyRoundupItems\(encoded, \{ maxItems: 5 \}\)/);
  });

  it('expands configured server feed items instead of returning the date wrapper', () => {
    const published = new Date(Date.now() - 60_000).toUTCString();
    const xml = `<?xml version="1.0"?>
      <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
        <channel>
          <item>
            <title>21 Aug 2026</title>
            <link>https://www.raptureready.com/2026/08/21/21-aug-2026/</link>
            <pubDate>${published}</pubDate>
            <category><![CDATA[Rapture Ready End Times News]]></category>
            <content:encoded><![CDATA[${ROUNDUP_HTML}]]></content:encoded>
          </item>
        </channel>
      </rss>`;

    const result = __testing__.parseRssXml(
      xml,
      {
        name: 'Rapture Ready',
        url: 'https://www.raptureready.com/feed/',
        roundupMode: 'rapture-ready',
      },
      'full',
    );

    assert.ok(result);
    assert.equal(result.items.length, 3);
    assert.equal(result.items[0]?.source, 'Rapture Ready');
    assert.equal(result.items[0]?.title, 'Iran & allies hold talks');
    assert.equal(result.items.some(item => item.title === '21 Aug 2026'), false);
  });
});

describe('Tracking Bible Prophecy roundup parser', () => {
  it('extracts external linked stories and rejects unsafe, internal, or duplicate links', () => {
    const items = extractTrackingBibleProphecyRoundupItems(
      TRACKING_BIBLE_PROPHECY_HTML,
      { maxItems: 5 },
    );

    assert.deepEqual(items.map(({ title }) => title), [
      'Iran & allies hold talks',
      'Storm damages hundreds of homes',
      'Third valid story',
    ]);
    assert.equal(
      items[1]?.description,
      '— Emergency crews reported widespread damage.',
    );
    assert.ok(items.every(({ link }) => /^https?:\/\//.test(link)));
  });

  it('enforces the configured item cap', () => {
    const items = extractTrackingBibleProphecyRoundupItems(
      TRACKING_BIBLE_PROPHECY_HTML,
      { maxItems: 2 },
    );
    assert.equal(items.length, 2);
  });

  it('wires the parser into the browser RSS path', () => {
    assert.match(
      browserRssSource,
      /extractTrackingBibleProphecyRoundupItems\(encoded, \{ maxItems: 5 \}\)/,
    );
  });

  it('expands server feed items and attributes the curator, not the transport host', () => {
    const published = new Date(Date.now() - 60_000).toUTCString();
    const xml = `<?xml version="1.0"?>
      <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
        <channel>
          <item>
            <title>August 21st, 2026</title>
            <link>https://www.prophecyupdate.com/headlines/august-21st-2026</link>
            <pubDate>${published}</pubDate>
            <content:encoded><![CDATA[${TRACKING_BIBLE_PROPHECY_HTML}]]></content:encoded>
          </item>
        </channel>
      </rss>`;

    const result = __testing__.parseRssXml(
      xml,
      {
        name: 'Tracking Bible Prophecy',
        url: 'https://www.prophecyupdate.com/3/feed',
        roundupMode: 'tracking-bible-prophecy',
      },
      'full',
    );

    assert.ok(result);
    assert.equal(result.items.length, 3);
    assert.equal(result.items[0]?.source, 'Tracking Bible Prophecy');
    assert.equal(result.items[0]?.title, 'Iran & allies hold talks');
    assert.equal(
      result.items.some(item => item.title === 'August 21st, 2026'),
      false,
    );
  });
});

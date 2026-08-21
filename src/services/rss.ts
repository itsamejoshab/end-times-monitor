import type { Feed, NewsItem } from '@/types';
import { SITE_VARIANT } from '@/config';
import { chunkArray, fetchWithProxy, hasNoStoreCacheDirective, isMobileDevice } from '@/utils';
import { classifyByKeyword, classifyWithAI } from './threat-classifier';
import { inferGeoHubsFromTitle } from './geo-hub-index';
import { getPersistentCache, setPersistentCache } from './persistent-cache';
import { dataFreshness } from './data-freshness';
import { ingestHeadlines } from './trending-keywords';
import { getCurrentLanguage } from './i18n';
import { filterFeedsByLanguage } from './feed-language';
import { parseFeedDate, effectivePubDateMs } from './feed-date';
import { canQueueAiClassification, AI_CLASSIFY_MAX_PER_FEED } from './ai-classify-queue';
import { mlWorker } from './ml-worker';
import { isHeadlineMemoryEnabled } from './ai-flow-settings';
import { yieldToMain } from '@/utils/after-paint';
import { createYieldingWorkQueue } from '@/utils/yielding-work-queue';
import {
  extractRaptureReadyRoundupItems,
  extractTrackingBibleProphecyRoundupItems,
} from '../../shared/roundup-feed-parser.js';

const FEED_COOLDOWN_MS = 5 * 60 * 1000;
const MAX_FAILURES = 2;
const MAX_CACHE_ENTRIES = 100;
const FEED_SCOPE_SEPARATOR = '::';
const feedFailures = new Map<string, { count: number; cooldownUntil: number }>();
const feedCache = new Map<string, { items: NewsItem[]; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000;
const enqueueFeedParse = createYieldingWorkQueue(yieldToMain);

function parseFeedXml(text: string, isMobile: boolean): Promise<Document> {
  // Desktop keeps its established concurrent feed path. The queue is only a
  // mobile guard against several completed requests synchronously parsing XML
  // in the same post-hydration task. (#5165)
  if (!isMobile) return Promise.resolve(new DOMParser().parseFromString(text, 'text/xml'));
  return enqueueFeedParse(() => new DOMParser().parseFromString(text, 'text/xml'));
}

function toSerializable(items: NewsItem[]): Array<Omit<NewsItem, 'pubDate'> & { pubDate: string }> {
  return items.map(item => ({ ...item, pubDate: item.pubDate.toISOString() }));
}

function fromSerializable(items: Array<Omit<NewsItem, 'pubDate'> & { pubDate: string }>): NewsItem[] {
  return items.map(item => ({ ...item, pubDate: new Date(item.pubDate) }));
}

// v2 added pubDateMissing. Roundup parsing gets a source-local cache namespace
// so its date-wrapper rows are invalidated without cold-starting every feed.
const CACHE_PREFIX = 'feed:v2:';
const ROUNDUP_CACHE_PREFIX = 'feed:v2:roundup-v1:';

function getFeedScope(feedName: string, lang: string): string {
  return `${feedName}${FEED_SCOPE_SEPARATOR}${lang}`;
}

function parseFeedScope(feedScope: string): { feedName: string; lang: string } {
  const splitIndex = feedScope.lastIndexOf(FEED_SCOPE_SEPARATOR);
  if (splitIndex === -1) return { feedName: feedScope, lang: 'en' };
  return {
    feedName: feedScope.slice(0, splitIndex),
    lang: feedScope.slice(splitIndex + FEED_SCOPE_SEPARATOR.length),
  };
}

function getPersistentFeedPrefix(roundupMode: Feed['roundupMode']): string {
  return roundupMode ? ROUNDUP_CACHE_PREFIX : CACHE_PREFIX;
}

function getPersistentFeedKey(feedScope: string, roundupMode: Feed['roundupMode']): string {
  return `${getPersistentFeedPrefix(roundupMode)}${feedScope}`;
}

async function readPersistentFeed(key: string): Promise<NewsItem[] | null> {
  const entry = await getPersistentCache<Array<Omit<NewsItem, 'pubDate'> & { pubDate: string }>>(key);
  if (!entry?.data?.length) return null;
  return fromSerializable(entry.data);
}

async function loadPersistentFeed(
  feedScope: string,
  roundupMode: Feed['roundupMode'],
): Promise<NewsItem[] | null> {
  const prefix = getPersistentFeedPrefix(roundupMode);
  const scopedKey = getPersistentFeedKey(feedScope, roundupMode);
  const scoped = await readPersistentFeed(scopedKey);
  if (scoped) return scoped;

  // Language-scope migration fallback (carried forward from the pre-v2
  // prefix era): some current-prefix cache rows can predate language scoping
  // refactor were written without a `::<lang>` suffix. For English only,
  // also try the unscoped key under the CURRENT prefix. Older prefixes (and,
  // for roundup feeds, the ordinary v2 namespace) are deliberately not
  // consulted because they predate the active schema or parser mode.
  const { feedName, lang } = parseFeedScope(feedScope);
  if (lang !== 'en') return null;
  return readPersistentFeed(`${prefix}${feedName}`);
}

// Clean up stale entries to prevent unbounded growth
function cleanupCaches(): void {
  const now = Date.now();

  for (const [key, value] of feedCache) {
    if (now - value.timestamp > CACHE_TTL * 2) {
      feedCache.delete(key);
    }
  }

  for (const [key, state] of feedFailures) {
    if (state.cooldownUntil > 0 && now > state.cooldownUntil) {
      feedFailures.delete(key);
    }
  }

  if (feedCache.size > MAX_CACHE_ENTRIES) {
    const entries = Array.from(feedCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_ENTRIES);
    for (const [key] of toRemove) {
      feedCache.delete(key);
    }
  }
}

function isFeedOnCooldown(feedScope: string): boolean {
  const state = feedFailures.get(feedScope);
  if (!state) return false;
  if (Date.now() < state.cooldownUntil) return true;
  if (state.cooldownUntil > 0) feedFailures.delete(feedScope);
  return false;
}

function recordFeedFailure(feedScope: string): void {
  const state = feedFailures.get(feedScope) || { count: 0, cooldownUntil: 0 };
  state.count++;
  if (state.count >= MAX_FAILURES) {
    state.cooldownUntil = Date.now() + FEED_COOLDOWN_MS;
    const { feedName, lang } = parseFeedScope(feedScope);
    console.warn(`[RSS] ${feedName} (${lang}) on cooldown for 5 minutes after ${state.count} failures`);
  }
  feedFailures.set(feedScope, state);
}

function recordFeedSuccess(feedScope: string): void {
  feedFailures.delete(feedScope);
}

export function getFeedFailures(): Map<string, { count: number; cooldownUntil: number }> {
  const currentLang = getCurrentLanguage();
  const currentLangFailures = new Map<string, { count: number; cooldownUntil: number }>();

  for (const [feedScope, state] of feedFailures) {
    const { feedName, lang } = parseFeedScope(feedScope);
    if (lang === currentLang) {
      currentLangFailures.set(feedName, state);
    }
  }

  return currentLangFailures;
}


/**
 * Extract the best image URL from an RSS item element.
 * Tries multiple RSS image sources in priority order:
 * 1. media:content (Yahoo MRSS namespace)
 * 2. media:thumbnail (Yahoo MRSS namespace)
 * 3. <enclosure> with image type
 * 4. First <img> in description/content:encoded
 * Returns undefined if no image found. Never throws.
 */
function extractImageUrl(item: Element): string | undefined {
  const MRSS_NS = 'http://search.yahoo.com/mrss/';
  const IMG_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|$)/i;

  try {
    // 1. media:content with MRSS namespace
    const mediaContents = item.getElementsByTagNameNS(MRSS_NS, 'content');
    for (let i = 0; i < mediaContents.length; i++) {
      const el = mediaContents[i]!;
      const url = el.getAttribute('url');
      if (!url) continue;
      const medium = el.getAttribute('medium');
      const type = el.getAttribute('type');
      // Accept if medium is image, type contains image, URL looks like image, or no type specified
      if (medium === 'image' || type?.startsWith('image/') || IMG_EXTENSIONS.test(url) || (!type && !medium)) {
        return url;
      }
    }
  } catch {
    // Namespace not supported or other XML issue, fall through
  }

  try {
    // 2. media:thumbnail with MRSS namespace
    const thumbnails = item.getElementsByTagNameNS(MRSS_NS, 'thumbnail');
    for (let i = 0; i < thumbnails.length; i++) {
      const url = thumbnails[i]!.getAttribute('url');
      if (url) return url;
    }
  } catch {
    // Fall through
  }

  try {
    // 3. <enclosure> with image type
    const enclosures = item.getElementsByTagName('enclosure');
    for (let i = 0; i < enclosures.length; i++) {
      const el = enclosures[i]!;
      const type = el.getAttribute('type');
      const url = el.getAttribute('url');
      if (url && type?.startsWith('image/')) return url;
    }
  } catch {
    // Fall through
  }

  try {
    // 4. Fallback: parse first <img src="..."> from description or content:encoded
    const description = item.querySelector('description')?.textContent || '';
    const contentEncoded = item.getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded');
    const contentText = contentEncoded.length > 0 ? (contentEncoded[0]!.textContent || '') : '';
    const htmlContent = contentText || description;
    const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/);
    if (imgMatch?.[1]) return imgMatch[1];
  } catch {
    // Fall through
  }

  return undefined;
}

export async function fetchFeed(feed: Feed): Promise<NewsItem[]> {
  if (feedCache.size > MAX_CACHE_ENTRIES / 2) cleanupCaches();
  const currentLang = getCurrentLanguage();
  const feedScope = getFeedScope(feed.name, currentLang);

  if (isFeedOnCooldown(feedScope)) {
    const cached = feedCache.get(feedScope);
    if (cached) return cached.items;
    return (await loadPersistentFeed(feedScope, feed.roundupMode)) || [];
  }

  const cached = feedCache.get(feedScope);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.items;
  }

  try {
    let url = typeof feed.url === 'string' ? feed.url : feed.url.en;
    if (typeof feed.url !== 'string') {
      url = feed.url[currentLang] || feed.url.en || Object.values(feed.url)[0] || '';
    }

    if (!url) throw new Error(`No URL found for feed ${feed.name}`);

    const response = await fetchWithProxy(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const noStoreResponse = hasNoStoreCacheDirective(response.headers);
    const text = await response.text();
    const isMobile = isMobileDevice();
    const doc = await parseFeedXml(text, isMobile);

    // XML parsing is synchronous. It is serialized behind a yield so several
    // completed mobile feed requests cannot parse back-to-back in one
    // post-hydration task; yield again before querying and mapping entries.
    // (#5165)
    if (isMobile) await yieldToMain();

    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      console.warn(`Parse error for ${feed.name}`);
      recordFeedFailure(feedScope);
      const persistent = await loadPersistentFeed(feedScope, feed.roundupMode);
      return cached?.items || persistent || [];
    }

    let items = doc.querySelectorAll('item');
    const isAtom = items.length === 0;
    if (isAtom) items = doc.querySelectorAll('entry');

    const sourceNodes = Array.from(items);
    type FeedCandidate = {
      title: string;
      link: string;
      pubDateStr: string;
      sourceNode?: Element;
    };
    const publicationDateText = (item: Element): string => isAtom
      ? (item.querySelector('published')?.textContent || item.querySelector('updated')?.textContent || '')
      : (item.querySelector('pubDate')?.textContent
        || item.querySelector('dc\\:date')?.textContent
        || item.getElementsByTagName('dc:date')[0]?.textContent
        || '');
    const candidates: FeedCandidate[] = [];

    if (feed.roundupMode && !isAtom) {
      const roundupNode = sourceNodes.find((item) => {
        const category = item.querySelector('category')?.textContent?.trim() ?? '';
        const title = item.querySelector('title')?.textContent?.trim() ?? '';
        if (feed.roundupMode === 'rapture-ready') {
          return category === 'Rapture Ready End Times News'
            && /^\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}$/.test(title);
        }
        return /^[A-Z][a-z]+\s+\d{1,2}(?:st|nd|rd|th),\s+\d{4}$/.test(title);
      });
      if (roundupNode) {
        const encoded = roundupNode.getElementsByTagNameNS(
          'http://purl.org/rss/1.0/modules/content/',
          'encoded',
        )[0]?.textContent
          || roundupNode.getElementsByTagName('content:encoded')[0]?.textContent
          || '';
        const pubDateStr = publicationDateText(roundupNode);
        const roundupItems = feed.roundupMode === 'rapture-ready'
          ? extractRaptureReadyRoundupItems(encoded, { maxItems: 5 })
          : extractTrackingBibleProphecyRoundupItems(encoded, { maxItems: 5 });
        for (const item of roundupItems) {
          candidates.push({ title: item.title, link: item.link, pubDateStr });
        }
      }
    }

    if (candidates.length === 0) {
      for (const item of sourceNodes.slice(0, 5)) {
        const title = item.querySelector('title')?.textContent || '';
        let link = '';
        if (isAtom) {
          const linkEl = item.querySelector('link[href]');
          link = linkEl?.getAttribute('href') || '';
        } else {
          link = item.querySelector('link')?.textContent || '';
        }
        candidates.push({
          title,
          link,
          pubDateStr: publicationDateText(item),
          sourceNode: item,
        });
      }
    }

    const parsed: Array<NewsItem & { threat: ReturnType<typeof classifyByKeyword> }> = [];
    for (const [index, candidate] of candidates.entries()) {
      const { title, link, pubDateStr, sourceNode } = candidate;
      // Dublin Core (<dc:date>) fallback for RSS feeds. ArXiv RSS (already
      // in the feed registry as "ArXiv AI", "ArXiv ML") ships dc:date with
      // no <pubDate>; without this fallback every ArXiv item would land
      // with pubDateMissing=true and get demoted in every freshness ranking.
      // Prior precedent: PR #3417. querySelector('dc\\:date') escapes the
      // CSS-selector colon so the XML qname matches; getElementsByTagName
      // is an alternative that also works under browser DOMParser in XML
      // mode. textContent reads the element's inner text without namespace
      // gymnastics.
      const { date: pubDate, missing: pubDateMissing } = parseFeedDate(pubDateStr);
      const threat = classifyByKeyword(title, SITE_VARIANT);
      const isAlert = threat.level === 'critical' || threat.level === 'high';
      const geoMatches = inferGeoHubsFromTitle(title);
      const topGeo = geoMatches[0];

      parsed.push({
        source: feed.name,
        title,
        link,
        pubDate,
        pubDateMissing,
        isAlert,
        threat,
        ...(topGeo && { lat: topGeo.hub.lat, lon: topGeo.hub.lon, locationName: topGeo.hub.name }),
        lang: feed.lang,
        ...(SITE_VARIANT === 'happy' && sourceNode && { imageUrl: extractImageUrl(sourceNode) }),
      });

      // Each item performs DOM queries, date normalization, classification,
      // and geo inference. Let paint/input run before the next item instead
      // of concatenating all five into the same task on mobile. (#5165)
      if (isMobile && index < candidates.length - 1) await yieldToMain();
    }

    if (!noStoreResponse) {
      feedCache.set(feedScope, { items: parsed, timestamp: Date.now() });
      void setPersistentCache(
        getPersistentFeedKey(feedScope, feed.roundupMode),
        toSerializable(parsed),
      );
    }
    recordFeedSuccess(feedScope);
    ingestHeadlines(parsed.map(item => ({
      title: item.title,
      pubDate: item.pubDate,
      pubDateMissing: item.pubDateMissing,
      source: item.source,
      link: item.link,
    })));

    if (isHeadlineMemoryEnabled() && mlWorker.isAvailable && mlWorker.isModelLoaded('embeddings') && parsed.length > 0) {
      mlWorker.vectorStoreIngest(parsed.map(item => ({
        text: item.title,
        pubDate: item.pubDate.getTime(),
        source: item.source,
        url: item.link,
        tags: item.locationName ? [item.locationName] : undefined,
      }))).catch(() => {});
    }

    const aiCandidates = parsed
      .filter(item => item.threat.source === 'keyword')
      .sort((a, b) => effectivePubDateMs(b) - effectivePubDateMs(a))
      .slice(0, AI_CLASSIFY_MAX_PER_FEED);

    for (const item of aiCandidates) {
      if (!canQueueAiClassification({ link: item.link, title: item.title })) continue;
      classifyWithAI(item.title, SITE_VARIANT).then((aiResult) => {
        if (aiResult && aiResult.confidence > item.threat.confidence) {
          item.threat = aiResult;
          item.isAlert = aiResult.level === 'critical' || aiResult.level === 'high';
        }
      }).catch(() => { });
    }

    return parsed;
  } catch (e) {
    console.error(`Failed to fetch ${feed.name}:`, e);
    recordFeedFailure(feedScope);
    const persistent = await loadPersistentFeed(feedScope, feed.roundupMode);
    return cached?.items || persistent || [];
  }
}

export async function fetchCategoryFeeds(
  feeds: Feed[],
  options: {
    batchSize?: number;
    onBatch?: (items: NewsItem[]) => void;
  } = {}
): Promise<NewsItem[]> {
  const topLimit = 20;
  const batchSize = options.batchSize ?? 5;

  // Filter feeds by language:
  // 1. Feeds with no explicit 'lang' are universal (or multi-url handled inside fetchFeed)
  // 2. Feeds with explicit 'lang' must match current UI language
  // Shared with callers that must reason about a category's REACHABLE feed set
  // before calling in — see feed-language.ts.
  const filteredFeeds = filterFeedsByLanguage(feeds, getCurrentLanguage());

  const batches = chunkArray(filteredFeeds, batchSize);
  const topItems: NewsItem[] = [];
  let totalItems = 0;

  const ensureSortedDescending = () => [...topItems].sort((a, b) => effectivePubDateMs(b) - effectivePubDateMs(a));

  const insertTopItem = (item: NewsItem) => {
    totalItems += 1;
    if (topItems.length < topLimit) {
      topItems.push(item);
      if (topItems.length === topLimit) topItems.sort((a, b) => effectivePubDateMs(a) - effectivePubDateMs(b));
      return;
    }

    const itemTime = effectivePubDateMs(item);
    if (itemTime <= effectivePubDateMs(topItems[0]!)) return;

    topItems[0] = item;
    for (let i = 0; i < topItems.length - 1; i += 1) {
      if (effectivePubDateMs(topItems[i]!) <= effectivePubDateMs(topItems[i + 1]!)) break;
      [topItems[i], topItems[i + 1]] = [topItems[i + 1]!, topItems[i]!];
    }
  };

  for (const batch of batches) {
    const results = await Promise.all(batch.map(fetchFeed));
    results.flat().forEach(insertTopItem);
    options.onBatch?.(ensureSortedDescending());
  }

  if (totalItems > 0) {
    dataFreshness.recordUpdate('rss', totalItems);
  }

  return ensureSortedDescending();
}

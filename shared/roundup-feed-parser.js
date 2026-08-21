/**
 * Extract linked event stories from dated daily-news roundup posts.
 *
 * The feeds' top-level items are only dates. Their content:encoded bodies
 * contain linked headlines, sometimes followed by a short excerpt. Keeping
 * these parsers pure lets the browser and server ingest paths apply the same
 * conservative rules.
 */

const PARAGRAPH_RE = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
const LIST_ITEM_RE = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
const LEADING_LINK_RE =
  /^\s*<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>\s*<br\s*\/?>/i;
const FIRST_LINK_RE =
  /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/i;
const TAG_RE = /<[^>]+>/g;
const ENTITY_RE = /&(?:#x([0-9a-f]+)|#(\d+)|([a-z][a-z0-9]*));/gi;
const NAMED_ENTITIES = {
  amp: '&',
  apos: "'",
  gt: '>',
  hellip: '…',
  ldquo: '“',
  lsquo: '‘',
  lt: '<',
  mdash: '—',
  nbsp: ' ',
  ndash: '–',
  quot: '"',
  rdquo: '”',
  rsquo: '’',
};

function decodeEntity(match, hex, decimal, name) {
  if (hex !== undefined || decimal !== undefined) {
    const codePoint = hex !== undefined ? Number.parseInt(hex, 16) : Number(decimal);
    if (
      Number.isInteger(codePoint) &&
      codePoint >= 0 &&
      codePoint <= 0x10ffff &&
      !(codePoint >= 0xd800 && codePoint <= 0xdfff)
    ) {
      return String.fromCodePoint(codePoint);
    }
    return '';
  }
  return NAMED_ENTITIES[String(name).toLowerCase()] ?? match;
}

function cleanText(value) {
  return String(value ?? '')
    .replace(TAG_RE, ' ')
    .replace(ENTITY_RE, decodeEntity)
    .replace(/\s+/g, ' ')
    .trim();
}

function externalHttpUrl(rawHref, excludedHosts) {
  try {
    const url = new URL(String(rawHref).replace(ENTITY_RE, decodeEntity));
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.username || url.password) return null;
    const hostname = url.hostname.toLowerCase();
    if (excludedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

/**
 * @param {unknown} html
 * @param {{ maxItems?: number, maxDescriptionLength?: number }} [options]
 * @returns {Array<{ title: string, link: string, description: string }>}
 */
export function extractRaptureReadyRoundupItems(html, options = {}) {
  const maxItems = Number.isInteger(options.maxItems) && options.maxItems > 0
    ? options.maxItems
    : 5;
  const maxDescriptionLength =
    Number.isInteger(options.maxDescriptionLength) && options.maxDescriptionLength > 0
      ? options.maxDescriptionLength
      : 1_000;
  const items = [];
  const seenLinks = new Set();

  for (const paragraphMatch of String(html ?? '').matchAll(PARAGRAPH_RE)) {
    const paragraph = paragraphMatch[1] ?? '';
    const linkMatch = paragraph.match(LEADING_LINK_RE);
    if (!linkMatch) continue;

    const link = externalHttpUrl(linkMatch[2], ['raptureready.com']);
    const title = cleanText(linkMatch[3]);
    if (!link || title.length < 5 || seenLinks.has(link)) continue;

    seenLinks.add(link);
    items.push({
      title,
      link,
      description: cleanText(paragraph.slice(linkMatch[0].length)).slice(
        0,
        maxDescriptionLength,
      ),
    });
    if (items.length >= maxItems) break;
  }

  return items;
}

/**
 * @param {unknown} html
 * @param {{ maxItems?: number, maxDescriptionLength?: number }} [options]
 * @returns {Array<{ title: string, link: string, description: string }>}
 */
export function extractTrackingBibleProphecyRoundupItems(html, options = {}) {
  const maxItems = Number.isInteger(options.maxItems) && options.maxItems > 0
    ? options.maxItems
    : 5;
  const maxDescriptionLength =
    Number.isInteger(options.maxDescriptionLength) && options.maxDescriptionLength > 0
      ? options.maxDescriptionLength
      : 1_000;
  const items = [];
  const seenLinks = new Set();

  for (const listItemMatch of String(html ?? '').matchAll(LIST_ITEM_RE)) {
    const listItem = listItemMatch[1] ?? '';
    const linkMatch = listItem.match(FIRST_LINK_RE);
    if (!linkMatch) continue;

    const link = externalHttpUrl(linkMatch[2], [
      'prophecyupdate.com',
      'trackingbibleprophecy.org',
    ]);
    const title = cleanText(linkMatch[3]);
    if (!link || title.length < 5 || seenLinks.has(link)) continue;

    seenLinks.add(link);
    const descriptionStart = (linkMatch.index ?? 0) + linkMatch[0].length;
    items.push({
      title,
      link,
      description: cleanText(listItem.slice(descriptionStart)).slice(
        0,
        maxDescriptionLength,
      ),
    });
    if (items.length >= maxItems) break;
  }

  return items;
}

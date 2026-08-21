export interface RoundupFeedItem {
  title: string;
  link: string;
  description: string;
}

export interface RoundupFeedParserOptions {
  maxItems?: number;
  maxDescriptionLength?: number;
}

export function extractRaptureReadyRoundupItems(
  html: unknown,
  options?: RoundupFeedParserOptions,
): RoundupFeedItem[];

export function extractTrackingBibleProphecyRoundupItems(
  html: unknown,
  options?: RoundupFeedParserOptions,
): RoundupFeedItem[];

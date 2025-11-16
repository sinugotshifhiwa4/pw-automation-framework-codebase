/**
 * Configuration options for ensuring stable table row counts.
 */
export interface StabilityConfig {
  maxAttempts?: number;
  stabilityThreshold?: number;
  delayMs?: number;
  noResultsTexts?: string[];
}

/**
 * Result of counting table rows, including whether a "no results" message was detected.
 */
export interface TableRowCountResult {
  count: number;
  isNoResultsMessage: boolean;
}

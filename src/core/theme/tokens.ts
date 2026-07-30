/**
 * @module ThemeTokens
 * @description Standardized design token interface for EZ EDGE CMS theme connectors.
 * Connectors declare their CSS variable bindings via ThemeTokenMap, allowing
 * the central theme engine to generate consistent typography, media frames, and resets.
 */

export interface ThemeTokenMap {
  /** Primary accent color variable name or expression (e.g. "var(--ruri-primary)") */
  primary: string;
  /** Primary hover accent color variable name or expression */
  primaryHover?: string;
  /**
   * RGB triplet string for the primary color (e.g. "0, 195, 255").
   * Used in rgba() gradient expressions inside shared preflights.
   * Connectors should provide a static triplet; not a var() reference.
   */
  primaryRgb?: string;
  /** Primary surface background color variable */
  surface: string;
  /** Secondary/variant surface background color variable */
  surfaceVariant: string;
  /** Primary body text color variable */
  text: string;
  /** Secondary/muted text color variable */
  textMuted: string;
  /** Border / outline color variable */
  border: string;
  /** Heading font family variable */
  fontHeader: string;
  /** Body text font family variable */
  fontBody: string;
  /** Code & mono font family variable */
  fontMono: string;
}

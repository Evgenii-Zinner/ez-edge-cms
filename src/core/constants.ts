import pkg from "../../package.json" assert { type: "json" };

/**
 * @module Constants
 * @description Centralized constants for the EZ EDGE CMS.
 * This file contains global configurations, protected identifiers,
 * and UI options used across both the public-facing site and the Admin HUD.
 */

/**
 * Current version of the CMS, pulled from package.json.
 */
export const APP_VERSION = pkg.version;

/**
 * Slugs that are reserved for system use and cannot be created or modified
 * via the standard page management flow.
 */
export const PROTECTED_SLUGS = ["index", "terms", "privacy"] as const;

/**
 * The default author name used when no specific author is provided
 * in the site or page configuration.
 */
export const DEFAULT_AUTHOR = "System";

/**
 * Valid lifecycle statuses for a page.
 * - 'draft': Only visible in the admin preview.
 * - 'published': Publicly accessible on the live site.
 * - 'archived': Not visible on the live site but retained in KV.
 */
export const PAGE_STATUSES = ["draft", "published", "archived"] as const;

/**
 * Available font families for headings (h1-h6).
 * Curated for a futuristic, technological aesthetic.
 */
export const FONT_OPTIONS_HEADER = [
  "Orbitron",
  "Chakra Petch",
  "Rajdhani",
  "Syncopate",
  "Audiowide",
  "Teko",
  "Play",
  "Bungee",
  "Press Start 2P",
  "Squada One",
  "Righteous",
  "Monoton",
  "Goldman",
  "Wallpoet",
  "Gruppo",
  "Jura",
  "Black Ops One",
  "Julius Sans One",
  "Russo One",
  "Michroma",
] as const;

/**
 * Available font families for navigation menus and UI elements.
 * Selected for high legibility at smaller sizes.
 */
export const FONT_OPTIONS_NAV = [
  "Chakra Petch",
  "Exo 2",
  "Jura",
  "Saira Condensed",
  "Oxanium",
  "Electrolize",
  "Turret Road",
  "Quantico",
  "Coda",
  "Silkscreen",
  "Tauri",
  "Varela Round",
  "Krona One",
  "Kanit",
  "Yantramanav",
  "Didact Gothic",
  "Maven Pro",
  "Rubik",
  "Kumbh Sans",
  "Commissioner",
] as const;

/**
 * Available font families for primary body text.
 * Prioritizes readability and clean sans-serif designs.
 */
export const FONT_OPTIONS_BODY = [
  "Roboto",
  "Inter",
  "Titillium Web",
  "Space Grotesk",
  "IBM Plex Sans",
  "Outfit",
  "Manrope",
  "Work Sans",
  "Cabin",
  "Chivo",
  "Mulish",
  "Nunito Sans",
  "Red Hat Display",
  "Ubuntu",
  "Heebo",
  "Hind",
  "Karla",
  "Lexend",
  "Sen",
  "Sora",
] as const;

/**
 * Available font families for code blocks and monospaced UI elements.
 */
export const FONT_OPTIONS_MONO = [
  "Fira Code",
  "JetBrains Mono",
  "Share Tech Mono",
  "Space Mono",
  "VT323",
  "Source Code Pro",
  "Inconsolata",
  "Ubuntu Mono",
  "Roboto Mono",
  "PT Mono",
  "Oxygen Mono",
  "Cousine",
  "Overpass Mono",
  "Anonymous Pro",
  "Syne Mono",
  "Cutive Mono",
  "Nova Mono",
  "Spline Sans Mono",
  "Major Mono Display",
  "IBM Plex Mono",
] as const;

/**
 * Centralized key naming conventions for Cloudflare KV storage.
 * Standardizes how configurations, pages, and system states are indexed.
 */
export const KV_PREFIX = {
  SESSION: "auth:session:",
  RATE_LIMIT: "limit:",
} as const;

export const KV_KEYS = {
  /** Global theme configuration key. */
  THEME: "config:theme",
  /** Global navigation menu configuration key. */
  NAV: "config:nav",
  /** Global site identity and branding key. */
  SITE: "config:site",
  /** Global footer configuration key. */
  FOOTER: "config:footer",
  /** Flag indicating if the system has been initialized (defaults set). */
  INITIALIZED: "system:initialized",
  /** Flag indicating if the initial onboarding flow is complete. */
  ONBOARDING: "system:onboarding_complete",
  /** Primary admin user credentials key. */
  ADMIN_USER: "system:admin_user",
  /** Dynamic key generator for active user sessions. */
  SESSION: (token: string): string => `${KV_PREFIX.SESSION}${token}`,
  /** Dynamic key generator for individual pages based on environment and slug. */
  PAGE: (env: "draft" | "live", slug: string): string => `page:${env}:${slug}`,
  /** Dynamic key generator for lists of page slugs in a specific environment. */
  PAGE_LIST: (env: "draft" | "live"): string => `list:pages:${env}`,
  /** Dynamic key generator for rate limiting based on IP and action. */
  RATE_LIMIT: (ip: string, action: string): string =>
    `${KV_PREFIX.RATE_LIMIT}${action}:${ip}`,
} as const;

import { createGenerator } from "unocss";
import config from "../../uno.config";

/**
 * The core UnoCSS generator instance, initialized with the global configuration.
 * Used for on-demand utility-first CSS generation at the edge.
 *
 * @returns An initialized UnoGenerator instance.
 */
export const unocssEngine = createGenerator(config);

/**
 * Isolate-level cache for generated CSS.
 * Stores generated CSS strings keyed by content signature to minimize CPU usage.
 */
const CSS_CACHE = new Map<string, string>();

/**
 * Maximum number of entries to retain in the isolate-level CSS cache.
 */
const CACHE_LIMIT = 50;

/**
 * Returns the current number of entries in the UnoCSS engine's isolate-level cache.
 * Primarily used for unit testing and performance monitoring.
 *
 * @returns The current cache size.
 */
export const getUnocssCacheSize = (): number => CSS_CACHE.size;

/**
 * Transforms an HTML string by injecting required UnoCSS utility styles.
 * Leverages isolate-level caching to minimize extraction overhead for repeated content.
 *
 * @param html - The raw HTML string to parse and transform.
 * @param isHtmx - If true, treats the payload as an HTMX fragment (omits preflights).
 * @returns A promise resolving to the HTML string with injected CSS styles.
 */
export const renderWithUno = async (
  html: string,
  isHtmx: boolean = false,
): Promise<string> => {
  const generator = await unocssEngine;

  /**
   * Generates a heuristic cache key based on content length and boundary slices
   * to uniquely identify the HTML fragment while avoiding full-string hashing.
   */
  const cacheKey = `${isHtmx}:${html.length}:${html.slice(0, 100)}${html.slice(-100)}`;

  let generatedCss = CSS_CACHE.get(cacheKey);

  if (!generatedCss) {
    /**
     * Extracts utility classes from the HTML and generates the corresponding
     * minified CSS rules using the UnoCSS generator.
     */
    const { css } = await generator.generate(html, {
      minify: true,
      preflights: !isHtmx,
    });

    generatedCss = css.trim();

    /**
     * Implements a FIFO (First-In-First-Out) eviction policy to ensure the
     * isolate-level cache remains within the defined memory limits.
     */
    if (CSS_CACHE.size >= CACHE_LIMIT) {
      const firstKey = CSS_CACHE.keys().next().value;
      if (firstKey !== undefined) CSS_CACHE.delete(firstKey);
    }
    CSS_CACHE.set(cacheKey, generatedCss);
  }

  const styleTag = `<style id="ez-unocss">${generatedCss}</style>`;

  /**
   * Determines the optimal injection point for the generated styles.
   * Prioritizes existing UnoCSS blocks, then the head tag, then fallbacks.
   */
  if (html.includes('id="ez-unocss"')) {
    return html.replace(/<style id="ez-unocss">.*?<\/style>/s, () => styleTag);
  }

  if (isHtmx) {
    return `${html}\n${styleTag}`;
  }

  if (html.includes("<!-- CSS_INJECTION_POINT -->")) {
    return html.replace("<!-- CSS_INJECTION_POINT -->", styleTag);
  }

  if (html.includes("</head>")) {
    return html.replace("</head>", `${styleTag}\n</head>`);
  }

  return `${html}\n${styleTag}`;
};

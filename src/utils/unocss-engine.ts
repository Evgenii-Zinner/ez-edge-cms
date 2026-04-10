import { createGenerator } from "unocss";
import config, { EDITOR_SAFELIST } from "../../uno.config";

/**
 * The standard UnoCSS generator instance for public pages and general admin UI.
 */
export const unocssEngine = createGenerator(config);

/**
 * Specialized generator for the block editor, including the heavy safelist for Editor.js UI.
 * This is only invoked when rendering the Page Editor to keep public CSS lean.
 */
export const editorEngine = createGenerator({
  ...config,
  safelist: [...(config.safelist || []), ...EDITOR_SAFELIST],
});

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
 * @param isEditor - If true, utilizes the heavy editor generator for Editor.js UI.
 * @returns A promise resolving to the HTML string with injected CSS styles.
 */
export const renderWithUno = async (
  html: string,
  isHtmx: boolean = false,
  isEditor: boolean = false,
): Promise<string> => {
  const generator = await (isEditor ? editorEngine : unocssEngine);

  /**
   * Generates a heuristic cache key based on content length and boundary slices
   * to uniquely identify the HTML fragment while avoiding full-string hashing.
   */
  const cacheKey = `${isEditor}:${isHtmx}:${html.length}:${html.slice(0, 100)}${html.slice(-100)}`;

  let generatedCss = CSS_CACHE.get(cacheKey);

  if (!generatedCss) {
    /**
     * Extracts utility classes from the HTML and generates the corresponding
     * minified CSS rules using the selected UnoCSS generator.
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

  let processedHtml = html;

  /**
   * Hoist ELS Shard-Scoped Styles:
   * If the HTML contains a registry-based style tag (injected during ELS rendering),
   * we extract it and move it to the head alongside the UnoCSS styles.
   */
  let hoistedElsCss = "";
  if (html.includes('id="els-registry-css"')) {
    const elsMatch = html.match(/<style id="els-registry-css">(.*?)<\/style>/s);
    if (elsMatch) {
      hoistedElsCss = elsMatch[0];
      processedHtml = html.replace(
        /<style id="els-registry-css">.*?<\/style>/s,
        "",
      );
    }
  }

  /**
   * Determines the optimal injection point for the generated styles.
   * Prioritizes existing UnoCSS blocks, then the head tag, then fallbacks.
   */
  const injectionStyles = `${hoistedElsCss}\n${styleTag}`;

  if (processedHtml.includes('id="ez-unocss"')) {
    return processedHtml.replace(
      /<style id="ez-unocss">.*?<\/style>/s,
      () => styleTag,
    );
  }

  if (isHtmx) {
    return `${processedHtml}\n${injectionStyles}`;
  }

  if (processedHtml.includes("<!-- CSS_INJECTION_POINT -->")) {
    return processedHtml.replace(
      "<!-- CSS_INJECTION_POINT -->",
      injectionStyles,
    );
  }

  if (processedHtml.includes("</head>")) {
    return processedHtml.replace("</head>", `${injectionStyles}\n</head>`);
  }

  return `${processedHtml}\n${injectionStyles}`;
};

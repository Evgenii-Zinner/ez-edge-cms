/** @jsxImportSource hono/jsx */
/**
 * @module Head
 * @description Centralized component for rendering the HTML `<head>`.
 * Orchestrates the generation of SEO meta tags, JSON-LD structured data,
 * dynamic CSS theme variables, and critical administrative assets.
 */

import { raw } from "hono/html";
import { ThemeConfig, SiteConfig, PageConfig } from "@core/schema";
import { generateCssVariables, generateAdminCssVariables } from "@utils/styles";
import { generateMetaTags, generateJsonLd } from "@utils/seo";

/**
 * Props for the Head component.
 */
export interface HeadProps {
  /** The browser title for the page. */
  title: string;
  /** Global theme configuration. */
  theme: ThemeConfig;
  /** Global site configuration. */
  site: SiteConfig;
  /** Optional page configuration for SEO overrides. */
  page?: PageConfig;
  /** If true, renders administrative styles and scripts. */
  isAdmin?: boolean;
  /** If true, injects Editor.js critical assets. */
  isEditor?: boolean;
  /** The base URL detected from the request context. */
  detectedUrl?: string;
}

/**
 * Component: Head
 * Renders the complete `<head>` section of the HTML document.
 * Handles the logic for:
 * 1. SEO Metadata (OpenGraph, Twitter).
 * 2. JSON-LD Structured Data.
 * 3. Theme-driven CSS variables.
 * 4. Google Font loading.
 * 5. Script injection for HTMX and Editor.js.
 *
 * @param props - Component properties.
 * @returns A JSX element containing the head metadata.
 */
export const Head = (props: HeadProps) => {
  const { title, theme, site, page, isAdmin, isEditor, detectedUrl } = props;

  // Generate SEO and Theme assets
  const metaTags = generateMetaTags(site, page, detectedUrl);
  const jsonLd = generateJsonLd(site, page, detectedUrl);
  const cssVariables = isAdmin
    ? generateAdminCssVariables()
    : generateCssVariables(theme);

  // Dynamic Page Title
  const displayTitle = `${title.toUpperCase()} | ${site.title}`;

  // Unique set of fonts to load from Google Fonts
  const fonts = new Set([
    theme.values.font_header,
    theme.values.font_nav,
    theme.values.font_body,
    theme.values.font_mono,
  ]);

  const fontString = Array.from(fonts)
    .filter(Boolean)
    .map((f) => `family=${f.replace(/\s+/g, "+")}:wght@400;700`)
    .join("&");

  const googleFontsUrl = `https://fonts.googleapis.com/css2?${fontString}&display=swap`;

  return (
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{displayTitle}</title>

      {/* Connectivity Hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin="anonymous"
      />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      <link rel="dns-prefetch" href="https://unpkg.com" />
      <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />

      {/* Primary SEO Meta Tags */}
      {metaTags.map((tag) =>
        tag.name ? (
          <meta name={tag.name} content={tag.content} />
        ) : (
          <meta property={tag.property} content={tag.content} />
        ),
      )}

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Dynamic Favicon (SVG) */}
      {site.logoSvg && (
        <link
          rel="icon"
          type="image/svg+xml"
          href={`data:image/svg+xml,${encodeURIComponent(site.logoSvg)}`}
        />
      )}

      {/* Optimized Google Fonts: Non-blocking load pattern */}
      <link
        rel="stylesheet"
        href={googleFontsUrl}
        media="print"
        // @ts-ignore - Hono/JSX handles this properly
        onload="this.media='all'"
      />
      <noscript>
        <link rel="stylesheet" href={googleFontsUrl} />
      </noscript>

      {/* Core Scripts: HTMX (Deferred) */}
      <script
        src="https://unpkg.com/htmx.org@2.0.4"
        crossorigin="anonymous"
        defer
      />

      {/* Administrative Assets (Deferred) */}
      {isAdmin && isEditor && (
        <>
          <script
            src="https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest"
            defer
          />
          <script
            src="https://cdn.jsdelivr.net/npm/@editorjs/header@2.8.8"
            defer
          />
          <script
            src="https://cdn.jsdelivr.net/npm/@editorjs/image@2.9.3"
            defer
          />
          <script
            src="https://cdn.jsdelivr.net/npm/@editorjs/list@2.0.2"
            defer
          />
          <script
            src="https://cdn.jsdelivr.net/npm/@editorjs/quote@2.6.0"
            defer
          />
          <script
            src="https://cdn.jsdelivr.net/npm/@editorjs/table@2.4.3"
            defer
          />
          <script
            src="https://cdn.jsdelivr.net/npm/@editorjs/embed@2.7.6"
            defer
          />
          <script
            src="https://cdn.jsdelivr.net/npm/@editorjs/code@2.9.3"
            defer
          />
          <script
            src="https://cdn.jsdelivr.net/npm/@editorjs/delimiter@1.4.2"
            defer
          />
          <script
            src="https://cdn.jsdelivr.net/npm/editorjs-drag-drop@1.1.18"
            defer
          />
        </>
      )}

      {/* Global Custom Head Scripts (Permanent, for Analytics) */}
      {site.customHeadScripts && raw(site.customHeadScripts)}

      {/* Dynamic CSS Theme Variables Injection */}
      <style id="dynamic-theme">{raw(cssVariables)}</style>

      {/* UnoCSS Insertion Point */}
      {raw("<!-- CSS_INJECTION_POINT -->")}
    </head>
  );
};

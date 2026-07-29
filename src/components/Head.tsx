/** @jsxImportSource hono/jsx */
/**
 * @module Head
 * @description Centralized component for rendering the HTML `<head>`.
 * Orchestrates the generation of SEO meta tags, JSON-LD structured data,
 * dynamic CSS theme variables, and critical administrative assets.
 */

import type { FC } from "hono/jsx";
import { raw } from "hono/html";
import { ThemeConfig, SiteConfig, PageConfig } from "@core/schema";
import { generateCssVariables, generateAdminCssVariables } from "@utils/styles";
import { generateMetaTags, generateJsonLd } from "@utils/seo";
import { ADMIN_CSS } from "../styles/admin";

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
export const Head: FC<HeadProps> = (props) => {
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

      {/* Dynamic Favicon (SVG & ICO Fallback) */}
      <link
        rel="icon"
        type="image/svg+xml"
        href={site.logoSvg ? `data:image/svg+xml,${encodeURIComponent(site.logoSvg)}` : "/favicon.svg"}
      />
      <link rel="alternate icon" href="/favicon.ico" />

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

      {/* Administrative PortableText Assets (Deferred) */}
      {isAdmin && isEditor && (
        <>
          <link rel="stylesheet" href="/admin/assets/ez-portable-text.css" />
          <script src="/admin/assets/ez-portable-text.js" defer />
        </>
      )}

      {/* Global Custom Head Scripts (Permanent, for Analytics) */}
      {site.customHeadScripts && raw(site.customHeadScripts)}

      {/* Dynamic CSS Theme Variables Injection */}
      <style id="dynamic-theme">{raw(cssVariables)}</style>

      {/* Standalone Admin HUD Styles Injection */}
      {isAdmin && <style id="admin-styles">{raw(ADMIN_CSS)}</style>}

      {/* Global Video Facade Player Script (Passive Event Polyfill Wrapper) */}
      <script dangerouslySetInnerHTML={{ __html: `window.ezPlayVideo=function(c,u){var s='<!DOCTYPE html><html><head><script>(function(){if(typeof EventTarget!=="undefined"){var a=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(t,f,o){if(t==="touchstart"||t==="touchmove"){if(typeof o==="boolean"){o={capture:o,passive:true};}else if(typeof o==="object"&&o!==null){if(o.passive===undefined)o.passive=true;}else{o={passive:true};}}return a.call(this,t,f,o);};}})();<\\/script><style>*{margin:0;padding:0;box-sizing:border-box}html,body{height:100%;background:#02060c;overflow:hidden}iframe{width:100%;height:100%;border:none;display:block}</style></head><body><iframe src="'+u+'" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture *; web-share" allowfullscreen></iframe></body></html>';c.innerHTML='<iframe srcdoc="'+s.replace(/"/g,'&quot;')+'" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture *; web-share" allowfullscreen></iframe>';};` }} />

      {/* UnoCSS Insertion Point */}
      {raw("<!-- CSS_INJECTION_POINT -->")}
    </head>
  );
};

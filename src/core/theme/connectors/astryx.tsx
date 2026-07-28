/** @jsxImportSource hono/jsx */
/**
 * @module AstryxThemeConnector
 * @description Theme connector for Meta's Astryx Design System (https://github.com/facebook/astryx).
 * Connects EZ EDGE CMS ThemeConfig settings to Astryx CSS tokens, preflights, and component structures.
 */

import { ThemeConfig } from "@core/schema";
import { ThemeConnector, ThemeComponents, ImageProps, VideoProps, EmbedProps } from "../connector";
import { ThemeTokenMap } from "../tokens";
import { createContentPreflights } from "../preflights";
import { normalizePath } from "@utils/seo";
import type { UserConfig } from "unocss";

function minifyCss(css: string): string {
  return css.replace(/\s+/g, " ").trim();
}

export class AstryxThemeConnector implements ThemeConnector {
  readonly id = "astryx";
  readonly name = "Meta Astryx Design System";

  readonly tokens: ThemeTokenMap = {
    primary: "var(--astryx-primary, #1877f2)",
    primaryHover: "var(--astryx-primary-hover, #166fe5)",
    primaryRgb: "24, 119, 242",
    surface: "var(--astryx-surface, #ffffff)",
    surfaceVariant: "var(--astryx-surface-variant, #f8fafc)",
    text: "var(--astryx-text, #0f172a)",
    textMuted: "var(--astryx-text-muted, #475569)",
    border: "var(--astryx-border, #e2e8f0)",
    fontHeader: "var(--font-header)",
    fontBody: "var(--font-body)",
    fontMono: "var(--font-mono)",
  };

  readonly components: ThemeComponents = {
    Card: (props) => (
      <div class={`astryx-card p-6 rounded-xl border border-solid border-[var(--astryx-border,#e2e8f0)] bg-[var(--astryx-surface,#ffffff)] shadow-sm transition-all hover:shadow-md ${props.class || ""}`.trim()}>
        {props.title && <h3 class="text-1.25rem font-header font-bold mb-3 color-[var(--astryx-text,#0f172a)] tracking-tight">{props.title}</h3>}
        <div class="color-[var(--astryx-text-muted,#475569)] text-0.95rem leading-relaxed">{props.children}</div>
      </div>
    ),

    Button: (props) => (
      <button
        type={(props.type as any) || "button"}
        class={`inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium text-sm transition-all cursor-pointer border-0 bg-[var(--astryx-primary,#1877f2)] text-white hover:bg-[var(--astryx-primary-hover,#166fe5)] active:scale-98 shadow-sm ${props.class || ""}`.trim()}
      >
        {props.children}
      </button>
    ),

    Grid: (props) => (
      <div class={`grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6 my-8 ${props.class || ""}`.trim()}>
        {props.children}
      </div>
    ),

    Hero: (props) => (
      <div class="relative min-h-[420px] flex items-center justify-center text-center my-10 p-12 rounded-2xl bg-gradient-to-b from-[var(--astryx-surface-variant,#f8fafc)] to-[var(--astryx-surface,#ffffff)] border border-solid border-[var(--astryx-border,#e2e8f0)] shadow-sm overflow-hidden">
        {props.imageUrl && (
          <div
            class="absolute inset-0 bg-cover bg-center opacity-15"
            style={{ backgroundImage: `url('${props.imageUrl}')` }}
          ></div>
        )}
        <div class="relative z-10 max-w-3xl">
          <h1 class="text-3rem md:text-4.2rem font-header font-extrabold mb-5 color-[var(--astryx-text,#0f172a)] tracking-tight leading-tight">
            {props.title || ""}
          </h1>
          {props.subtitle && (
            <p class="text-1.25rem font-body text-[var(--astryx-text-muted,#475569)] leading-relaxed max-w-2xl mx-auto">
              {props.subtitle}
            </p>
          )}
        </div>
      </div>
    ),

    CodeBlock: (props) => (
      <div class="my-6 rounded-xl overflow-hidden border border-solid border-[#334155] bg-[#0f172a] text-slate-100 p-5 font-mono text-0.875rem shadow-md">
        {props.filename && (
          <div class="text-xs text-slate-400 border-b border-slate-700/60 pb-2.5 mb-3 font-mono tracking-wide flex items-center gap-2">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-slate-600"></span>
            {props.filename}
          </div>
        )}
        <pre class="m-0 overflow-x-auto"><code class={props.language || ""}>{props.code}</code></pre>
      </div>
    ),

    Table: (props) => {
      const rows = props.rows || [];
      const withHeadings = props.withHeadings || false;
      const getCells = (r: any) => (Array.isArray(r) ? r : Array.isArray(r?.cells) ? r.cells : []);
      return (
        <div class="my-6 overflow-x-auto rounded-xl border border-solid border-[var(--astryx-border,#e2e8f0)] shadow-sm">
          <table class="w-full border-collapse bg-[var(--astryx-surface,#ffffff)]">
            {withHeadings && rows.length > 0 && (
              <thead>
                <tr class="border-b border-solid border-[var(--astryx-border,#e2e8f0)] bg-[var(--astryx-surface-variant,#f8fafc)]">
                  {getCells(rows[0]).map((cell: any) => (
                    <th class="p-4 text-left font-header font-semibold text-xs uppercase tracking-wider color-[var(--astryx-text,#0f172a)]">{cell || ""}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.slice(withHeadings ? 1 : 0).map((r: any) => (
                <tr class="border-b border-solid border-[var(--astryx-border,#e2e8f0)] last:border-0 hover:bg-[var(--astryx-surface-variant,#f8fafc)] transition-colors">
                  {getCells(r).map((cell: any) => (
                    <td class="p-4 font-body text-sm color-[var(--astryx-text-muted,#475569)]">{cell || ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },

    Quote: (props) => (
      <blockquote class="my-6 p-6 rounded-r-xl border-l-4 border-solid border-[var(--astryx-primary,#1877f2)] bg-[var(--astryx-surface-variant,#f8fafc)] italic color-[var(--astryx-text,#0f172a)] shadow-sm">
        <p class="m-0 text-1.1rem leading-relaxed font-body">"{props.text}"</p>
        {props.caption && (
          <div class="text-right text-xs font-medium not-italic text-[var(--astryx-text-muted,#475569)] mt-3 uppercase tracking-wider">
            — {props.caption}
          </div>
        )}
      </blockquote>
    ),

    Overlays: () => null,

    Image: (props: ImageProps) => {
      const wrapperClasses = [
        "my-8 overflow-hidden border border-solid border-[var(--astryx-border,#e2e8f0)] rounded-xl bg-[var(--astryx-surface,#ffffff)] p-2 shadow-sm",
        props.stretched ? "important-w-[calc(100%+4rem)] important-ml--8 important-mr--8 important-max-w-none important-rounded-none" : "",
        props.withBorder ? "important-border-2 important-border-solid important-border-[var(--astryx-primary,#1877f2)]" : "",
        props.withBackground ? "bg-[var(--astryx-surface-variant,#f8fafc)] important-p-12 flex flex-col justify-center items-center rounded-xl" : "",
        props.class || "",
      ].filter(Boolean).join(" ");
      return (
        <div class={wrapperClasses}>
          <img src={props.src} alt={props.alt || ""} class="max-w-full h-auto block mx-auto rounded-lg" loading="lazy" />
          {props.header && (
            <div style={{ textAlign: "center", color: "var(--astryx-text-muted,#475569)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
              {props.header}
            </div>
          )}
        </div>
      );
    },

    Video: (props: VideoProps) => {
      const mediaHtml = props.embedUrl
        ? `<iframe src="${props.embedUrl}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>`
        : `<video src="${props.url}" controls width="100%" height="100%" preload="metadata"></video>`;
      return `
        <div class="my-6 rounded-xl overflow-hidden border border-solid border-[var(--astryx-border,#e2e8f0)] shadow-sm">
          <div class="aspect-video w-full bg-[var(--astryx-surface-variant,#f8fafc)]">
            ${mediaHtml}
          </div>
          ${props.caption ? `<div class="text-center text-0.8rem text-[var(--astryx-text-muted,#475569)] mt-2 italic px-4 pb-3">${props.caption}</div>` : ""}
        </div>
      `;
    },

    Embed: (props: EmbedProps) => `
      <div class="my-6 rounded-xl overflow-hidden border border-solid border-[var(--astryx-border,#e2e8f0)] shadow-sm">
        <div class="aspect-video w-full bg-[var(--astryx-surface-variant,#f8fafc)]">
          <iframe
            src="${props.embed}"
            width="100%"
            height="100%"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            loading="lazy"
          ></iframe>
        </div>
        ${props.caption ? `<div class="text-center text-0.8rem text-[var(--astryx-text-muted,#475569)] mt-2 italic px-4 pb-3">${props.caption}</div>` : ""}
      </div>
    `,

    Delimiter: () => `<hr class="border-t border-solid border-[var(--astryx-border,#e2e8f0)] w-full my-8" />`,

    Nav: (props) => (
      <nav class="flex gap-6 items-center max-lg:fixed max-lg:top-0 max-lg:right-0 max-lg:h-[100dvh] max-lg:w-280px max-lg:bg-[var(--astryx-surface,#ffffff)] max-lg:flex-col max-lg:items-start max-lg:pt-100px max-lg:p-8 max-lg:gap-6 max-lg:border-l max-lg:border-l-solid max-lg:border-l-[var(--astryx-border,#e2e8f0)] max-lg:translate-x-full max-lg:invisible max-lg:transition-all max-lg:duration-300 max-lg:ease-in-out max-lg:z-1000 max-lg:overflow-y-auto lg:hidden" id="main-nav">
        {props.nav.items.map((item) => (
          <a href={normalizePath(item.path)} class="font-nav text-[var(--astryx-text-muted,#475569)] no-underline font-medium hover:text-[var(--astryx-primary,#1877f2)] transition-colors text-0.9rem max-lg:text-1.1rem max-lg:w-full max-lg:text-right">
            {item.label}
          </a>
        ))}
      </nav>
    ),

    Header: (props) => (
      <header class="sticky top-0 z-2000 border-b border-b-solid border-[var(--astryx-border,#e2e8f0)] bg-[var(--astryx-surface,#ffffff)]/85 backdrop-blur-12px shadow-xs">
        <div class="max-w-1200px mx-auto flex justify-between items-center px-[clamp(1rem,5vw,2.5rem)] py-3.5">
          <a href="/" class="font-header text-[var(--astryx-text,#0f172a)] no-underline text-1.25rem font-bold tracking-tight flex items-center gap-2.5">
            {props.site.logoSvg && (
              <img
                src={`data:image/svg+xml,${encodeURIComponent(props.site.logoSvg)}`}
                alt="Logo"
                style={{
                  width: "28px",
                  height: "28px",
                  objectFit: "contain",
                }}
              />
            )}
            <div>{props.site.title}</div>
          </a>

          <button class="lg:hidden bg-transparent border border-solid border-[var(--astryx-border,#e2e8f0)] text-[var(--astryx-text,#0f172a)] px-3 py-1.5 rounded-md cursor-pointer font-nav text-0.8rem hover:bg-[var(--astryx-surface-variant,#f8fafc)]" id="mobile-menu-toggle">
            MENU
          </button>

          <div class="max-lg:hidden flex gap-7 items-center">
            {props.nav.items.map((item) => (
              <a href={normalizePath(item.path)} class="font-nav text-[var(--astryx-text-muted,#475569)] no-underline font-medium hover:text-[var(--astryx-primary,#1877f2)] transition-colors text-0.9rem">
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </header>
    ),

    Main: (props) => (
      <main
        id="main-content"
        class={`max-w-1200px mx-auto px-4 py-8 min-h-[60vh] ${props.class || ""}`.trim()}
      >
        {props.children}
      </main>
    ),

    Footer: (props) => (
      <footer class="border-t border-t-solid border-[var(--astryx-border,#e2e8f0)] px-[clamp(1rem,5vw,2.5rem)] py-14 mt-20 bg-[var(--astryx-surface-variant,#f8fafc)] flex-shrink-0">
        <div class="max-w-1200px mx-auto flex flex-col gap-10 px-4">
          <div class="flex flex-wrap items-center justify-between gap-8">
            <a href="/" class="font-header text-[var(--astryx-text,#0f172a)] no-underline text-1.2rem font-bold tracking-tight flex items-center gap-2.5">
              {props.site.logoSvg && (
                <img
                  src={`data:image/svg+xml,${encodeURIComponent(props.site.logoSvg)}`}
                  alt="Logo"
                  style={{
                    width: "24px",
                    height: "24px",
                    objectFit: "contain",
                  }}
                />
              )}
              <div>{props.site.title}</div>
            </a>

            <div class="flex flex-wrap gap-6 max-lg:justify-center">
              {props.footer.links.map((link) => (
                <a href={normalizePath(link.path)} class="font-nav text-[var(--astryx-text-muted,#475569)] no-underline text-0.875rem font-medium hover:text-[var(--astryx-primary,#1877f2)] transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-6 border-t border-t-solid border-[var(--astryx-border,#e2e8f0)] pt-6 max-lg:flex-col">
            <div
              class="font-body text-0.8rem text-[var(--astryx-text-muted,#475569)]"
              dangerouslySetInnerHTML={{
                __html: props.site.copyright
                  ? props.site.copyright
                    .replace(/\{year\}/g, new Date().getFullYear().toString())
                    .replace(/\{author\}/g, props.site.author || "")
                  : "",
              }}
            ></div>

            {props.site.showStatus && (
              <div class="flex opacity-75 hover:opacity-100 transition-opacity">
                <a
                  href="https://ez-edge-cms.ezinner.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-body text-0.75rem text-[var(--astryx-text-muted,#475569)] hover:text-[var(--astryx-primary,#1877f2)] no-underline uppercase tracking-wider font-semibold"
                >
                  POWERED BY EZ EDGE CMS
                </a>
              </div>
            )}
          </div>
        </div>
      </footer>
    ),
  };

  generateCssVariables(theme: ThemeConfig, isAdmin = false): string {
    const primaryHue = isAdmin ? 214 : theme?.values?.primary_hue ?? 214;
    const primarySat = isAdmin ? "89%" : theme?.values?.primary_sat ?? "89%";
    const primaryLight = isAdmin ? "52%" : theme?.values?.primary_light ?? "52%";

    const fontHeader = isAdmin ? "Inter" : theme?.values?.font_header ?? "Inter";
    const fontNav = isAdmin ? "Inter" : theme?.values?.font_nav ?? "Inter";
    const fontBody = isAdmin ? "Inter" : theme?.values?.font_body ?? "Inter";
    const fontMono = isAdmin ? "Fira Code" : theme?.values?.font_mono ?? "Fira Code";

    return minifyCss(`
      :root {
        --astryx-primary: hsl(${primaryHue}, ${primarySat}, ${primaryLight});
        --astryx-primary-hover: hsl(${primaryHue}, ${primarySat}, calc(${primaryLight} - 8%));
        --astryx-surface: #ffffff;
        --astryx-surface-variant: #f8fafc;
        --astryx-text: #0f172a;
        --astryx-text-muted: #475569;
        --astryx-border: #e2e8f0;

        --font-header: "${fontHeader}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        --font-nav: "${fontNav}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        --font-body: "${fontBody}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        --font-mono: "${fontMono}", "Consolas", "Monaco", monospace;
      }
    `);
  }

  getUnoConfig(): UserConfig {
    return createContentPreflights(this.tokens);
  }
}

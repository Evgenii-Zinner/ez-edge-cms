/** @jsxImportSource hono/jsx */
/**
 * @module AstryxThemeConnector
 * @description Theme connector for Meta's Astryx Design System (https://github.com/facebook/astryx).
 * Connects EZ EDGE CMS ThemeConfig settings to Astryx CSS tokens, preflights, and component structures.
 */

import { ThemeConfig } from "@core/schema";
import { ThemeConnector, ThemeComponents } from "../connector";
import { ThemeTokenMap } from "../tokens";
import { createContentPreflights } from "../preflights";
import { normalizePath } from "@utils/seo";
import type { UserConfig } from "unocss";

function minifyCss(css: string): string {
  return css.replace(/\s+/g, " ").trim();
}

import { createBaseThemeComponents } from "../base-components";
import { ThemeSwitcher } from "@components/ThemeSwitcher";

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

  readonly components: ThemeComponents = createBaseThemeComponents({
    systemId: "astryx",
    card: {
      container: (props) =>
        `astryx-card p-6 rounded-xl border border-solid border-[var(--astryx-border,#e2e8f0)] bg-[var(--astryx-surface,#ffffff)] shadow-sm transition-all hover:shadow-md ${props.class || ""}`.trim(),
      title:
        "text-1.25rem font-header font-bold mb-3 color-[var(--astryx-text,#0f172a)] tracking-tight",
      content:
        "color-[var(--astryx-text-muted,#475569)] text-0.95rem leading-relaxed",
    },
    button: (props) =>
      `inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium text-sm transition-all cursor-pointer border-0 bg-[var(--astryx-primary,#1877f2)] text-white hover:bg-[var(--astryx-primary-hover,#166fe5)] active:scale-98 shadow-sm ${props.class || ""}`.trim(),
    grid: (props) =>
      `grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6 my-8 ${props.class || ""}`.trim(),
    hero: {
      container:
        "relative min-h-[420px] flex items-center justify-center text-center my-10 p-12 rounded-2xl bg-gradient-to-b from-[var(--astryx-surface-variant,#f8fafc)] to-[var(--astryx-surface,#ffffff)] border border-solid border-[var(--astryx-border,#e2e8f0)] shadow-sm overflow-hidden",
      title:
        "text-3rem md:text-4.2rem font-header font-extrabold mb-5 color-[var(--astryx-text,#0f172a)] tracking-tight leading-tight",
      subtitle:
        "text-1.25rem font-body text-[var(--astryx-text-muted,#475569)] leading-relaxed max-w-2xl mx-auto",
      background: (imageUrl) => (
        <div
          class="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: `url('${imageUrl}')` }}
        ></div>
      ),
    },
    image: {
      container: (props) =>
        [
          "my-8 overflow-hidden border border-solid border-[var(--astryx-border,#e2e8f0)] rounded-xl bg-[var(--astryx-surface,#ffffff)] p-2 shadow-sm",
          props.stretched
            ? "image-stretched important-w-[calc(100%+4rem)] important-ml--8 important-mr--8 important-max-w-none"
            : "",
          props.withBorder
            ? "image-with-border important-rounded-none important-border-2 important-border-solid important-border-[var(--astryx-primary,#1877f2)]"
            : "",
          props.withBackground
            ? "image-with-background bg-[var(--astryx-surface-variant,#f8fafc)] important-p-12 flex flex-col justify-center items-center rounded-xl"
            : "",
          props.class || "",
        ]
          .filter(Boolean)
          .join(" "),
      img: "max-w-full h-auto block mx-auto rounded-lg",
      caption:
        "text-center color-[var(--astryx-text-muted,#475569)] text-0.8rem mt-2",
    },
    codeBlock: {
      container: () =>
        "my-6 rounded-xl overflow-hidden border border-solid border-[#334155] bg-[#0f172a] text-[#f8fafc] p-5 font-mono text-0.875rem shadow-md",
      title:
        "text-xs text-[#94a3b8] border-b border-solid border-[#334155]/60 pb-2.5 mb-3 font-mono tracking-wide flex items-center gap-2",
      content: "m-0 overflow-x-auto text-[#f8fafc]",
    },
    table: {
      container:
        "my-6 overflow-x-auto rounded-xl border border-solid border-[var(--astryx-border,#e2e8f0)] shadow-sm",
      table: "w-full border-collapse bg-[var(--astryx-surface,#ffffff)]",
      th: "p-4 text-left font-header font-semibold text-xs uppercase tracking-wider color-[var(--astryx-text,#0f172a)] border-b border-solid border-[var(--astryx-border,#e2e8f0)] bg-[var(--astryx-surface-variant,#f8fafc)]",
      td: "p-4 font-body text-sm color-[var(--astryx-text-muted,#475569)] border-b border-solid border-[var(--astryx-border,#e2e8f0)] last:border-0 hover:bg-[var(--astryx-surface-variant,#f8fafc)] transition-colors",
    },
    quote: {
      container:
        "my-6 p-6 rounded-r-xl border-l-4 border-solid border-[var(--astryx-primary,#1877f2)] bg-[var(--astryx-surface-variant,#f8fafc)] italic color-[var(--astryx-text,#0f172a)] shadow-sm",
      content: "m-0 text-1.1rem leading-relaxed font-body",
      caption:
        "block text-right text-xs font-medium not-italic text-[var(--astryx-text-muted,#475569)] mt-3 uppercase tracking-wider",
    },
    video: {
      container:
        "my-6 rounded-xl overflow-hidden border border-solid border-[var(--astryx-border,#e2e8f0)] shadow-sm",
      wrapper: "aspect-video w-full bg-[var(--astryx-surface-variant,#f8fafc)]",
      caption:
        "text-center text-0.8rem text-[var(--astryx-text-muted,#475569)] mt-2 italic px-4 pb-3",
    },
    delimiter:
      "border-t border-solid border-[var(--astryx-border,#e2e8f0)] w-full my-8",
    nav: {
      container:
        "flex gap-6 items-center max-lg:fixed max-lg:top-0 max-lg:right-0 max-lg:h-[100dvh] max-lg:w-280px max-lg:bg-[var(--astryx-surface,#ffffff)] max-lg:flex-col max-lg:items-start max-lg:pt-100px max-lg:p-8 max-lg:gap-6 max-lg:border-l max-lg:border-l-solid max-lg:border-l-[var(--astryx-border,#e2e8f0)] max-lg:translate-x-full max-lg:invisible max-lg:transition-all max-lg:duration-300 max-lg:ease-in-out max-lg:z-1000 max-lg:overflow-y-auto lg:hidden",
      link: "font-nav text-[var(--astryx-text-muted,#475569)] no-underline font-medium hover:text-[var(--astryx-primary,#1877f2)] transition-colors text-0.9rem max-lg:text-1.1rem max-lg:w-full max-lg:text-right",
    },
    header: {
      container:
        "sticky top-0 z-2000 border-b border-b-solid border-[var(--astryx-border,#e2e8f0)] bg-[var(--astryx-surface,#ffffff)]/85 backdrop-blur-12px shadow-xs",
      inner:
        "max-w-1200px mx-auto flex justify-between items-center px-[clamp(1rem,5vw,2.5rem)] py-3.5",
      brand:
        "font-header text-[var(--astryx-text,#0f172a)] no-underline text-1.25rem font-bold tracking-tight flex items-center gap-2.5",
      renderNavArea: (props) => (
        <>
          <button
            class="lg:hidden bg-transparent border border-solid border-[var(--astryx-border,#e2e8f0)] text-[var(--astryx-text,#0f172a)] px-3 py-1.5 rounded-md cursor-pointer font-nav text-0.8rem hover:bg-[var(--astryx-surface-variant,#f8fafc)]"
            id="mobile-menu-toggle"
          >
            MENU
          </button>
          <div class="flex items-center gap-4">
            <div class="max-lg:hidden flex gap-7 items-center">
              {props.nav.items.map((item) => (
                <a
                  href={normalizePath(item.path)}
                  class="font-nav text-[var(--astryx-text-muted,#475569)] no-underline font-medium hover:text-[var(--astryx-primary,#1877f2)] transition-colors text-0.9rem"
                >
                  {item.label}
                </a>
              ))}
            </div>
            <ThemeSwitcher styleVariant="astryx" />
          </div>
        </>
      ),
    },
    main: "max-w-1200px mx-auto px-4 py-8 min-h-[60vh]",
    footer: {
      container:
        "border-t border-t-solid border-[var(--astryx-border,#e2e8f0)] px-[clamp(1rem,5vw,2.5rem)] py-14 mt-20 bg-[var(--astryx-surface-variant,#f8fafc)] flex-shrink-0",
      inner: "max-w-1200px mx-auto flex flex-col gap-10 px-4 flex-wrap",
      text: "text-[var(--astryx-text-muted,#475569)] text-0.95rem text-center md:text-left flex-1",
      navContainer:
        "flex flex-wrap gap-x-8 gap-y-4 justify-center md:justify-end flex-1",
      link: "font-nav text-[var(--astryx-text-muted,#475569)] no-underline hover:text-[var(--astryx-primary,#1877f2)] transition-colors font-medium text-0.95rem",
    },
  });

  generateCssVariables(theme: ThemeConfig, isAdmin = false): string {
    const fontHeader = isAdmin
      ? "Inter"
      : (theme?.values?.font_header ?? "Inter");
    const fontNav = isAdmin ? "Inter" : (theme?.values?.font_nav ?? "Inter");
    const fontBody = isAdmin ? "Inter" : (theme?.values?.font_body ?? "Inter");
    const fontMono = isAdmin
      ? "Fira Code"
      : (theme?.values?.font_mono ?? "Fira Code");

    return minifyCss(`
      :root {
        --astryx-primary: #1877f2;
        --astryx-primary-hover: #166fe5;
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

      html, body {
        background-color: var(--astryx-surface, #ffffff);
        color: var(--astryx-text, #0f172a);
      }

      [data-theme='dark'] {
        --astryx-surface: #0f172a;
        --astryx-surface-variant: #1e293b;
        --astryx-text: #f8fafc;
        --astryx-text-muted: #94a3b8;
        --astryx-border: #334155;
      }

      [data-theme='dark'] body,
      [data-theme='dark'] #main-content {
        background-color: #0f172a !important;
        color: #f8fafc !important;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme='light']) {
          --astryx-surface: #0f172a;
          --astryx-surface-variant: #1e293b;
          --astryx-text: #f8fafc;
          --astryx-text-muted: #94a3b8;
          --astryx-border: #334155;
        }
        :root:not([data-theme='light']) body,
        :root:not([data-theme='light']) #main-content {
          background-color: #0f172a !important;
          color: #f8fafc !important;
        }
      }

      /* Theme Switcher Icon Toggle Rules */
      #theme-toggle .light-icon { display: none; }
      #theme-toggle .dark-icon { display: block; }
      [data-theme="dark"] #theme-toggle .light-icon { display: block !important; }
      [data-theme="dark"] #theme-toggle .dark-icon { display: none !important; }

      /* Astryx Connector List Typography */
      #main-content ul,
      #main-content .list-bullet {
        list-style-type: disc !important;
        margin: 1.25rem 0;
        padding-left: 1.75rem;
      }
      #main-content ul > li,
      #main-content .list-bullet > li {
        list-style-type: disc !important;
        margin-bottom: 0.5rem;
        line-height: 1.7;
        color: var(--astryx-text-muted, #475569);
      }

      #main-content ol,
      #main-content .list-number {
        list-style-type: decimal !important;
        margin: 1.25rem 0;
        padding-left: 1.75rem;
      }
      #main-content ol > li,
      #main-content .list-number > li {
        list-style-type: decimal !important;
        margin-bottom: 0.5rem;
        line-height: 1.7;
        color: var(--astryx-text-muted, #475569);
      }
    `);
  }

  getUnoConfig(): UserConfig {
    return createContentPreflights(this.tokens);
  }
}

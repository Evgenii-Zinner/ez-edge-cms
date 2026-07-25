/** @jsxImportSource hono/jsx */
/**
 * @module DefaultThemeConnector
 * @description Fallback/Standalone styling system connector for EZ EDGE CMS.
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

export class DefaultThemeConnector implements ThemeConnector {
  readonly id = "default";
  readonly name = "Default Standalone Theme";

  readonly tokens: ThemeTokenMap = {
    primary: "var(--theme-accent, #00ffff)",
    primaryHover: "var(--theme-accent, #00ffff)",
    surface: "var(--theme-bg, #050a0a)",
    surfaceVariant: "var(--theme-surface, rgba(10,26,26,0.7))",
    text: "var(--theme-text-main, #e0f2f2)",
    textMuted: "var(--theme-text-dim, #a0baba)",
    border: "var(--theme-accent-glow, rgba(0,255,255,0.2))",
    fontHeader: "var(--font-header)",
    fontBody: "var(--font-body)",
    fontMono: "var(--font-mono)",
  };

  readonly components: ThemeComponents = {
    Card: (props) => (
      <div class={`admin-card ${props.class || ""}`.trim()}>
        {props.title && <h3 class="m-0 mb-3">{props.title}</h3>}
        {props.children}
      </div>
    ),

    Button: (props) => (
      <button type={(props.type as any) || "button"} class={`btn-primary ${props.class || ""}`.trim()}>
        {props.children}
      </button>
    ),

    Grid: (props) => (
      <div class={`bento-grid ${props.class || ""}`.trim()}>
        {props.children}
      </div>
    ),

    Hero: (props) => (
      <div class="relative min-h-[400px] flex items-center justify-center text-center my-8 p-8 border border-solid border-[var(--theme-accent-glow)] bg-[var(--theme-surface)]">
        <div class="relative z-10 max-w-4xl">
          <h1 class="text-3rem font-header mb-4 text-[var(--theme-accent)]">{props.title || ""}</h1>
          {props.subtitle && <p class="text-1.2rem font-nav opacity-90">{props.subtitle}</p>}
        </div>
      </div>
    ),

    CodeBlock: (props) => (
      <div class="admin-card font-mono text-0.9rem bg-[rgba(0,0,0,0.5)] border-solid my-6 p-4 overflow-x-auto">
        {props.filename && <div class="text-xs text-[var(--theme-text-dim)] border-b border-solid border-[var(--theme-accent-glow)] pb-2 mb-2">{props.filename}</div>}
        <pre><code class={props.language || ""}>{props.code}</code></pre>
      </div>
    ),

    Table: (props) => {
      const rows = props.rows || [];
      const withHeadings = props.withHeadings || false;
      const getCells = (r: any) => (Array.isArray(r) ? r : Array.isArray(r?.cells) ? r.cells : []);
      return (
        <div class="overflow-x-auto my-6">
          <table class="w-full border-collapse">
            {withHeadings && rows.length > 0 && (
              <thead>
                <tr class="border-b border-b-solid border-[var(--theme-accent-glow)]">
                  {getCells(rows[0]).map((cell: any) => (
                    <th class="p-3 text-left font-header color-[var(--theme-accent)]">{cell || ""}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.slice(withHeadings ? 1 : 0).map((r: any) => (
                <tr class="border-b border-b-solid border-[var(--theme-accent-glow)] last:border-0">
                  {getCells(r).map((cell: any) => (
                    <td class="p-3 font-body color-[var(--theme-text-main)]">{cell || ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },

    Quote: (props) => (
      <blockquote class="my-6 p-4 border-l-4 border-solid border-[var(--theme-accent)] bg-[var(--theme-surface)] italic">
        {props.text}
        {props.caption && <div class="text-right text-xs opacity-70 mt-2">— {props.caption}</div>}
      </blockquote>
    ),

    Overlays: () => (
      <>
        <div class="ui-overlay scanlines"></div>
        <div class="ui-overlay dots"></div>
        <div class="ui-overlay dots-interactive"></div>
      </>
    ),

    Nav: (props) => (
      <nav class="main-nav lg:hidden" id="main-nav">
        {props.nav.items.map((item) => (
          <a href={normalizePath(item.path)} class="nav-link">
            {item.label}
          </a>
        ))}
      </nav>
    ),

    Header: (props) => (
      <header class="main-header">
        <div class="header-content">
          <a href="/" class="logo flex items-center gap-2">
            {props.site.logoSvg && (
              <img
                src={`data:image/svg+xml,${encodeURIComponent(props.site.logoSvg)}`}
                alt="Logo"
                style={{
                  width: "32px",
                  height: "32px",
                  objectFit: "contain",
                  filter: "drop-shadow(0 0 5px var(--theme-accent))",
                }}
              />
            )}
            <div>{props.site.title}</div>
          </a>

          <button class="menu-toggle" id="mobile-menu-toggle">
            MENU
          </button>

          <div class="max-lg:hidden flex gap-6 items-center">
            {props.nav.items.map((item) => (
              <a href={normalizePath(item.path)} class="nav-link">
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

    Image: (props) => {
      const wrapperClasses = [
        "content-frame",
        props.stretched ? "image-stretched" : "",
        props.withBorder ? "image-with-border" : "",
        props.withBackground ? "image-with-background" : "",
        props.class || "",
      ]
        .filter(Boolean)
        .join(" ");

      return (
        <div class={wrapperClasses}>
          <img src={props.src} alt={props.alt || ""} class="content-img" loading="lazy" />
          {props.caption && (
            <div style={{ textAlign: "center", color: "var(--theme-text-dim)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
              {props.caption}
            </div>
          )}
        </div>
      );
    },

    Footer: (props) => (
      <footer class="main-footer">
        <div class="footer-content px-8 flex flex-col gap-8">
          <div class="flex flex-wrap items-center justify-between gap-8">
            <a href="/" class="logo flex items-center gap-2 text-1.2rem">
              {props.site.logoSvg && (
                <img
                  src={`data:image/svg+xml,${encodeURIComponent(props.site.logoSvg)}`}
                  alt="Logo"
                  style={{
                    width: "24px",
                    height: "24px",
                    objectFit: "contain",
                    filter: "drop-shadow(0 0 3px var(--theme-accent))",
                  }}
                />
              )}
              <div>{props.site.title}</div>
            </a>

            <div class="footer-links flex gap-6">
              {props.footer.links.map((link) => (
                <a href={normalizePath(link.path)} class="footer-link">
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div class="footer-bottom">
            <div
              class="footer-copyright"
              dangerouslySetInnerHTML={{
                __html: props.site.copyright
                  ? props.site.copyright
                      .replace(/\{year\}/g, new Date().getFullYear().toString())
                      .replace(/\{author\}/g, props.site.author || "")
                  : "",
              }}
            ></div>

            {props.site.showStatus && (
              <div class="branding-wrapper">
                <a
                  href="https://ez-edge-cms.ezinner.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="branding-link group"
                  style={{ border: "none", background: "none", padding: 0 }}
                >
                  <span class="font-nav text-0.75rem tracking-2px text-[var(--theme-text-dim)] group-hover:text-[var(--theme-accent)] transition-colors uppercase">
                    POWERED BY EZ EDGE CMS
                  </span>
                </a>
              </div>
            )}
          </div>
        </div>
      </footer>
    ),
  };

  generateCssVariables(theme: ThemeConfig, isAdmin = false): string {
    if (isAdmin) {
      return minifyCss(`
        :root {
          --theme-primary-hue: 180;
          --theme-primary-sat: 70%;
          --theme-primary-light: 50%;
          
          --theme-accent: #00ffff;
          --theme-accent-glow: rgba(0, 255, 255, 0.4);
          --theme-accent-dim: rgba(0, 255, 255, 0.1);
          
          --theme-bg: #050a0a;
          --theme-surface: rgba(10, 26, 26, 0.7);
          --theme-surface-solid: #0a1a1a;
          --theme-text-main: #e0f2f2;
          --theme-text-dim: #a0baba;
          
          --font-header: "Orbitron", sans-serif;
          --font-nav: "Chakra Petch", sans-serif;
          --font-body: "Roboto", sans-serif;
          --font-mono: "Fira Code", monospace;
          
          --ui-glow-spread: 10px;
          --ui-boot-speed: 0.8s;
          --ui-elevation: 20px;

          --color-success: #00ff00;
          --color-error: #ff4444;
          --color-warning: #ffcc00;
          --color-info: #00ccff;
        }
      `);
    }

    const { values } = theme;
    return minifyCss(`
      :root {
        --theme-primary-hue: ${values.primary_hue};
        --theme-primary-sat: ${values.primary_sat};
        --theme-primary-light: ${values.primary_light};
        
        --theme-accent: hsl(var(--theme-primary-hue), var(--theme-primary-sat), var(--theme-primary-light));
        --theme-accent-glow: hsla(var(--theme-primary-hue), var(--theme-primary-sat), var(--theme-primary-light), 0.4);
        --theme-accent-dim: hsla(var(--theme-primary-hue), var(--theme-primary-sat), var(--theme-primary-light), 0.1);
        
        --theme-bg: hsl(var(--theme-primary-hue), ${values.bg_sat}, ${values.bg_light});
        --theme-surface: hsla(var(--theme-primary-hue), ${values.surface_sat}, ${values.surface_light}, ${values.surface_opacity});
        --theme-surface-solid: hsl(var(--theme-primary-hue), ${values.surface_sat}, ${values.surface_light});
        --theme-text-main: hsl(var(--theme-primary-hue), ${values.text_main_sat}, ${values.text_main_light});
        --theme-text-dim: hsl(var(--theme-primary-hue), ${values.text_dim_sat}, ${values.text_dim_light});
        
        --font-header: "${values.font_header}", sans-serif;
        --font-nav: "${values.font_nav}", sans-serif;
        --font-body: "${values.font_body}", sans-serif;
        --font-mono: "${values.font_mono}", monospace;
        
        --ui-glow-spread: ${values.glow_spread};
        --ui-boot-speed: ${values.boot_speed};
        --ui-elevation: ${values.elevation};
      }
    `);
  }

  getUnoConfig(): UserConfig {
    return createContentPreflights(this.tokens);
  }
}

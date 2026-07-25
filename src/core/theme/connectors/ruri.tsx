/** @jsxImportSource hono/jsx */
/**
 * @module RuriThemeConnector
 * @description Theme connector for the Ruri UI design system (https://github.com/Evgenii-Zinner/ruri).
 * Connects EZ EDGE CMS ThemeConfig settings to Ruri UI CSS variables and UnoCSS presets,
 * ensuring the CMS dynamic theme controls drive Ruri's native OKLCH engine seamlessly.
 */

import { ThemeConfig } from "@core/schema";
import { ThemeConnector, ThemeComponents } from "../connector";
import { ThemeTokenMap } from "../tokens";
import { createContentPreflights } from "../preflights";
import {
  Panel,
  Button,
  Hero,
  Bento,
  Container,
  Header,
  Footer,
  HoneycombImage,
  RURI_CORE_CSS_TOKENS,
} from "ruri-ui";
import { normalizePath } from "@utils/seo";
import type { UserConfig } from "unocss";

function minifyCss(css: string): string {
  return css.replace(/\s+/g, " ").trim();
}

export class RuriThemeConnector implements ThemeConnector {
  readonly id = "ruri";
  readonly name = "Ruri UI Design System";

  readonly tokens: ThemeTokenMap = {
    primary: "var(--ruri-primary)",
    surface: "var(--ruri-bg-surface)",
    surfaceVariant: "var(--ruri-bg-surface-variant)",
    text: "var(--ruri-text-main)",
    textMuted: "var(--ruri-text-muted)",
    border: "var(--ruri-border-outline)",
    fontHeader: "var(--font-header)",
    fontBody: "var(--font-body)",
    fontMono: "var(--font-mono)",
  };

  readonly components: ThemeComponents = {
    Card: (props) => (
      <Panel
        shape={(props.shape as any) || "sci-fi"}
        glow={props.glow !== false}
        title={props.title}
        status={props.status}
        class={props.class || ""}
      >
        {props.children}
      </Panel>
    ),

    Button: (props) => (
      <Button
        shape={(props.shape as any) || "cyber"}
        variant={(props.variant as any) || "default"}
        type={(props.type as any) || "button"}
        class={props.class || ""}
      >
        {props.children}
      </Button>
    ),

    Grid: (props) => (
      <Bento
        cols={(props.cols as any) || 3}
        gap={(props.gap as any) || "md"}
        class={props.class || ""}
      >
        {props.children}
      </Bento>
    ),

    Hero: (props) => (
      <Hero
        title={props.title || ""}
        subtitle={props.subtitle}
        imageUrl={props.imageUrl}
        shape={(props.shape as any) || "sci-fi"}
        glow={props.glow !== false}
        class={props.class || ""}
      />
    ),

    Image: (props) => (
      <HoneycombImage
        src={props.src}
        alt={props.alt || ""}
        headerText={props.caption || "TACTICAL MEDIA"}
        class={props.class || "my-6"}
      />
    ),

    CodeBlock: (props) => (
      <Panel shape="rectangle" class="my-6 font-mono text-0.85rem">
        {props.filename && (
          <div class="text-xs text-[var(--ruri-text-muted)] border-b border-ruriOutline pb-2 mb-3 tracking-widest uppercase">
            // FILE: {props.filename}
          </div>
        )}
        <pre class="m-0 overflow-x-auto"><code class={props.language || ""}>{props.code}</code></pre>
      </Panel>
    ),

    Table: (props) => {
      const rows = props.rows || [];
      const withHeadings = props.withHeadings || false;
      const getCells = (r: any) => (Array.isArray(r) ? r : Array.isArray(r?.cells) ? r.cells : []);
      return (
        <Panel shape="rectangle" class="my-6 overflow-x-auto p-0">
          <table class="w-full border-collapse">
            {withHeadings && rows.length > 0 && (
              <thead>
                <tr class="border-b border-ruriOutline bg-ruriSurfaceVariant/50">
                  {getCells(rows[0]).map((cell: any) => (
                    <th class="p-3 text-left font-mono text-xs uppercase tracking-wider color-[var(--ruri-primary)]">{cell || ""}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.slice(withHeadings ? 1 : 0).map((r: any) => (
                <tr class="border-b border-ruriOutline/40 last:border-0 hover:bg-ruriSurfaceVariant/30 transition-colors">
                  {getCells(r).map((cell: any) => (
                    <td class="p-3 font-body text-sm color-[var(--ruri-text-main)]">{cell || ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      );
    },

    Quote: (props) => (
      <Panel shape="sci-fi" class="my-6 italic">
        <p class="m-0 text-1rem leading-relaxed">"{props.text}"</p>
        {props.caption && (
          <div class="text-right text-xs font-mono text-[var(--ruri-text-muted)] mt-2 uppercase tracking-widest">
            — {props.caption}
          </div>
        )}
      </Panel>
    ),

    Overlays: () => (
      <>
        <div class="ui-overlay scanlines"></div>
        <div class="ui-overlay dots"></div>
        <div class="ui-overlay dots-interactive"></div>
      </>
    ),

    Nav: (props) => (
      <nav class="flex gap-6 items-center max-lg:fixed max-lg:top-0 max-lg:right-0 max-lg:h-[100dvh] max-lg:w-280px max-lg:bg-[var(--ruri-bg-surface-variant)] max-lg:backdrop-blur-20px max-lg:flex-col max-lg:items-start max-lg:pt-100px max-lg:p-8 max-lg:gap-6 max-lg:border-l max-lg:border-l-solid max-lg:border-l-[var(--ruri-border-outline)] max-lg:translate-x-full max-lg:invisible max-lg:transition-all max-lg:duration-300 max-lg:ease-in-out max-lg:z-1000 max-lg:overflow-y-auto lg:hidden" id="main-nav">
        {props.nav.items.map((item) => (
          <a href={normalizePath(item.path)} class="font-nav text-[var(--ruri-text-muted)] no-underline tracking-1px uppercase transition-all duration-300 border-b border-b-solid border-transparent hover:text-[var(--ruri-primary)] hover:border-b-[var(--ruri-primary)] text-0.85rem py-0.2 max-lg:text-1.2rem max-lg:tracking-2px max-lg:w-full max-lg:text-right">
            {item.label}
          </a>
        ))}
      </nav>
    ),

    Header: (props) => (
      <Header
        brandName={props.site.title}
        logo={
          props.site.logoSvg ? (
            <img
              src={`data:image/svg+xml,${encodeURIComponent(props.site.logoSvg)}`}
              alt="Logo"
              style={{
                width: "28px",
                height: "28px",
                objectFit: "contain",
                filter: "drop-shadow(0 0 5px var(--ruri-primary))",
              }}
            />
          ) : undefined
        }
        navItems={props.nav.items.map((item) => ({
          label: item.label,
          href: normalizePath(item.path),
          active: item.path === props.currentPath,
        }))}
      />
    ),

    Main: (props) => (
      <main id="main-content" class={props.class || ""}>
        <Container size="xl" class="py-8 min-h-[60vh]">
          {props.children}
        </Container>
      </main>
    ),

    Footer: (props) => (
      <Footer
        brandName={props.site.title}
        logo={
          props.site.logoSvg ? (
            <img
              src={`data:image/svg+xml,${encodeURIComponent(props.site.logoSvg)}`}
              alt="Logo"
              style={{
                width: "24px",
                height: "24px",
                objectFit: "contain",
              }}
            />
          ) : undefined
        }
        links={props.footer.links.map((link) => ({
          label: link.label,
          href: normalizePath(link.path),
        }))}
        copyright={
          props.site.copyright
            ? props.site.copyright
                .replace(/\{year\}/g, new Date().getFullYear().toString())
                .replace(/\{author\}/g, props.site.author || "")
            : undefined
        }
        poweredBy={props.site.showStatus}
      />
    ),
  };

  generateCssVariables(theme: ThemeConfig, isAdmin = false): string {
    const primaryHue = isAdmin ? 180 : theme?.values?.primary_hue ?? 210;
    const glowSpread = isAdmin ? "10px" : theme?.values?.glow_spread ?? "5px";

    const fontHeader = isAdmin ? "Orbitron" : theme?.values?.font_header ?? "Orbitron";
    const fontNav = isAdmin ? "Chakra Petch" : theme?.values?.font_nav ?? "Chakra Petch";
    const fontBody = isAdmin ? "Roboto" : theme?.values?.font_body ?? "Roboto";
    const fontMono = isAdmin ? "Fira Code" : theme?.values?.font_mono ?? "Fira Code";

    return minifyCss(`
      ${RURI_CORE_CSS_TOKENS}

      :root {
        --ruri-primary-h: ${primaryHue};
        --ruri-glow-blur: ${glowSpread};

        --font-header: "${fontHeader}", sans-serif;
        --font-nav: "${fontNav}", sans-serif;
        --font-body: "${fontBody}", sans-serif;
        --font-mono: "${fontMono}", "Consolas", "Monaco", monospace;
      }
    `);
  }

  getUnoConfig(): UserConfig {
    return createContentPreflights(this.tokens);
  }
}

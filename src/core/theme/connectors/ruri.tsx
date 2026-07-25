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
  Grid,
  Container,
  Header,
  Footer,
  HoneycombImage,
  Table,
  CodeBlock,
  Callout,
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

    Grid: (props) => {
      console.log("RURI GRID PROPS", props);
      return (
      <Grid
        cols={(props.cols as any) || { sm: 1, md: 3 }}
        gap={(props.gap as any) || 6}
        class={props.class || ""}
      >
        {props.children}
      </Grid>
    )},

    Hero: (props) => {
      const cleanTitle = typeof props.title === "string"
        ? props.title.replace(/<br\s*\/?>/gi, " ")
        : props.title;

      return (
        <Hero
          title={cleanTitle || ""}
          subtitle={props.subtitle}
          imageUrl={props.imageUrl}
          shape={(props.shape as any) || "sci-fi"}
          glow={props.glow !== false}
          class={props.class || ""}
        />
      );
    },

    Image: (props) => (
      <HoneycombImage
        src={props.src}
        alt={props.alt || ""}
        headerText={props.caption || "TACTICAL MEDIA"}
        class={props.class || "my-6"}
      />
    ),

    CodeBlock: (props) => (
      <Panel
        shape="rectangle"
        title={props.filename ? `// FILE: ${props.filename}` : undefined}
        class="my-6"
      >
        <CodeBlock class={props.language || ""}>
          {props.code}
        </CodeBlock>
      </Panel>
    ),

    Table: (props) => {
      const rows = props.rows || [];
      const withHeadings = props.withHeadings || false;
      const getCells = (r: any) => (Array.isArray(r) ? r : Array.isArray(r?.cells) ? r.cells : []);
      const headers = withHeadings && rows.length > 0 ? getCells(rows[0]) : undefined;
      const dataRows = (withHeadings ? rows.slice(1) : rows).map(getCells);

      return (
        <Table
          headers={headers}
          rows={dataRows}
          gridLines={true}
          striped={true}
        />
      );
    },

    Quote: (props) => (
      <Callout
        variant="primary"
        title={props.caption ? `— ${props.caption}` : undefined}
        class="my-6"
      >
        "{props.text}"
      </Callout>
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
        <Container size="lg" class="py-8 min-h-[60vh]">
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
        --font-nav: "${fontNav}", "${fontHeader}", sans-serif;
        --font-body: "${fontBody}", sans-serif;
        --font-mono: "${fontMono}", "Consolas", "Monaco", monospace;
      }
    `);
  }

  getUnoConfig(): UserConfig {
    return createContentPreflights(this.tokens);
  }
}

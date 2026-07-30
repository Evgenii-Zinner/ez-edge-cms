/** @jsxImportSource hono/jsx */
import { describe, expect, it } from "bun:test";
import { AstryxThemeConnector } from "../../../src/core/theme";
import { createDefaultTheme,
  createDefaultSite,
  createDefaultNav,
  createDefaultFooter,
} from "../../../src/core/factory";

describe("Astryx Theme Connector", () => {
  const theme = createDefaultTheme();
  const site = createDefaultSite();
  const nav = createDefaultNav();
  const footer = createDefaultFooter();
  const astryx = new AstryxThemeConnector();

  it("should generate CSS variables for user mode", () => {
    const css = astryx.generateCssVariables(theme, false);
    expect(css).toContain("--astryx-primary");
  });

  it("should generate CSS variables for admin mode", () => {
    const css = astryx.generateCssVariables(theme, true);
    expect(css).toContain("--astryx-primary");
  });

  it("should return a valid UnoCSS config from getUnoConfig", () => {
    const config = astryx.getUnoConfig();
    expect(config).toBeDefined();
  });

  // All component tests use direct function calls (not JSX) because Hono's JSX
  // only creates a descriptor object and never invokes the component function body.
  it("should invoke Card component", () => {
    const result = astryx.components.Card({ title: "Astryx Card", class: "custom", children: "Body" });
    expect(result).toBeDefined();
  });

  it("should invoke Button component", () => {
    const result = astryx.components.Button({ class: "my-btn", children: "Submit" });
    expect(result).toBeDefined();
  });

  it("should invoke Grid component", () => {
    const result = astryx.components.Grid({ class: "my-grid", children: "items" });
    expect(result).toBeDefined();
  });

  it("should invoke Hero component with imageUrl (background branch)", () => {
    const result = astryx.components.Hero({ title: "Astryx Hero", subtitle: "Welcome", imageUrl: "/hero.jpg" });
    expect(result).toBeDefined();
  });

  it("should invoke Hero component without imageUrl", () => {
    const result = astryx.components.Hero({ title: "No BG", subtitle: "Sub" });
    expect(result).toBeDefined();
  });

  it("should invoke Image component with all style branches", () => {
    const result = astryx.components.Image!({
      src: "/pic.png",
      alt: "Pic",
      caption: "A caption",
      stretched: true,
      withBorder: true,
      withBackground: true,
      class: "img-class",
    });
    expect(result).toBeDefined();
  });

  it("should invoke CodeBlock component", () => {
    const result = astryx.components.CodeBlock({ code: "let x = 1;", language: "ts", filename: "app.ts" });
    expect(result).toBeDefined();
  });

  it("should invoke Table component", () => {
    const result = astryx.components.Table({
      rows: [["Col1", "Col2"], ["Val1", "Val2"]],
      withHeadings: true,
    });
    expect(result).toBeDefined();
  });

  it("should invoke Quote component", () => {
    const result = astryx.components.Quote({ text: "A quote", caption: "Author" });
    expect(result).toBeDefined();
  });

  it("should invoke Video component with embedUrl", () => {
    const result = astryx.components.Video({ url: "https://youtube.com/watch?v=x", embedUrl: "https://youtube.com/embed/x", caption: "Video" });
    expect(result).toBeDefined();
  });

  it("should invoke Embed component", () => {
    const result = astryx.components.Embed({ embed: "https://example.com", caption: "Embed" });
    expect(result).toBeDefined();
  });

  it("should invoke Delimiter component", () => {
    const result = astryx.components.Delimiter({});
    expect(result).toBeDefined();
  });

  it("should invoke Overlays component", () => {
    const result = astryx.components.Overlays({});
    expect(result).toBeDefined();
  });

  it("should invoke Nav component", () => {
    const result = astryx.components.Nav!({ nav: nav } as any);
    expect(result).toBeDefined();
  });

  it("should invoke Header component with renderNavArea", () => {
    const result = astryx.components.Header({ site: site, nav: nav, title: site.title, currentPath: "/" } as any);
    expect(result).toBeDefined();
  });

  it("should invoke Main component", () => {
    const result = astryx.components.Main({ children: "content", class: "main-class" });
    expect(result).toBeDefined();
  });

  it("should invoke Footer component", () => {
    const result = astryx.components.Footer({ site: site, footer: footer } as any);
    expect(result).toBeDefined();
  });
});

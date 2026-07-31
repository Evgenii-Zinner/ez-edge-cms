/** @jsxImportSource hono/jsx */
import { describe, expect, it } from "bun:test";
import { RuriThemeConnector } from "../../../src/core/theme";
import {
  createDefaultTheme,
  createDefaultSite,
  createDefaultNav,
  createDefaultFooter,
} from "../../../src/core/factory";

describe("Ruri Theme Connector", () => {
  const theme = createDefaultTheme();
  const site = createDefaultSite();
  const nav = createDefaultNav();
  const footer = createDefaultFooter();
  const ruri = new RuriThemeConnector();

  it("should generate CSS variables for user mode", () => {
    const css = ruri.generateCssVariables(theme, false);
    expect(css).toContain("--font-header");
    expect(css).toContain("Orbitron");
  });

  it("should generate CSS variables for admin mode", () => {
    const css = ruri.generateCssVariables(theme, true);
    expect(css).toContain("Orbitron");
  });

  it("should return a valid UnoCSS config from getUnoConfig", () => {
    const config = ruri.getUnoConfig();
    expect(config).toBeDefined();
    expect(config.shortcuts).toBeDefined();
    expect(config.preflights).toBeDefined();
    expect(Array.isArray(config.rules)).toBe(true);
    expect(Array.isArray(config.safelist)).toBe(true);
  });

  // All component tests use direct function calls (not JSX) because Hono's JSX
  // only creates a descriptor object and never invokes the component function body.
  it("should invoke Card component", () => {
    const result = ruri.components.Card({
      title: "Test Card",
      status: "ACTIVE",
      children: "Content",
    } as any);
    expect(result).toBeDefined();
  });

  it("should invoke Button component with all props", () => {
    const result = ruri.components.Button({
      shape: "cyber" as any,
      variant: "default" as any,
      class: "my-custom-btn",
      type: "submit" as any,
      children: "Submit",
    });
    expect(result).toBeDefined();
  });

  it("should invoke Grid component", () => {
    const result = ruri.components.Grid({
      cols: { sm: 1, md: 2 } as any,
      gap: 4 as any,
      class: "my-grid",
      children: null,
    });
    expect(result).toBeDefined();
  });

  it("should invoke Hero component with sanitized title", () => {
    const result = ruri.components.Hero({
      title: "Hello<br/>World",
      subtitle: "Subtitle",
    });
    expect(result).toBeDefined();
  });

  it("should invoke Image component", () => {
    const result = ruri.components.Image!({
      src: "/pic.png",
      alt: "Pic",
      caption: "Cap",
      class: "img",
    });
    expect(result).toBeDefined();
  });

  it("should invoke CodeBlock component", () => {
    const result = ruri.components.CodeBlock({
      code: "const x = 1;",
      language: "ts",
      filename: "index.ts",
    });
    expect(result).toBeDefined();
  });

  it("should invoke Table component with headers and rows", () => {
    const result = ruri.components.Table({
      rows: [
        ["A", "B"],
        ["1", "2"],
      ],
      withHeadings: true,
    });
    expect(result).toBeDefined();
  });

  it("should invoke Quote component", () => {
    const result = ruri.components.Quote({
      text: "Famous quote",
      caption: "Author",
    });
    expect(result).toBeDefined();
  });

  it("should invoke Video component with embedUrl", () => {
    const result = ruri.components.Video({
      url: "https://youtube.com/watch?v=x",
      embedUrl: "https://youtube.com/embed/x",
      caption: "Video",
    });
    expect(result).toBeDefined();
  });

  it("should invoke Video component without embedUrl (html5 fallback)", () => {
    const result = ruri.components.Video({
      url: "/video.mp4",
      caption: "HTML5",
    });
    expect(result).toBeDefined();
  });

  it("should invoke Embed component", () => {
    const result = ruri.components.Embed({
      embed: "https://example.com",
      caption: "Embed",
    });
    expect(result).toBeDefined();
  });

  it("should invoke Delimiter component", () => {
    const result = ruri.components.Delimiter({});
    expect(result).toBeDefined();
  });

  it("should invoke Header component", () => {
    const result = ruri.components.Header({
      site: site,
      nav: nav,
      title: site.title,
      currentPath: "/",
    } as any);
    expect(result).toBeDefined();
  });

  it("should invoke Footer component", () => {
    const result = ruri.components.Footer({
      site: site,
      footer: footer,
    } as any);
    expect(result).toBeDefined();
  });

  it("should invoke Main component", () => {
    const result = ruri.components.Main({ children: "Hello", class: "custom" });
    expect(result).toBeDefined();
  });
});

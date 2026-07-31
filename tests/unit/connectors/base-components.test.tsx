/** @jsxImportSource hono/jsx */
import { describe, it, expect } from "bun:test";
import {
  createBaseThemeComponents,
  type ThemeStyleInjections,
} from "../../../src/core/theme/base-components";
import { createContentPreflights } from "../../../src/core/theme/preflights";
import { RuriThemeConnector } from "../../../src/core/theme/connectors/ruri";

const ruriConnector = new RuriThemeConnector();

describe("Base Theme Components & Preflights", () => {
  const dummyStyles: ThemeStyleInjections = {
    card: {
      container: () => "card-container",
      title: "card-title",
      content: "card-content",
      renderDecorations: () => <div class="dec">Decoration</div>,
    },
    button: () => "btn-class",
    grid: () => "grid-class",
    hero: {
      container: "hero-container",
      title: "hero-title",
      subtitle: "hero-subtitle",
      background: (url: string) => <div class="bg">{url}</div>,
      renderDecorations: () => <div class="hero-dec">Hero Dec</div>,
    },
    image: {
      container: () => "img-container",
      img: "img-class",
      caption: "img-caption",
    },
    codeBlock: {
      container: () => "code-container",
      title: "code-title",
      content: "code-content",
    },
    table: {
      container: "table-container",
      table: "table-class",
      th: "th-class",
      td: "td-class",
    },
    quote: {
      container: "quote-container",
      content: "quote-content",
      caption: "quote-caption",
    },
    video: {
      container: "video-container",
      wrapper: "video-wrapper",
      caption: "video-caption",
    },
    delimiter: "delimiter-class",
    nav: {
      container: "nav-container",
      link: "nav-link",
    },
    header: {
      container: "header-container",
      inner: "header-inner",
      brand: "header-brand",
      logoClass: "logo-class",
      renderNavArea: () => <div class="nav-area">Nav Area</div>,
    },
    main: "main-class",
    footer: {
      container: "footer-container",
      inner: "footer-inner",
      text: "footer-text",
      navContainer: "footer-nav",
      link: "footer-link",
    },
    overlays: () => <div class="overlay">Overlay</div>,
    systemId: "ruri",
  };

  const Components = createBaseThemeComponents(dummyStyles);

  it("should render Base Component Card", () => {
    const card = Components.Card({
      title: "Test Card",
      children: "Card Content",
    });
    expect(card).toBeDefined();
  });

  it("should render Base Component Button", () => {
    const btn = Components.Button({ type: "submit", children: "Submit" });
    expect(btn).toBeDefined();
  });

  it("should render Base Component Grid", () => {
    const grid = Components.Grid({ children: "Grid Content" });
    expect(grid).toBeDefined();
  });

  it("should render Base Component Hero", () => {
    const hero = Components.Hero({
      title: "Hero Title",
      subtitle: "Hero Subtitle",
      imageUrl: "/hero.jpg",
      children: "Hero Extra",
    } as any);
    expect(hero).toBeDefined();
  });

  it("should render Base Component Image", () => {
    const img = Components.Image!({
      src: "/pic.png",
      alt: "Pic",
      caption: "Caption",
    });
    expect(img).toBeDefined();
  });

  it("should render Base Component CodeBlock", () => {
    const code = Components.CodeBlock({
      filename: "app.ts",
      language: "ts",
      code: "const x = 1;",
    });
    expect(code).toBeDefined();
  });

  it("should render Base Component Table with and without headings", () => {
    const tableWithHeadings = Components.Table({
      withHeadings: true,
      rows: [
        ["Col 1", "Col 2"],
        ["Val 1", "Val 2"],
      ],
    });
    const tableWithoutHeadings = Components.Table({
      withHeadings: false,
      rows: [["Val A", "Val B"]],
    });
    expect(tableWithHeadings).toBeDefined();
    expect(tableWithoutHeadings).toBeDefined();
  });

  it("should render Base Component Quote", () => {
    const quote = Components.Quote({ text: "Quote text", caption: "Author" });
    expect(quote).toBeDefined();
  });

  it("should render Base Component Video (embedUrl and html5)", () => {
    const embedVideo = Components.Video({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      caption: "Cap",
    });
    const html5Video = Components.Video({ url: "/video.mp4", caption: "Cap" });
    expect(embedVideo).toBeDefined();
    expect(html5Video).toBeDefined();
  });

  it("should render Base Component Embed", () => {
    const embed = Components.Embed({
      embed: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      caption: "Embed",
    });
    expect(embed).toBeDefined();
  });

  it("should render Base Component Delimiter and Overlays", () => {
    const delimiter = Components.Delimiter({} as any);
    const overlays = Components.Overlays({} as any);
    expect(delimiter).toBeDefined();
    expect(overlays).toBeDefined();
  });

  it("should render Base Component Nav, Header, Main, Footer", () => {
    const nav = Components.Nav!({
      nav: { items: [{ label: "Home", path: "/" }] },
    } as any);
    const header = Components.Header({
      title: "My Site",
      nav: { items: [] },
      site: { title: "My Site", logoSvg: "<svg></svg>" } as any,
    } as any);
    const main = Components.Main({ class: "custom-main", children: "Content" });
    const footer = Components.Footer({
      site: { title: "My Site" } as any,
      footer: {
        schemaVersion: "1.0.0",
        links: [{ label: "Privacy", path: "/privacy" }],
      },
    } as any);

    expect(nav).toBeDefined();
    expect(header).toBeDefined();
    expect(main).toBeDefined();
    expect(footer).toBeDefined();
  });

  it("should generate content preflights from tokens", () => {
    const preflights = createContentPreflights(ruriConnector.tokens!);
    expect(preflights.shortcuts).toBeDefined();
    expect(preflights.preflights).toBeDefined();
    expect(preflights.preflights![0].getCSS({} as any)).toContain(
      "box-sizing: border-box",
    );
  });
});

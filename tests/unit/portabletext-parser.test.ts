import { describe, it, expect } from "bun:test";
import {
  renderPortableText,
  getFirstImageForPortableText,
  formatUrl,
  resolveEmbedUrl,
} from "@utils/portabletext-parser";

describe("PortableText Parser Utility", () => {
  describe("formatUrl", () => {
    it("should return # for empty or missing url", () => {
      expect(formatUrl("")).toBe("#");
      expect(formatUrl(null as any)).toBe("#");
      expect(formatUrl(undefined as any)).toBe("#");
    });

    it("should preserve valid protocols and relative URLs", () => {
      expect(formatUrl("http://example.com")).toBe("http://example.com");
      expect(formatUrl("https://example.com")).toBe("https://example.com");
      expect(formatUrl("/relative/path")).toBe("/relative/path");
      expect(formatUrl("#section-1")).toBe("#section-1");
      expect(formatUrl("mailto:test@example.com")).toBe("mailto:test@example.com");
      expect(formatUrl("tel:+1234567890")).toBe("tel:+1234567890");
    });

    it("should auto-prepend https:// to raw domain names", () => {
      expect(formatUrl("example.com")).toBe("https://example.com");
      expect(formatUrl("  sub.domain.com/path  ")).toBe("https://sub.domain.com/path");
    });
  });

  describe("resolveEmbedUrl", () => {
    it("should return empty string for empty or invalid URL strings", () => {
      expect(resolveEmbedUrl("")).toBe("");
      expect(resolveEmbedUrl("not-a-valid-url")).toBe("");
      expect(resolveEmbedUrl(null as any)).toBe("");
    });

    it("should correctly resolve YouTube URLs", () => {
      expect(
        resolveEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
      ).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
      expect(resolveEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
        "https://www.youtube.com/embed/dQw4w9WgXcQ",
      );
    });

    it("should correctly resolve Vimeo URLs", () => {
      expect(resolveEmbedUrl("https://vimeo.com/123456789")).toBe(
        "https://player.vimeo.com/video/123456789",
      );
    });

    it("should return empty string for non-embeddable hosts", () => {
      expect(resolveEmbedUrl("https://example.com/video.mp4")).toBe("");
    });
  });

  describe("renderPortableText", () => {
    it("should return an empty string for invalid inputs", () => {
      expect(renderPortableText(null as any)).toBe("");
      expect(renderPortableText(undefined as any)).toBe("");
      expect(renderPortableText({} as any)).toBe("");
    });

    it("should render standard blocks through @portabletext/to-html", () => {
      const blocks = [
        {
          _type: "block",
          children: [{ _type: "span", text: "Hello World" }],
        },
      ];
      const html = renderPortableText(blocks);
      expect(html).toContain("Hello World");
    });

    it("should render link marks with formatted URLs", () => {
      const blocks = [
        {
          _type: "block",
          markDefs: [{ _key: "l1", _type: "link", href: "example.com" }],
          children: [
            { _type: "span", marks: ["l1"], text: "Clickable Link" },
          ],
        },
      ];
      const html = renderPortableText(blocks);
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain("Clickable Link");
    });

    it("should render a hero block", () => {
      const blocks = [
        {
          _type: "hero",
          imageUrl: "/img/hero.webp",
          title: "My Title",
          subtitle: "My Subtitle",
        },
      ];
      const html = renderPortableText(blocks);
      expect(html).toContain("/img/hero.webp");
      expect(html).toContain("My Title");
      expect(html).toContain("My Subtitle");
    });

    it("should render a table block with headings", () => {
      const blocks = [
        {
          _type: "table",
          withHeadings: true,
          rows: [
            ["Col 1", "Col 2"],
            ["Val 1", "Val 2"],
          ],
        },
      ];
      const html = renderPortableText(blocks);
      expect(html).toMatch(/<thead[^>]*>/);
      expect(html).toContain("Col 1");
      expect(html).toContain("Val 1");
    });

    it("should render a table block without headings", () => {
      const blocks = [
        {
          _type: "table",
          withHeadings: false,
          rows: [{ cells: ["A1", "A2"] }, { cells: ["B1", "B2"] }],
        },
      ];
      const html = renderPortableText(blocks);
      expect(html).not.toMatch(/<thead[^>]*>/);
      expect(html).toContain("A1");
      expect(html).toContain("B2");
    });

    it("should render a code block", () => {
      const blocks = [
        {
          _type: "code",
          code: 'const a = "hello & <world>";',
        },
      ];
      const html = renderPortableText(blocks);
      expect(html).toContain(
        "const a = &quot;hello &amp; &lt;world&gt;&quot;;",
      );
    });

    it("should render a codeBlock block with language and filename", () => {
      const blocks = [
        {
          _type: "codeBlock",
          code: 'console.log("hello");',
          filename: "index.js",
          language: "javascript",
        },
      ];
      const html = renderPortableText(blocks);
      expect(html).toContain("index.js");
      expect(html).toContain('javascript"');
      expect(html).toContain("console.log(&quot;hello&quot;);");
    });

    it("should render an image block with formatting", () => {
      const blocks = [
        {
          _type: "image",
          url: "/img/pic.png",
          caption: "Beautiful Image",
          stretched: true,
          withBorder: true,
          withBackground: true,
        },
      ];
      const astryxHtml = renderPortableText(blocks, "astryx");
      expect(astryxHtml).toContain('src="/img/pic.png"');
      expect(astryxHtml).toContain("Beautiful Image");
      expect(astryxHtml).toContain("image-stretched");
      expect(astryxHtml).toContain("image-with-border");
      expect(astryxHtml).toContain("image-with-background");

      const ruriHtml = renderPortableText(blocks, "ruri");
      expect(ruriHtml).toContain("/img/pic.png");
      expect(ruriHtml).toContain("Beautiful Image");
    });

    it("should render an image block from file object", () => {
      const blocks = [
        {
          _type: "image",
          file: { url: "/img/file.png" },
        },
      ];
      const html = renderPortableText(blocks, "astryx");
      expect(html).toContain('src="/img/file.png"');
    });

    it("should render a video block (YouTube, Vimeo, HTML5)", () => {
      const youtubeBlock = [
        {
          _type: "video",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          caption: "Rickroll",
        },
      ];
      const youtubeShortBlock = [
        {
          _type: "video",
          url: "https://youtu.be/dQw4w9WgXcQ",
        },
      ];
      const youtubeInvalidBlock = [
        {
          _type: "video",
          url: "https://youtube.com/invalid-url",
        },
      ];
      const vimeoBlock = [
        {
          _type: "video",
          url: "https://vimeo.com/123456789",
        },
      ];
      const vimeoInvalidBlock = [
        {
          _type: "video",
          url: "https://vimeo.com/invalid-id",
        },
      ];
      const html5Block = [
        {
          _type: "video",
          url: "/videos/local.mp4",
        },
      ];

      expect(renderPortableText(youtubeBlock)).toContain(
        "youtube-nocookie.com/embed/dQw4w9WgXcQ",
      );
      expect(renderPortableText(youtubeBlock)).toContain("Rickroll");
      expect(renderPortableText(youtubeShortBlock)).toContain(
        "youtube-nocookie.com/embed/dQw4w9WgXcQ",
      );
      expect(renderPortableText(youtubeInvalidBlock)).toContain(
        '<video src="https://youtube.com/invalid-url"',
      );
      expect(renderPortableText(vimeoBlock)).toContain(
        "player.vimeo.com/video/123456789",
      );
      expect(renderPortableText(vimeoInvalidBlock)).toContain(
        '<video src="https://vimeo.com/invalid-id"',
      );
      expect(renderPortableText(html5Block)).toContain(
        '<video src="/videos/local.mp4"',
      );
    });

    it("should render an embed block", () => {
      const blocks = [
        {
          _type: "embed",
          embed: "https://example.com/widget",
          caption: "My Widget",
        },
      ];
      const html = renderPortableText(blocks);
      expect(html).toContain('src="https://example.com/widget"');
      expect(html).toContain("My Widget");
    });

    it("should render a card block with image, badge, and linkUrl", () => {
      const cardBlock = [
        {
          _type: "card",
          title: "Card Title",
          description: "Card Description Text",
          imageUrl: "/card.png",
          badge: "FEATURED",
          linkUrl: "example.com/card",
        },
      ];
      const html = renderPortableText(cardBlock);
      expect(html).toContain("Card Title");
      expect(html).toContain("Card Description Text");
      expect(html).toContain('src="/card.png"');
      expect(html).toContain("FEATURED");
      expect(html).toContain('href="https://example.com/card"');
    });

    it("should render a bentoGrid block with cards and column spans", () => {
      const bentoBlock = [
        {
          _type: "bentoGrid",
          sectionTitle: "Bento Highlights",
          columns: 3,
          cards: [
            {
              _key: "b1",
              title: "Feature One",
              description: "First Feature Details",
              imageUrl: "/f1.png",
              badge: "NEW",
              colSpan: 2,
            },
            {
              _key: "b2",
              title: "Feature Two",
              description: "Second Feature Details",
              colSpan: 1,
            },
          ],
        },
      ];
      const html = renderPortableText(bentoBlock);
      expect(html).toContain("Bento Highlights");
      expect(html).toContain("Feature One");
      expect(html).toContain("First Feature Details");
      expect(html).toContain('src="/f1.png"');
      expect(html).toContain("NEW");
      expect(html).toContain("grid-column: span 2;");
      expect(html).toContain("Feature Two");
      expect(html).toContain("grid-column: span 1;");
    });

    it("should render a quote block", () => {
      const quoteBlock = [
        {
          _type: "quote",
          text: "Inspiring Quote",
          caption: "Author Name",
        },
      ];
      const html = renderPortableText(quoteBlock);
      expect(html).toContain("Inspiring Quote");
      expect(html).toContain("Author Name");
    });

    it("should render a delimiter block", () => {
      const blocks = [
        {
          _type: "delimiter",
        },
      ];
      const html = renderPortableText(blocks);
      expect(html).toContain("<hr");
    });
  });

  describe("getFirstImageForPortableText", () => {
    it("should handle empty or invalid inputs", () => {
      expect(getFirstImageForPortableText(null as any)).toBeNull();
      expect(getFirstImageForPortableText(undefined as any)).toBeNull();
      expect(getFirstImageForPortableText([])).toBeNull();
    });

    it("should return null if no image block exists", () => {
      const blocks = [
        {
          _type: "block",
          children: [{ _type: "span", text: "No images here" }],
        },
      ];
      expect(getFirstImageForPortableText(blocks)).toBeNull();
    });

    it("should extract image from a hero block", () => {
      const heroUrl = [
        {
          _type: "hero",
          url: "/hero-url.jpg",
        },
      ];
      const heroImageUrl = [
        {
          _type: "hero",
          imageUrl: "/hero-image.jpg",
        },
      ];

      expect(getFirstImageForPortableText(heroUrl)).toBe("/hero-url.jpg");
      expect(getFirstImageForPortableText(heroImageUrl)).toBe(
        "/hero-image.jpg",
      );
    });

    it("should extract image from an image block (url, file.url)", () => {
      const imgUrl = [
        {
          _type: "image",
          url: "/img.jpg",
        },
      ];
      const imgFileUrl = [
        {
          _type: "image",
          file: { url: "/file-img.jpg" },
        },
      ];

      expect(getFirstImageForPortableText(imgUrl)).toBe("/img.jpg");
      expect(getFirstImageForPortableText(imgFileUrl)).toBe("/file-img.jpg");
    });
  });
});

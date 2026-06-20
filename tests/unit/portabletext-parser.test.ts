import { describe, it, expect } from "bun:test";
import {
  renderPortableText,
  getFirstImageForPortableText,
} from "@utils/portabletext-parser";

describe("PortableText Parser Utility", () => {
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
      expect(html).toContain("background-image: url('/img/hero.webp')");
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
      expect(html).toContain("<thead>");
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
      expect(html).not.toContain("<thead>");
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
      expect(html).toContain('class="javascript"');
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
      const html = renderPortableText(blocks);
      expect(html).toContain('src="/img/pic.png"');
      expect(html).toContain("Beautiful Image");
      expect(html).toContain("image-stretched");
      expect(html).toContain("image-with-border");
      expect(html).toContain("image-with-background");
    });

    it("should render an image block from file object", () => {
      const blocks = [
        {
          _type: "image",
          file: { url: "/img/file.png" },
        },
      ];
      const html = renderPortableText(blocks);
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
      const vimeoBlock = [
        {
          _type: "video",
          url: "https://vimeo.com/123456789",
        },
      ];
      const html5Block = [
        {
          _type: "video",
          url: "/videos/local.mp4",
        },
      ];

      expect(renderPortableText(youtubeBlock)).toContain(
        "youtube.com/embed/dQw4w9WgXcQ",
      );
      expect(renderPortableText(youtubeBlock)).toContain("Rickroll");
      expect(renderPortableText(vimeoBlock)).toContain(
        "player.vimeo.com/video/123456789",
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

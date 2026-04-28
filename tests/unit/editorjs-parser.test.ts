import { expect, test, describe, beforeAll, spyOn } from "bun:test";
import {
  renderEditorJs,
  renderEditorJsToMarkdown,
  EditorJsData,
  getFirstImage,
} from "../../src/utils/editorjs-parser";

describe("EditorJsParser", () => {
  // Silence console during tests to keep output clean
  beforeAll(() => {
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
    spyOn(console, "warn").mockImplementation(() => {});
  });

  test("should return empty string for invalid data", () => {
    expect(renderEditorJs(null as any)).toBe("");
    expect(renderEditorJs({} as any)).toBe("");
    expect(renderEditorJs({ blocks: "not-an-array" } as any)).toBe("");
  });

  test("should render header blocks with design system classes", () => {
    const data: EditorJsData = {
      blocks: [
        {
          type: "header",
          data: { text: "Hello World", level: 2 },
        },
        {
          type: "header",
          data: { text: "Sub Header", level: 3 },
        },
      ],
    };
    const html = renderEditorJs(data);
    expect(html).toContain("<h2>Hello World</h2>");
    expect(html).toContain("<h3>Sub Header</h3>");
  });

  test("should render paragraph blocks", () => {
    const data: EditorJsData = {
      blocks: [
        {
          type: "paragraph",
          data: { text: "This is a paragraph." },
        },
      ],
    };
    const html = renderEditorJs(data);
    expect(html).toBe("<p>This is a paragraph.</p>");
  });

  test("should render legacy simple lists", () => {
    const data: EditorJsData = {
      blocks: [
        {
          type: "list",
          data: { style: "unordered", items: ["Item 1", "Item 2"] },
        },
      ],
    };
    const html = renderEditorJs(data);
    expect(html).toBe("<ul><li>Item 1</li><li>Item 2</li></ul>");
  });

  test("should handle empty or malformed list items", () => {
    const data: EditorJsData = {
      blocks: [
        {
          type: "list",
          data: { style: "ordered", items: null },
        },
      ],
    };
    const html = renderEditorJs(data);
    expect(html).toBe("<ol></ol>");
  });

  test("should render nested List v2 items", () => {
    const data: EditorJsData = {
      blocks: [
        {
          type: "list",
          data: {
            style: "ordered",
            items: [
              {
                content: "Parent",
                items: [{ content: "Child" }],
              },
            ],
          },
        },
      ],
    };
    const html = renderEditorJs(data);
    expect(html).toBe("<ol><li>Parent<ol><li>Child</li></ol></li></ol>");
  });

  test("should render images with wrapper classes and variations", () => {
    const data: EditorJsData = {
      blocks: [
        {
          type: "image",
          data: {
            url: "https://example.com/img.png",
            caption: "Beautiful View",
            stretched: true,
            withBorder: true,
            withBackground: true,
          },
        },
      ],
    };
    const html = renderEditorJs(data);
    expect(html).toContain(
      'class="content-frame image-stretched image-with-border image-with-background"',
    );
    expect(html).toContain('src="https://example.com/img.png"');
    expect(html).toContain('alt="Beautiful View"');
    expect(html).toContain("Beautiful View</div>");
  });

  test("should render images from file object", () => {
    const data: EditorJsData = {
      blocks: [
        {
          type: "image",
          data: {
            file: {
              url: "/images/slug/image.webp",
            },
            caption: "Single Image",
          },
        },
      ],
    };
    const html = renderEditorJs(data);
    expect(html).toContain('src="/images/slug/image.webp"');
  });

  test("should render hero blocks with title and optional subtitle", () => {
    const data: EditorJsData = {
      blocks: [
        {
          type: "hero",
          data: { url: "/hero.jpg", title: "HERO TITLE", subtitle: "Sub" },
        },
        {
          type: "hero",
          data: { url: "/hero2.jpg", title: "TITLE ONLY" },
        },
      ],
    };
    const html = renderEditorJs(data);
    expect(html).toContain("background-image: url('/hero.jpg')");
    expect(html).toContain("HERO TITLE");
    expect(html).toContain("Sub");
    expect(html).toContain("TITLE ONLY");
  });

  test("should render table blocks with headings", () => {
    const data: EditorJsData = {
      blocks: [
        {
          type: "table",
          data: {
            withHeadings: true,
            content: [
              ["H1", "H2"],
              ["R1C1", "R1C2"],
            ],
          },
        },
      ],
    };
    const html = renderEditorJs(data);
    expect(html).toContain("<thead");
    expect(html).toContain("H1");
    expect(html).toContain("R1C1");
  });

  test("should render table blocks without headings", () => {
    const data: EditorJsData = {
      blocks: [
        {
          type: "table",
          data: {
            withHeadings: false,
            content: [["Simple", "Cell"]],
          },
        },
      ],
    };
    const html = renderEditorJs(data);
    expect(html).not.toContain("<thead");
    expect(html).toContain("Simple");
  });

  test("should render code blocks", () => {
    const data: EditorJsData = {
      blocks: [
        {
          type: "code",
          data: { code: "console.log(1)" },
        },
      ],
    };
    const html = renderEditorJs(data);
    expect(html).toContain("console.log(1)");
    expect(html).toContain("<pre><code>");
  });

  test("should render embed blocks", () => {
    const data: EditorJsData = {
      blocks: [
        {
          type: "embed",
          data: { embed: "https://youtube.com/embed/123", caption: "Video" },
        },
      ],
    };
    const html = renderEditorJs(data);
    expect(html).toContain('src="https://youtube.com/embed/123"');
    expect(html).toContain("Video");
  });

  test("should render delimiter blocks", () => {
    const data: EditorJsData = {
      blocks: [{ type: "delimiter", data: {} }],
    };
    const html = renderEditorJs(data);
    expect(html).toContain("<hr");
  });

  test("should render quotes with captions", () => {
    const data: EditorJsData = {
      blocks: [
        {
          type: "quote",
          data: { text: "To be or not to be", caption: "Shakespeare" },
        },
      ],
    };
    const html = renderEditorJs(data);
    expect(html).toBe(
      "<blockquote>To be or not to be<br/><small>— Shakespeare</small></blockquote>",
    );
  });

  test("should handle multiple blocks joined by newlines", () => {
    const data: EditorJsData = {
      blocks: [
        { type: "paragraph", data: { text: "P1" } },
        { type: "paragraph", data: { text: "P2" } },
      ],
    };
    const html = renderEditorJs(data);
    expect(html).toBe("<p>P1</p>\n<p>P2</p>");
  });

  test("should return empty string and warn for unsupported blocks", () => {
    const data: EditorJsData = {
      blocks: [{ type: "unknown", data: { text: "skip me" } }],
    };
    const html = renderEditorJs(data);
    expect(html).toBe("");
  });

  describe("getFirstImage", () => {
    test("should return null for invalid or empty data", () => {
      expect(getFirstImage(null as any)).toBeNull();
      expect(getFirstImage({ blocks: [] } as any)).toBeNull();
    });

    test("should extract URL from first image block", () => {
      const data: EditorJsData = {
        blocks: [
          { type: "paragraph", data: { text: "text" } },
          { type: "image", data: { url: "https://example.com/1.png" } },
          { type: "image", data: { url: "https://example.com/2.png" } },
        ],
      };
      expect(getFirstImage(data)).toBe("https://example.com/1.png");
    });

    test("should extract URL from hero block", () => {
      const data: EditorJsData = {
        blocks: [{ type: "hero", data: { url: "/hero-thumb.jpg" } }],
      };
      expect(getFirstImage(data)).toBe("/hero-thumb.jpg");
    });

    test("should support file object URL", () => {
      const data: EditorJsData = {
        blocks: [{ type: "image", data: { file: { url: "/img.png" } } }],
      };
      expect(getFirstImage(data)).toBe("/img.png");
    });
  });

  describe("renderEditorJsToMarkdown", () => {
    test("should convert blocks to clean markdown", () => {
      const data: EditorJsData = {
        blocks: [
          { type: "header", data: { text: "Title", level: 1 } },
          { type: "paragraph", data: { text: "Hello World" } },
          {
            type: "list",
            data: { style: "unordered", items: ["Item 1", "Item 2"] },
          },
          {
            type: "image",
            data: { url: "img.png", caption: "Caption" },
          },
          { type: "delimiter", data: {} },
          { type: "quote", data: { text: "Quote", caption: "Author" } },
          {
            type: "table",
            data: {
              withHeadings: true,
              content: [
                ["H1", "H2"],
                ["V1", "V2"],
              ],
            },
          },
          { type: "code", data: { code: "const x = 1;" } },
        ],
      };
      const md = renderEditorJsToMarkdown(data);
      expect(md).toContain("# Title");
      expect(md).toContain("Hello World");
      expect(md).toContain("- Item 1");
      expect(md).toContain("![Caption](img.png)");
      expect(md).toContain("*Caption*");
      expect(md).toContain("---");
      expect(md).toContain("> Quote");
      expect(md).toContain("> — Author");
      expect(md).toContain("| H1 | H2 |");
      expect(md).toContain("| --- | --- |");
      expect(md).toContain("| V1 | V2 |");
      expect(md).toContain("```\nconst x = 1;\n```");
    });

    test("should handle hero blocks", () => {
      const data: EditorJsData = {
        blocks: [
          {
            type: "hero",
            data: { title: "Main", subtitle: "Sub", url: "hero.jpg" },
          },
        ],
      };
      const md = renderEditorJsToMarkdown(data);
      expect(md).toBe("# Main\n\n## Sub\n\n![Hero Image](hero.jpg)");
    });

    test("should handle nested lists", () => {
      const data: EditorJsData = {
        blocks: [
          {
            type: "list",
            data: {
              style: "ordered",
              items: [{ content: "P", items: [{ content: "C" }] }],
            },
          },
        ],
      };
      const md = renderEditorJsToMarkdown(data);
      expect(md).toBe("1. P\n  1. C");
    });
  });
});

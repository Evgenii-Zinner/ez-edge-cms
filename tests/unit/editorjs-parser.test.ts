import { expect, test, describe } from "bun:test";
import {
  renderEditorJs,
  EditorJsData,
  getFirstImage,
} from "../../src/utils/editorjs-parser";

describe("EditorJsParser", () => {
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
      ],
    };
    const html = renderEditorJs(data);
    expect(html).toContain("<h2>Hello World</h2>");
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

  test("should render images with wrapper classes", () => {
    const data: EditorJsData = {
      blocks: [
        {
          type: "image",
          data: {
            url: "https://example.com/img.png",
            caption: "Beautiful View",
          },
        },
      ],
    };
    const html = renderEditorJs(data);
    expect(html).toContain('class="content-frame"');
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
    expect(html).not.toContain("srcset");
    expect(html).not.toContain("sizes");
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

    test("should support file object URL", () => {
      const data: EditorJsData = {
        blocks: [{ type: "image", data: { file: { url: "/img.png" } } }],
      };
      expect(getFirstImage(data)).toBe("/img.png");
    });
  });
});

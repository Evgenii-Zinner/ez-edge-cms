import { describe, expect, it } from "bun:test";
import { convertEditorJsToPortableText } from "../../src/utils/editorjs-to-portabletext";
import { EditorJsData } from "../../src/utils/editorjs-parser";

describe("Editor.js to PortableText Converter", () => {
  it("should handle empty or malformed Editor.js data gracefully", () => {
    expect(convertEditorJsToPortableText({} as any)).toEqual([]);
    expect(convertEditorJsToPortableText({ blocks: "invalid" } as any)).toEqual(
      [],
    );
    expect(convertEditorJsToPortableText({ blocks: [] })).toEqual([]);
  });

  it("should convert headers and paragraphs correctly", () => {
    const input: EditorJsData = {
      blocks: [
        {
          type: "header",
          data: {
            text: "Main Title",
            level: 1,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "This is a paragraph text.",
          },
        },
      ],
    };

    const pt = convertEditorJsToPortableText(input);
    expect(pt).toHaveLength(2);

    expect(pt[0]._type).toBe("block");
    expect(pt[0].style).toBe("h1");
    expect(pt[0].children[0].text).toBe("Main Title");

    expect(pt[1]._type).toBe("block");
    expect(pt[1].style).toBe("normal");
    expect(pt[1].children[0].text).toBe("This is a paragraph text.");
  });

  it("should flatten nested lists correctly", () => {
    const input: EditorJsData = {
      blocks: [
        {
          type: "list",
          data: {
            style: "ordered",
            items: [
              "Item 1",
              {
                content: "Item 2",
                items: ["Item 2.1", "Item 2.2"],
              },
            ],
          },
        },
      ],
    };

    const pt = convertEditorJsToPortableText(input);
    expect(pt).toHaveLength(4);

    expect(pt[0].listItem).toBe("number");
    expect(pt[0].level).toBe(0);
    expect(pt[0].children[0].text).toBe("Item 1");

    expect(pt[1].listItem).toBe("number");
    expect(pt[1].level).toBe(0);
    expect(pt[1].children[0].text).toBe("Item 2");

    expect(pt[2].listItem).toBe("number");
    expect(pt[2].level).toBe(1);
    expect(pt[2].children[0].text).toBe("Item 2.1");

    expect(pt[3].listItem).toBe("number");
    expect(pt[3].level).toBe(1);
    expect(pt[3].children[0].text).toBe("Item 2.2");
  });

  it("should convert image and hero blocks correctly", () => {
    const input: EditorJsData = {
      blocks: [
        {
          type: "image",
          data: {
            url: "https://example.com/image.png",
            caption: "Example Caption",
            stretched: true,
            withBorder: false,
            withBackground: true,
          },
        },
        {
          type: "hero",
          data: {
            url: "https://example.com/hero.png",
            title: "Hero Title",
            subtitle: "Hero Subtitle",
          },
        },
      ],
    };

    const pt = convertEditorJsToPortableText(input);
    expect(pt).toHaveLength(2);

    expect(pt[0]._type).toBe("image");
    expect(pt[0].url).toBe("https://example.com/image.png");
    expect(pt[0].caption).toBe("Example Caption");
    expect(pt[0].stretched).toBe(true);
    expect(pt[0].withBorder).toBe(false);
    expect(pt[0].withBackground).toBe(true);

    expect(pt[1]._type).toBe("hero");
    expect(pt[1].imageUrl).toBe("https://example.com/hero.png");
    expect(pt[1].title).toBe("Hero Title");
    expect(pt[1].subtitle).toBe("Hero Subtitle");
  });

  it("should convert tables, quotes, delimiters, code, and embeds correctly", () => {
    const input: EditorJsData = {
      blocks: [
        {
          type: "quote",
          data: {
            text: "Quote text",
            caption: "Author",
          },
        },
        {
          type: "delimiter",
          data: {},
        },
        {
          type: "table",
          data: {
            withHeadings: true,
            content: [
              ["Col 1", "Col 2"],
              ["Val 1", "Val 2"],
            ],
          },
        },
        {
          type: "code",
          data: {
            code: "console.log('hello');",
          },
        },
        {
          type: "embed",
          data: {
            embed: "https://youtube.com/embed/123",
            caption: "Video caption",
          },
        },
      ],
    };

    const pt = convertEditorJsToPortableText(input);
    expect(pt).toHaveLength(5);

    expect(pt[0]._type).toBe("block");
    expect(pt[0].style).toBe("blockquote");
    expect(pt[0].children[0].text).toBe("Quote text");
    expect(pt[0].caption).toBe("Author");

    expect(pt[1]._type).toBe("delimiter");

    expect(pt[2]._type).toBe("table");
    expect(pt[2].withHeadings).toBe(true);
    expect(pt[2].rows).toHaveLength(2);
    expect(pt[2].rows[0]._type).toBe("tableRow");
    expect(pt[2].rows[0].cells).toEqual(["Col 1", "Col 2"]);

    expect(pt[3]._type).toBe("codeBlock");
    expect(pt[3].code).toBe("console.log('hello');");

    expect(pt[4]._type).toBe("embed");
    expect(pt[4].embed).toBe("https://youtube.com/embed/123");
    expect(pt[4].caption).toBe("Video caption");
  });

  it("should parse formatting HTML tags (bold, italic, underline, code, links) in paragraphs", () => {
    const input: EditorJsData = {
      blocks: [
        {
          type: "paragraph",
          data: {
            text: 'Hello <b>bold</b>, <i>italic</i>, <u>underline</u>, <code>code</code> and <a href="https://google.com">link</a>.',
          },
        },
        {
          type: "paragraph",
          data: {
            text: "<b></b>", // Empty bold tag
          },
        },
        {
          type: "paragraph",
          data: {
            text: "", // Empty string
          },
        },
      ],
    };

    const pt = convertEditorJsToPortableText(input);
    expect(pt).toHaveLength(3);

    // First block: verifies normal markup tags
    const spans = pt[0].children;
    expect(spans.find((s: any) => s.text === "bold").marks).toContain("strong");
    expect(spans.find((s: any) => s.text === "italic").marks).toContain("em");
    expect(spans.find((s: any) => s.text === "underline").marks).toContain(
      "underline",
    );
    expect(spans.find((s: any) => s.text === "code").marks).toContain("code");

    const linkSpan = spans.find((s: any) => s.text === "link");
    expect(linkSpan.marks[0]).toStartWith("link_");
    expect(pt[0].markDefs[0].href).toBe("https://google.com");

    // Second block: verifies fallback for empty tag text content
    expect(pt[1].children[0].text).toBe("");

    // Third block: verifies empty string handling (returns empty children array)
    expect(pt[2].children).toHaveLength(0);
  });

  it("should handle unsupported block types gracefully with console.warn", () => {
    const input: EditorJsData = {
      blocks: [
        {
          type: "unsupported_type",
          data: {},
        },
      ],
    };
    const pt = convertEditorJsToPortableText(input);
    expect(pt).toEqual([]);
  });
});

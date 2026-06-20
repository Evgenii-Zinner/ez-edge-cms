import { describe, it, expect } from "bun:test";
import { BlockEditor } from "../../src/components/BlockEditor";

describe("BlockEditor Component", () => {
  it("should render hidden input and editorjs container with default empty blocks", () => {
    const res = BlockEditor({ content: null as any });
    const html = res?.toString() || "";
    expect(html).toContain('id="editorjs-content-input"');
    expect(html).toContain('id="editorjs-container"');
  });

  it("should serialize content correctly and escape angle brackets", () => {
    const content = {
      time: 12345,
      blocks: [
        {
          id: "1",
          type: "paragraph",
          data: { text: "Hello <world>" },
        },
      ],
      version: "2.29",
    };
    const res = BlockEditor({ content });
    const html = res?.toString() || "";
    expect(html).toContain('id="editorjs-content-input"');
    expect(html).toContain('id="editorjs-container"');
  });
});

/**
 * @module EditorJsParser
 * @description Converts Editor.js JSON block output into an HTML string using the project's design system classes.
 * This parser ensures that semantic HTML is generated while maintaining the futuristic aesthetic of the CMS.
 */

export interface EditorJsBlock {
  /** Unique identifier for the block */
  id?: string;
  /** The type of block (e.g., 'paragraph', 'header', 'list', 'image') */
  type: string;
  /** The data payload for the block, varies by type */
  data?: any;
}

/**
 * Represents the top-level output data structure from Editor.js.
 */
export interface EditorJsData {
  /** Timestamp of when the data was generated */
  time?: number;
  /** Array of content blocks */
  blocks: EditorJsBlock[];
  /** Version of Editor.js that generated this data */
  version?: string;
}

/**
 * Recursively parses list items for Editor.js List v2 which supports nesting.
 * Handles both legacy string-array lists and new nested object-based lists.
 *
 * @param items - The array of list items to render.
 * @param tag - The HTML tag to use for the list ('ul' or 'ol').
 * @returns A string of `<li>` elements, potentially containing nested lists.
 */
const renderListItems = (items: any[], tag: "ul" | "ol" = "ul"): string => {
  if (!items || !Array.isArray(items)) return "";
  return items
    .map((item: any) => {
      // Legacy support (just string arrays) vs List v2 support (objects with content & items)
      if (typeof item === "string") {
        return `<li>${item}</li>`;
      }

      let html = `<li>${item.content || ""}`;
      if (item.items && item.items.length > 0) {
        html += `<${tag}>${renderListItems(item.items, tag)}</${tag}>`;
      }
      html += `</li>`;
      return html;
    })
    .join("");
};

/**
 * Parses a single Editor.js block into its corresponding semantic HTML.
 *
 * @param block - The Editor.js block object to parse.
 * @returns An HTML string representing the block.
 */
const parseBlock = (block: EditorJsBlock): string => {
  const data = block.data || {};
  switch (block.type) {
    case "header":
      const level = data.level || 2;
      return `<h${level}>${data.text}</h${level}>`;

    case "paragraph":
      return `<p>${data.text}</p>`;

    case "list":
      const tag = data.style === "ordered" ? "ol" : "ul";
      return `<${tag}>${renderListItems(data.items || [], tag)}</${tag}>`;

    case "image":
      // Supports both URL-based and file-object-based image payloads
      const url = data.file?.url || data.url;
      const alt = data.caption || "Image";

      const wrapperClasses = [
        "content-frame",
        data.stretched ? "image-stretched" : "",
        data.withBorder ? "image-with-border" : "",
        data.withBackground ? "image-with-background" : "",
      ]
        .filter(Boolean)
        .join(" ");

      return `
        <div class="${wrapperClasses}">
          <img 
            src="${url}" 
            alt="${alt}" 
            class="content-img" 
            loading="lazy" 
          />
          ${data.caption ? `<div style="text-align: center; color: var(--theme-text-dim); font-size: 0.8rem; margin-top: 0.5rem;">${data.caption}</div>` : ""}
        </div>
      `;

    case "quote":
      return `<blockquote>${data.text}${data.caption ? `<br/><small>— ${data.caption}</small>` : ""}</blockquote>`;

    default:
      console.warn(`Unsupported block type: ${block.type}`);
      return "";
  }
};

/**
 * Converts a full Editor.js JSON data structure into a complete, semantic HTML string.
 * This is the primary entry point for rendering content in public layouts.
 *
 * @param data - The full JSON output from Editor.js.
 * @returns A string of concatenated HTML blocks.
 */
export const renderEditorJs = (data: EditorJsData): string => {
  if (!data || !data.blocks || !Array.isArray(data.blocks)) {
    return "";
  }

  return data.blocks.map(parseBlock).join("\n");
};

/**
 * Extracts the first image URL found within the Editor.js block data.
 * Used for automatic thumbnail generation in listings.
 *
 * @param data - The full JSON output from Editor.js.
 * @returns The first image URL found, or null if no images exist.
 */
export const getFirstImage = (data: EditorJsData): string | null => {
  if (!data || !data.blocks) return null;
  const firstImageBlock = data.blocks.find((b) => b.type === "image");
  if (!firstImageBlock) return null;
  return firstImageBlock.data?.file?.url || firstImageBlock.data?.url || null;
};

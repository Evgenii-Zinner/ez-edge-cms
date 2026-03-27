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

    case "hero":
      return `
        <div class="relative min-h-[500px] flex items-center justify-center text-center overflow-hidden my-12 border border-solid border-[var(--theme-accent-glow)]">
          <div 
            class="absolute top-0 left-0 w-full h-full z-0 bg-cover bg-center opacity-40 transition-transform duration-10000 hover:scale-110"
            style="background-image: url('${data.url}')"
          ></div>
          <div class="relative z-10 px-8 max-w-4xl">
            <h1 class="text-3rem md:text-5rem font-header mb-4 text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] leading-tight">
              ${data.title || ""}
            </h1>
            ${data.subtitle ? `<p class="text-1.2rem md:text-1.5rem font-nav text-[var(--theme-text-main)] opacity-90 tracking-widest uppercase drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">${data.subtitle}</p>` : ""}
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-[var(--theme-bg)] to-transparent opacity-60 pointer-events-none"></div>
        </div>
      `;

    case "quote":
      return `<blockquote>${data.text}${data.caption ? `<br/><small>— ${data.caption}</small>` : ""}</blockquote>`;

    case "delimiter":
      return `<hr class="my-12 border-t border-solid border-[var(--theme-accent-glow)] opacity-30" />`;

    case "table":
      const rows = data.content || [];
      const withHeadings = data.withHeadings || false;
      let tableHtml = `<div class="overflow-x-auto my-8"><table class="w-full border-collapse">`;

      if (withHeadings && rows.length > 0) {
        tableHtml += `<thead><tr class="border-b border-b-solid border-[var(--theme-accent-glow)]">`;
        rows[0].forEach((cell: string) => {
          tableHtml += `<th class="p-4 text-left font-header color-[var(--theme-accent)]">${cell}</th>`;
        });
        tableHtml += `</tr></thead>`;
      }

      tableHtml += `<tbody>`;
      const startRow = withHeadings ? 1 : 0;
      for (let i = startRow; i < rows.length; i++) {
        tableHtml += `<tr class="border-b border-b-solid border-[var(--theme-accent-glow)] last:border-0">`;
        rows[i].forEach((cell: string) => {
          tableHtml += `<td class="p-4 font-body color-[var(--theme-text-main)]">${cell}</td>`;
        });
        tableHtml += `</tr>`;
      }
      tableHtml += `</tbody></table></div>`;
      return tableHtml;

    case "code":
      return `
        <div class="admin-card font-mono text-0.9rem bg-[rgba(0,0,0,0.5)] border-solid my-8 p-6 overflow-x-auto">
          <pre><code>${data.code || ""}</code></pre>
        </div>
      `;

    case "embed":
      return `
        <div class="my-8">
          <div class="aspect-video w-full border border-solid border-[var(--theme-accent-glow)] bg-[rgba(0,0,0,0.2)]">
            <iframe 
              src="${data.embed}" 
              width="100%" 
              height="100%" 
              frameborder="0" 
              allowfullscreen
              loading="lazy"
            ></iframe>
          </div>
          ${data.caption ? `<div class="text-center text-0.8rem color-[var(--theme-text-dim)] mt-2 italic">${data.caption}</div>` : ""}
        </div>
      `;

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
  const firstImageBlock = data.blocks.find(
    (b) => b.type === "image" || b.type === "hero",
  );
  if (!firstImageBlock) return null;
  return firstImageBlock.data?.file?.url || firstImageBlock.data?.url || null;
};

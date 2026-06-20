/**
 * @module EditorJsToPortableText
 * @description Converter logic to migrate legacy Editor.js JSON data structure to PortableText block array format.
 */

import { EditorJsData, EditorJsBlock } from "./editorjs-parser";
import { PortableTextBlock } from "./portabletext-parser";

/**
 * Generates a short random key for PortableText blocks/children.
 *
 * @returns A unique 10-character alphanumeric key.
 */
const generateKey = (): string => Math.random().toString(36).substring(2, 12);

/**
 * Decodes standard HTML entities and replaces non-breaking spaces with standard spaces or non-breaking space characters.
 *
 * @param str - The raw HTML string.
 * @returns The decoded string.
 */
const decodeHtmlEntities = (str: string): string => {
  return str
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&");
};

/**
 * Parses an HTML string (from Editor.js block text) into PortableText children spans and mark definitions.
 * This ensures that inline formats like links, bold, italic, underline, and code are preserved correctly.
 *
 * @param html - The HTML string to parse.
 * @returns An object with children spans and mark definitions.
 */
export const parseHtmlToSpansAndMarkDefs = (
  html: string,
): { children: any[]; markDefs: any[] } => {
  const children: any[] = [];
  const markDefs: any[] = [];

  if (!html) {
    return { children, markDefs };
  }

  // Split HTML string into an array of tags and text parts safely without regex
  const parts: string[] = [];
  let current = "";
  let idx = 0;
  while (idx < html.length) {
    if (
      html[idx] === "<" &&
      idx + 1 < html.length &&
      (html[idx + 1] === "/" || /[a-zA-Z]/.test(html[idx + 1]))
    ) {
      if (current) {
        parts.push(current);
        current = "";
      }
      let tag = "<";
      idx++;
      while (idx < html.length && idx !== -1 && html[idx] !== ">") {
        tag += html[idx];
        idx++;
      }
      if (idx < html.length) {
        tag += ">";
        idx++;
      }
      parts.push(tag);
    } else {
      current += html[idx];
      idx++;
    }
  }
  if (current) {
    parts.push(current);
  }

  const activeMarks: string[] = [];

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith("<") && part.endsWith(">")) {
      const isEndTag = part.startsWith("</");
      const tagName = part
        .replace(/[<\/>]/g, "")
        .split(/\s+/)[0]
        .toLowerCase();

      if (isEndTag) {
        if (tagName === "b" || tagName === "strong") {
          const idx = activeMarks.indexOf("strong");
          if (idx !== -1) activeMarks.splice(idx, 1);
        } else if (tagName === "i" || tagName === "em") {
          const idx = activeMarks.indexOf("em");
          if (idx !== -1) activeMarks.splice(idx, 1);
        } else if (tagName === "u") {
          const idx = activeMarks.indexOf("underline");
          if (idx !== -1) activeMarks.splice(idx, 1);
        } else if (tagName === "code") {
          const idx = activeMarks.indexOf("code");
          if (idx !== -1) activeMarks.splice(idx, 1);
        } else if (tagName === "a") {
          const linkIdx = activeMarks.findIndex((m) => m.startsWith("link_"));
          if (linkIdx !== -1) activeMarks.splice(linkIdx, 1);
        }
      } else {
        // Start tag
        if (tagName === "b" || tagName === "strong") {
          if (!activeMarks.includes("strong")) activeMarks.push("strong");
        } else if (tagName === "i" || tagName === "em") {
          if (!activeMarks.includes("em")) activeMarks.push("em");
        } else if (tagName === "u") {
          if (!activeMarks.includes("underline")) activeMarks.push("underline");
        } else if (tagName === "code") {
          if (!activeMarks.includes("code")) activeMarks.push("code");
        } else if (tagName === "a") {
          const hrefMatch = part.match(/href=["']([^"']+)["']/i);
          const href = hrefMatch ? hrefMatch[1] : "";
          const markId = `link_${generateKey()}`;
          activeMarks.push(markId);
          markDefs.push({
            _key: markId,
            _type: "link",
            href,
          });
        }
      }
    } else {
      const text = decodeHtmlEntities(part);
      if (text) {
        children.push({
          _key: generateKey(),
          _type: "span",
          text,
          marks: [...activeMarks],
        });
      }
    }
  }

  // Fallback if no text children were generated (e.g. empty block)
  if (children.length === 0) {
    children.push({
      _key: generateKey(),
      _type: "span",
      text: "",
      marks: [],
    });
  }

  return { children, markDefs };
};

/**
 * Recursively flattens Editor.js list item structures (including nested sub-items)
 * into a flat array of PortableText list blocks with the appropriate depth levels.
 *
 * @param items - The Editor.js list items to convert.
 * @param listItemType - Either "bullet" or "number".
 * @param level - The current nesting depth level (0-indexed).
 * @returns A flat array of PortableTextBlock items.
 */
const convertListItems = (
  items: any[],
  listItemType: "bullet" | "number",
  level: number = 0,
): PortableTextBlock[] => {
  const result: PortableTextBlock[] = [];
  if (!items || !Array.isArray(items)) return result;

  for (const item of items) {
    if (typeof item === "string") {
      const { children, markDefs } = parseHtmlToSpansAndMarkDefs(item);
      result.push({
        _key: generateKey(),
        _type: "block",
        style: "normal",
        listItem: listItemType,
        level,
        children,
        markDefs,
      });
    } else if (item && typeof item === "object") {
      const content = item.content || "";
      const { children, markDefs } = parseHtmlToSpansAndMarkDefs(content);
      result.push({
        _key: generateKey(),
        _type: "block",
        style: "normal",
        listItem: listItemType,
        level,
        children,
        markDefs,
      });
      if (item.items && Array.isArray(item.items)) {
        result.push(...convertListItems(item.items, listItemType, level + 1));
      }
    }
  }
  return result;
};

/**
 * Converts a single legacy Editor.js block to one or more PortableText blocks.
 *
 * @param block - The Editor.js block to convert.
 * @returns An array of PortableText blocks.
 */
const convertBlock = (block: EditorJsBlock): PortableTextBlock[] => {
  const data = block.data || {};
  switch (block.type) {
    case "header": {
      const level = data.level || 2;
      const { children, markDefs } = parseHtmlToSpansAndMarkDefs(
        data.text || "",
      );
      return [
        {
          _key: generateKey(),
          _type: "block",
          style: `h${level}`,
          children,
          markDefs,
        },
      ];
    }

    case "paragraph": {
      const { children, markDefs } = parseHtmlToSpansAndMarkDefs(
        data.text || "",
      );
      return [
        {
          _key: generateKey(),
          _type: "block",
          style: "normal",
          children,
          markDefs,
        },
      ];
    }

    case "list": {
      const type = data.style === "ordered" ? "number" : "bullet";
      return convertListItems(data.items || [], type, 0);
    }

    case "image": {
      const url = data.file?.url || data.url || "";
      return [
        {
          _key: generateKey(),
          _type: "image",
          url,
          caption: data.caption || "",
          stretched: !!data.stretched,
          withBorder: !!data.withBorder,
          withBackground: !!data.withBackground,
        },
      ];
    }

    case "hero": {
      const imageUrl = data.url || "";
      return [
        {
          _key: generateKey(),
          _type: "hero",
          imageUrl,
          title: data.title || "",
          subtitle: data.subtitle || "",
        },
      ];
    }

    case "quote": {
      const { children, markDefs } = parseHtmlToSpansAndMarkDefs(
        data.text || "",
      );
      return [
        {
          _key: generateKey(),
          _type: "block",
          style: "blockquote",
          children,
          markDefs,
          ...(data.caption
            ? {
                caption: data.caption,
              }
            : {}),
        },
      ];
    }

    case "delimiter":
      return [
        {
          _key: generateKey(),
          _type: "delimiter",
        },
      ];

    case "table": {
      const rows = data.content || [];
      return [
        {
          _key: generateKey(),
          _type: "table",
          withHeadings: !!data.withHeadings,
          rows: rows.map((cells: any[]) => ({
            _key: generateKey(),
            _type: "tableRow",
            cells: (cells || []).map((c) => c || ""),
          })),
        },
      ];
    }

    case "code":
      return [
        {
          _key: generateKey(),
          _type: "codeBlock",
          code: data.code || "",
          language: "",
        },
      ];

    case "embed":
      return [
        {
          _key: generateKey(),
          _type: "embed",
          embed: data.embed || "",
          caption: data.caption || "",
        },
      ];

    default:
      console.warn(
        `[Migration] Unsupported legacy block type ignored: ${block.type}`,
      );
      return [];
  }
};

/**
 * Converts a full Editor.js JSON data structure into a PortableText blocks array.
 *
 * @param data - The legacy Editor.js data object.
 * @returns A PortableTextBlock array representing the migrated content.
 */
export const convertEditorJsToPortableText = (
  data: EditorJsData,
): PortableTextBlock[] => {
  if (!data || !data.blocks || !Array.isArray(data.blocks)) {
    return [];
  }
  const result: PortableTextBlock[] = [];
  for (const block of data.blocks) {
    result.push(...convertBlock(block));
  }
  return result;
};

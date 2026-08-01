/** @jsxImportSource hono/jsx */
/**
 * @module PortableTextParser
 * @description Renders PortableText JSON blocks into HTML using the CMS design system's ThemeConnector components.
 *
 * Rendering contract:
 * - URL parsing / data transformation → this module (pure logic, no CSS)
 * - HTML / CSS rendering → ThemeConnector.components (all styling lives in connectors)
 *
 * There must be NO hardcoded CSS variable references, token values, or design-system
 * specific class names in this file. Add new block types by:
 *   1. Adding the component to the ThemeComponents interface in connector.ts
 *   2. Implementing it in every connector (ruri, default, astryx, …)
 *   3. Calling it here via themeComponents.<NewComponent>(…)
 */

import { toHTML } from "@portabletext/to-html";
import { themeRegistry } from "@core/theme";

export interface PortableTextBlock {
  _key?: string;
  _type: string;
  [key: string]: any;
}

/**
 * Safely converts a Hono JSX element — or any value — to an HTML string
 * suitable for @portabletext/to-html component handlers.
 */
const renderJsxToString = (element: any): string => {
  if (!element) return "";
  if (typeof element === "string") return element;
  if (typeof element.toString === "function") return element.toString();
  return String(element);
};

/**
 * Resolves a raw video URL into an iframe-embeddable URL for YouTube and Vimeo.
 * Returns an empty string for unrecognised or direct-file URLs (use <video> fallback).
 *
 * This is intentionally kept in the parser — it is pure data transformation,
 * not rendering or styling.
 */
export const resolveEmbedUrl = (url: string): string => {
  if (!url) return "";
  let hostname = "";
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch (_) {
    return "";
  }

  const isYoutube =
    hostname === "youtube.com" ||
    hostname === "www.youtube.com" ||
    hostname === "youtu.be" ||
    hostname.endsWith(".youtube.com");

  const isVimeo =
    hostname === "vimeo.com" ||
    hostname === "player.vimeo.com" ||
    hostname.endsWith(".vimeo.com");

  if (isYoutube) {
    const match = url.match(
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,
    );
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
  }

  if (isVimeo) {
    const match = url.match(/vimeo\.com\/([0-9]+)/);
    if (match) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
  }

  return "";
};

/**
 * Creates PortableText custom component serializers for the active styling system.
 * Every handler delegates entirely to the connector — no inline CSS here.
 */
const createPortableTextComponents = (stylingSystem = "ruri") => {
  const themeComponents = themeRegistry.get(stylingSystem).components;

  return {
    marks: {
      link: ({ children, value }: any) =>
        `<a href="${value?.href || '#'}">${renderJsxToString(children)}</a>`,
    },
    types: {
      hero: ({ value }: any) =>
        renderJsxToString(
          <themeComponents.Hero
            title={value.title}
            subtitle={value.subtitle}
            imageUrl={value.imageUrl || value.url}
          />,
        ),

      card: ({ value }: any) =>
        renderJsxToString(
          <themeComponents.Card
            title={value.title}
            status={value.status}
            shape={value.shape}
            glow={value.glow}
          >
            {value.text || value.description || value.content}
          </themeComponents.Card>,
        ),

      quote: ({ value }: any) =>
        renderJsxToString(
          <themeComponents.Quote
            text={value.text || value.quote || ""}
            caption={value.caption || value.author}
          />,
        ),

      table: ({ value }: any) =>
        renderJsxToString(
          <themeComponents.Table
            rows={value.rows || value.content || []}
            withHeadings={value.withHeadings}
          />,
        ),

      code: ({ value }: any) =>
        renderJsxToString(
          <themeComponents.CodeBlock
            code={value.code || ""}
            language={value.language}
            filename={value.filename}
          />,
        ),

      codeBlock: ({ value }: any) =>
        renderJsxToString(
          <themeComponents.CodeBlock
            code={value.code || ""}
            language={value.language}
            filename={value.filename}
          />,
        ),

      image: ({ value }: any) => {
        const url = value.url || value.file?.url || "";
        const variant = value.variant || (value.simple ? "simple" : "styled");
        if (themeComponents.Image) {
          return renderJsxToString(
            <themeComponents.Image
              src={url}
              alt={value.caption || "Image"}
              caption={value.caption}
              stretched={value.stretched}
              withBorder={value.withBorder}
              withBackground={value.withBackground}
              variant={variant}
              simple={variant === "simple"}
              class=""
            />,
          );
        }
        // Image is optional on ThemeComponents — provide a token-agnostic fallback.
        return `<div class="content-frame"><img src="${url}" alt="${value.caption || "Image"}" class="content-img" loading="lazy" /></div>`;
      },

      video: ({ value }: any) => {
        const url = value.url || "";
        const embedUrl = resolveEmbedUrl(url) || undefined;
        return renderJsxToString(
          themeComponents.Video({ url, embedUrl, caption: value.caption }),
        );
      },

      embed: ({ value }: any) =>
        renderJsxToString(
          themeComponents.Embed({
            embed: value.embed || "",
            caption: value.caption,
          }),
        ),

      delimiter: () => renderJsxToString(themeComponents.Delimiter()),
    },
  };
};

/**
 * Renders an array of PortableText blocks to HTML using the active theme connector components.
 */
export const renderPortableText = (
  blocks: any[],
  stylingSystem = "ruri",
): string => {
  if (!blocks || !Array.isArray(blocks)) return "";
  const components = createPortableTextComponents(stylingSystem);
  return toHTML(blocks, { components });
};

/**
 * Extracts the first image from PortableText blocks.
 */
export const getFirstImageForPortableText = (blocks: any[]): string | null => {
  if (!blocks || !Array.isArray(blocks)) return null;
  const firstImageBlock = blocks.find(
    (b) => b._type === "image" || b._type === "hero",
  );
  if (!firstImageBlock) return null;
  return (
    firstImageBlock.imageUrl ||
    firstImageBlock.url ||
    firstImageBlock.file?.url ||
    null
  );
};

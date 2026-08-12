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
 * Ensures user-entered URL strings are valid absolute/relative links.
 * Auto-prepends 'https://' if domain string is entered without a protocol.
 */
export const formatUrl = (url: string): string => {
  if (!url) return "#";
  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return trimmed;
  }
  return `https://${trimmed}`;
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
        `<a href="${formatUrl(value?.href)}">${renderJsxToString(children)}</a>`,
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

      card: ({ value }: any) => {
        const title = value.title || "";
        const desc = value.description || value.text || value.content || "";
        const imageUrl = value.imageUrl || value.url || "";
        const badge = value.badge || value.status || "";
        const rawLinkUrl = value.linkUrl || "";
        const linkUrl = rawLinkUrl ? formatUrl(rawLinkUrl) : "";

        return renderJsxToString(
          <themeComponents.Card
            title={title}
            status={badge}
            shape={value.shape || "sci-fi"}
            glow={value.glow !== false}
            class="my-6"
          >
            <div class="flex flex-col gap-4">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={title}
                  class="w-full max-h-72 object-cover rounded-md border border-ruriBorderOutline/30"
                  loading="lazy"
                />
              )}
              {desc && <p class="m-0 leading-relaxed text-sm">{desc}</p>}
              {linkUrl && (
                <a
                  href={linkUrl}
                  class="text-xs font-mono font-semibold uppercase tracking-wider text-ruriPrimary hover:underline w-fit mt-2 inline-flex items-center gap-1"
                >
                  Learn more →
                </a>
              )}
            </div>
          </themeComponents.Card>,
        );
      },

      bentoGrid: ({ value }: any) => {
        const sectionTitle = value.sectionTitle || "";
        const columns = value.columns || 3;
        const cards = value.cards || [];

        return renderJsxToString(
          <div class="my-8 flex flex-col gap-6">
            {sectionTitle && (
              <h2 class="text-xl font-mono font-bold tracking-wider uppercase text-center m-0">
                {sectionTitle}
              </h2>
            )}
            <themeComponents.Grid
              cols={{ sm: 1, md: columns }}
              gap={6}
            >
              {cards.map((card: any, idx: number) => {
                const title = card.title || "";
                const desc = card.description || card.text || "";
                const imageUrl = card.imageUrl || card.url || "";
                const badge = card.badge || card.status || "";
                const span = Math.min(card.colSpan || 1, columns);

                return (
                  <div
                    key={card._key || idx}
                    style={`grid-column: span ${span};`}
                    class="w-full"
                  >
                    <themeComponents.Card
                      title={title}
                      status={badge}
                      shape={card.shape || "sci-fi"}
                      glow={card.glow !== false}
                    >
                      <div class="flex flex-col gap-3">
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt={title}
                            class="w-full h-36 object-cover rounded-md border border-ruriBorderOutline/30"
                            loading="lazy"
                          />
                        )}
                        {desc && <p class="m-0 text-sm leading-normal">{desc}</p>}
                      </div>
                    </themeComponents.Card>
                  </div>
                );
              })}
            </themeComponents.Grid>
          </div>,
        );
      },

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

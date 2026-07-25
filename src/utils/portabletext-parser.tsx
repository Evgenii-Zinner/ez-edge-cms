/** @jsxImportSource hono/jsx */
/**
 * @module PortableTextParser
 * @description Renders PortableText JSON blocks into HTML using the CMS design system's ThemeConnector components.
 */

import { toHTML } from "@portabletext/to-html";
import { themeRegistry } from "@core/theme";

export interface PortableTextBlock {
  _key?: string;
  _type: string;
  [key: string]: any;
}

/**
 * Safely renders a Hono JSX element to an HTML string for @portabletext/to-html.
 */
const renderJsxToString = (element: any): string => {
  if (!element) return "";
  if (typeof element === "string") return element;
  if (typeof element.toString === "function") return element.toString();
  return String(element);
};

/**
 * Creates PortableText custom components serializer for the active styling system.
 */
const createPortableTextComponents = (stylingSystem = "ruri") => {
  const themeComponents = themeRegistry.get(stylingSystem).components;

  return {
    types: {
      hero: ({ value }: any) => {
        return renderJsxToString(
          <themeComponents.Hero
            title={value.title}
            subtitle={value.subtitle}
            imageUrl={value.imageUrl || value.url}
          />
        );
      },

      card: ({ value }: any) => {
        return renderJsxToString(
          <themeComponents.Card
            title={value.title}
            status={value.status}
            shape={value.shape}
            glow={value.glow}
          >
            {value.text || value.description || value.content}
          </themeComponents.Card>
        );
      },

      quote: ({ value }: any) => {
        return renderJsxToString(
          <themeComponents.Quote
            text={value.text || value.quote || ""}
            caption={value.caption || value.author}
          />
        );
      },

      table: ({ value }: any) => {
        const rawRows = value.rows || value.content || [];
        return renderJsxToString(
          <themeComponents.Table
            rows={rawRows}
            withHeadings={value.withHeadings}
          />
        );
      },

      code: ({ value }: any) => {
        return renderJsxToString(
          <themeComponents.CodeBlock
            code={value.code || ""}
            language={value.language}
            filename={value.filename}
          />
        );
      },

      codeBlock: ({ value }: any) => {
        return renderJsxToString(
          <themeComponents.CodeBlock
            code={value.code || ""}
            language={value.language}
            filename={value.filename}
          />
        );
      },

      image: ({ value }: any) => {
        const url = value.url || value.file?.url || "";
        const alt = value.caption || "Image";

        if (themeComponents.Image) {
          return renderJsxToString(
            <themeComponents.Image
              src={url}
              alt={alt}
              caption={value.caption}
              stretched={value.stretched}
              withBorder={value.withBorder}
              withBackground={value.withBackground}
            />
          );
        }

        const wrapperClasses = [
          "content-frame",
          value.stretched ? "image-stretched" : "",
          value.withBorder ? "image-with-border" : "",
          value.withBackground ? "image-with-background" : "",
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
            ${value.caption ? `<div style="text-align: center; color: var(--ruri-text-muted); font-size: 0.8rem; margin-top: 0.5rem;">${value.caption}</div>` : ""}
          </div>
        `;
      },

      video: ({ value }: any) => {
        const url = value.url || "";
        let embedUrl = "";
        let hostname = "";
        try {
          const parsed = new URL(url);
          hostname = parsed.hostname.toLowerCase();
        } catch (_) {}

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
          const regExp =
            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
          const match = url.match(regExp);
          if (match && match[2].length === 11) {
            embedUrl = `https://www.youtube.com/embed/${match[2]}`;
          }
        } else if (isVimeo) {
          const regExp = /vimeo\.com\/([0-9]+)/;
          const match = url.match(regExp);
          if (match) {
            embedUrl = `https://player.vimeo.com/video/${match[1]}`;
          }
        }

        const mediaHtml = embedUrl
          ? `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>`
          : `<video src="${url}" controls width="100%" height="100%" preload="metadata"></video>`;

        return `
          <div class="my-8">
            <div class="aspect-video w-full border border-solid border-[var(--ruri-border-outline)] bg-[rgba(0,0,0,0.2)]">
              ${mediaHtml}
            </div>
            ${value.caption ? `<div class="text-center text-0.8rem color-[var(--ruri-text-muted)] mt-2 italic">${value.caption}</div>` : ""}
          </div>
        `;
      },

      embed: ({ value }: any) => {
        return `
          <div class="my-8">
            <div class="aspect-video w-full border border-solid border-[var(--ruri-border-outline)] bg-[rgba(0,0,0,0.2)]">
              <iframe 
                src="${value.embed}" 
                width="100%" 
                height="100%" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
                loading="lazy"
              ></iframe>
            </div>
            ${value.caption ? `<div class="text-center text-0.8rem color-[var(--ruri-text-muted)] mt-2 italic">${value.caption}</div>` : ""}
          </div>
        `;
      },

      delimiter: () => {
        return `<hr class="my-12 border-t border-solid border-[var(--ruri-border-outline)] opacity-30" />`;
      },
    },
  };
};

/**
 * Renders an array of PortableText blocks to HTML using the active theme connector components.
 */
export const renderPortableText = (blocks: any[], stylingSystem = "ruri"): string => {
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

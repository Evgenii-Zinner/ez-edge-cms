/**
 * @module PortableTextParser
 * @description Renders PortableText JSON blocks into HTML using the CMS design system.
 */

import { toHTML } from "@portabletext/to-html";

export interface PortableTextBlock {
  _key?: string;
  _type: string;
  [key: string]: any;
}

const portableTextComponents = {
  types: {
    hero: ({ value }: any) => {
      return `
        <div class="relative min-h-[500px] flex items-center justify-center text-center overflow-hidden my-12 border border-solid border-[var(--theme-accent-glow)]">
          <div 
            class="absolute top-0 left-0 w-full h-full z-0 bg-cover bg-center opacity-40 transition-transform duration-10000 hover:scale-110"
            style="background-image: url('${value.imageUrl || value.url || ""}')"
          ></div>
          <div class="relative z-10 px-8 max-w-4xl">
            <h1 class="text-3rem md:text-5rem font-header mb-4 text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] leading-tight">
              ${value.title || ""}
            </h1>
            ${value.subtitle ? `<p class="text-1.2rem md:text-1.5rem font-nav text-[var(--theme-text-main)] opacity-90 tracking-widest uppercase drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">${value.subtitle}</p>` : ""}
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-[var(--theme-bg)] to-transparent opacity-60 pointer-events-none"></div>
        </div>
      `;
    },
    table: ({ value }: any) => {
      const rawRows = value.rows || value.content || [];
      const withHeadings = value.withHeadings || false;
      let tableHtml = `<div class="overflow-x-auto my-8"><table class="w-full border-collapse">`;

      // Helper to extract cells from a row
      const getCells = (row: any): string[] => {
        return Array.isArray(row)
          ? row
          : row && Array.isArray(row.cells)
            ? row.cells
            : [];
      };

      if (withHeadings && rawRows.length > 0) {
        tableHtml += `<thead><tr class="border-b border-b-solid border-[var(--theme-accent-glow)]">`;
        const firstRowCells = getCells(rawRows[0]);
        firstRowCells.forEach((cell: string) => {
          tableHtml += `<th class="p-4 text-left font-header color-[var(--theme-accent)]">${cell || ""}</th>`;
        });
        tableHtml += `</tr></thead>`;
      }

      tableHtml += `<tbody>`;
      const startRow = withHeadings ? 1 : 0;
      for (let i = startRow; i < rawRows.length; i++) {
        tableHtml += `<tr class="border-b border-b-solid border-[var(--theme-accent-glow)] last:border-0">`;
        const cells = getCells(rawRows[i]);
        cells.forEach((cell: string) => {
          tableHtml += `<td class="p-4 font-body color-[var(--theme-text-main)]">${cell || ""}</td>`;
        });
        tableHtml += `</tr>`;
      }
      tableHtml += `</tbody></table></div>`;
      return tableHtml;
    },
    code: ({ value }: any) => {
      const escape = (str: string) =>
        str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      return `
        <div class="admin-card font-mono text-0.9rem bg-[rgba(0,0,0,0.5)] border-solid my-8 p-6 overflow-x-auto">
          <pre><code>${escape(value.code || "")}</code></pre>
        </div>
      `;
    },
    codeBlock: ({ value }: any) => {
      const escape = (str: string) =>
        str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      return `
        <div class="admin-card font-mono text-0.9rem bg-[rgba(0,0,0,0.5)] border-solid my-8 p-6 overflow-x-auto">
          ${value.filename ? `<div class="text-xs text-[var(--theme-text-dim)] border-b border-solid border-[var(--theme-accent-glow)] pb-2 mb-2">${value.filename}</div>` : ""}
          <pre><code class="${value.language || ""}">${escape(value.code || "")}</code></pre>
        </div>
      `;
    },
    image: ({ value }: any) => {
      const url = value.url || value.file?.url || "";
      const alt = value.caption || "Image";
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
          ${value.caption ? `<div style="text-align: center; color: var(--theme-text-dim); font-size: 0.8rem; margin-top: 0.5rem;">${value.caption}</div>` : ""}
        </div>
      `;
    },
    video: ({ value }: any) => {
      const url = value.url || "";
      let embedUrl = "";
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const regExp =
          /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
          embedUrl = `https://www.youtube.com/embed/${match[2]}`;
        }
      } else if (url.includes("vimeo.com")) {
        const regExp = /vimeo\.com\/([0-9]+)/;
        const match = url.match(regExp);
        if (match) {
          embedUrl = `https://player.vimeo.com/video/${match[1]}`;
        }
      }

      const mediaHtml = embedUrl
        ? `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allowfullscreen loading="lazy"></iframe>`
        : `<video src="${url}" controls width="100%" height="100%" preload="metadata"></video>`;

      return `
        <div class="my-8">
          <div class="aspect-video w-full border border-solid border-[var(--theme-accent-glow)] bg-[rgba(0,0,0,0.2)]">
            ${mediaHtml}
          </div>
          ${value.caption ? `<div class="text-center text-0.8rem color-[var(--theme-text-dim)] mt-2 italic">${value.caption}</div>` : ""}
        </div>
      `;
    },
    embed: ({ value }: any) => {
      return `
        <div class="my-8">
          <div class="aspect-video w-full border border-solid border-[var(--theme-accent-glow)] bg-[rgba(0,0,0,0.2)]">
            <iframe 
              src="${value.embed}" 
              width="100%" 
              height="100%" 
              frameborder="0" 
              allowfullscreen
              loading="lazy"
            ></iframe>
          </div>
          ${value.caption ? `<div class="text-center text-0.8rem color-[var(--theme-text-dim)] mt-2 italic">${value.caption}</div>` : ""}
        </div>
      `;
    },
    delimiter: () => {
      return `<hr class="my-12 border-t border-solid border-[var(--theme-accent-glow)] opacity-30" />`;
    },
  },
};

/**
 * Renders an array of PortableText blocks to HTML.
 */
export const renderPortableText = (blocks: any[]): string => {
  if (!blocks || !Array.isArray(blocks)) return "";
  return toHTML(blocks, { components: portableTextComponents });
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

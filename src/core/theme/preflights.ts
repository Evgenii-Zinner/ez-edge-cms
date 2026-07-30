/**
 * @module ThemePreflights
 * @description Centralized content preflight generator for EZ EDGE CMS theme connectors.
 * Takes a ThemeTokenMap and generates standard typography, resets, link states,
 * and media frame styling without duplicating CSS string templates per connector.
 */

import { ThemeTokenMap } from "./tokens";
import type { UserConfig } from "unocss";

export function createContentPreflights(tokens: ThemeTokenMap): UserConfig {
  const hoverColor = tokens.primaryHover || tokens.primary;

  return {
    shortcuts: {
      "content-frame": `my-8 overflow-hidden border border-solid border-[${tokens.border}] bg-[${tokens.surface}] p-2 shadow-xs`,
      "content-img": "max-w-full h-auto block mx-auto",
      "image-stretched":
        "important-w-[calc(100%+4rem)] important-ml--8 important-mr--8 important-max-w-none",
      "image-with-border": `important-border-2 important-border-solid important-border-[${tokens.primary}]`,
      "image-with-background": `bg-[${tokens.surfaceVariant}] important-p-12 flex flex-col justify-center items-center`,
    },
    preflights: [
      {
        getCSS: () => `
          *, ::before, ::after { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            background-color: var(--astryx-surface, var(--ruri-surface, var(--theme-surface, ${tokens.surface})));
            color: var(--astryx-text, var(--ruri-text, var(--theme-text, ${tokens.text})));
            font-family: ${tokens.fontBody};
            line-height: 1.6;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }

          html[data-theme='dark'],
          html[data-theme='dark'] body,
          html[data-theme='dark'] #main-content {
            background-color: var(--astryx-surface, var(--ruri-surface, #0f172a));
            color: var(--astryx-text, var(--ruri-text, #f8fafc));
          }

          #main-content {
            position: relative;
            z-index: 2;
            flex: 1 0 auto;
            width: 100%;
          }

          #main-content h1, #main-content h2, #main-content h3 {
            font-family: ${tokens.fontHeader};
            font-weight: 700;
            color: ${tokens.primary};
            letter-spacing: 0.04em;
            line-height: 1.25;
            margin: clamp(1.5rem, 4vw, 2.5rem) 0 clamp(0.8rem, 2vw, 1.4rem);
          }
          #main-content h1 { font-size: clamp(2rem, 5vw, 3.2rem); }
          #main-content h2 { font-size: clamp(1.6rem, 4vw, 2.4rem); }
          #main-content h3 { font-size: clamp(1.3rem, 3vw, 1.8rem); }

          #main-content h4, #main-content h5, #main-content h6 {
            font-family: ${tokens.fontHeader};
            font-weight: 600;
            color: ${tokens.text};
            letter-spacing: 0.02em;
            margin: clamp(1.2rem, 3vw, 1.8rem) 0 clamp(0.5rem, 1.5vw, 1rem);
          }
          #main-content h4 { font-size: clamp(1.1rem, 2.5vw, 1.4rem); }

          #main-content p {
            font-family: ${tokens.fontBody};
            line-height: 1.7;
            color: ${tokens.textMuted};
            margin-bottom: 1.5rem;
            font-size: 1.05rem;
          }

          #main-content a {
            color: ${tokens.primary};
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s ease;
          }
          #main-content a:hover {
            color: ${hoverColor};
            text-decoration: underline;
          }

          #main-content :not(pre) > code {
            background: ${tokens.surfaceVariant};
            border: 1px solid ${tokens.border};
            color: ${tokens.primary};
            padding: 0.2rem 0.45rem;
            font-family: ${tokens.fontMono};
            font-size: 0.9rem;
          }

          #main-content blockquote {
            background: ${tokens.surfaceVariant};
            border-left: 4px solid ${tokens.primary};
            padding: 1.25rem 1.5rem;
            margin: 1.75rem 0;
            font-style: italic;
            color: ${tokens.text};
          }
          #main-content blockquote p { margin: 0; }

          #main-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.75rem 0;
            font-family: ${tokens.fontBody};
            font-size: 0.95rem;
          }
          #main-content th, #main-content td {
            padding: 0.75rem 1rem;
            text-align: left;
            border-bottom: 1px solid ${tokens.border};
          }
          #main-content th {
            font-family: ${tokens.fontHeader};
            font-weight: 600;
            color: ${tokens.primary};
            background: rgba(${tokens.primaryRgb || "0, 195, 255"}, 0.05);
            border-bottom: 2px solid ${tokens.primary};
          }
          #main-content td {
            color: ${tokens.textMuted};
          }
          #main-content tbody tr:hover {
            background: rgba(${tokens.primaryRgb || "0, 195, 255"}, 0.04);
          }
        `,
      },
    ],
  };
}

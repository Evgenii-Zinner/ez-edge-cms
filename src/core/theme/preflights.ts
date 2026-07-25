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
      "content-frame":
        `my-8 rounded-xl overflow-hidden border border-solid border-[${tokens.border}] bg-[${tokens.surface}] p-2 shadow-xs`,
      "content-img": "max-w-full h-auto block mx-auto rounded-lg",
      "image-stretched":
        "important-w-[calc(100%+4rem)] important-ml--8 important-mr--8 important-max-w-none important-rounded-none",
      "image-with-border":
        `important-border-2 important-border-solid important-border-[${tokens.primary}]`,
      "image-with-background":
        `bg-[${tokens.surfaceVariant}] important-p-12 flex flex-col justify-center items-center rounded-xl`,
    },
    preflights: [
      {
        getCSS: () => `
          *, ::before, ::after { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0;
            background-color: ${tokens.surface};
            color: ${tokens.text};
            font-family: ${tokens.fontBody};
            line-height: 1.6;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }

          #main-content {
            position: relative;
            z-index: 2;
            max-width: 1200px;
            margin: clamp(1.5rem, 5vw, 3rem) auto;
            padding: 0 clamp(1rem, 5vw, 2.5rem);
            flex: 1 0 auto;
            width: 100%;
          }

          #main-content h1, #main-content h2, #main-content h3, #main-content h4, #main-content h5, #main-content h6 {
            font-family: ${tokens.fontHeader};
            font-weight: 700;
            color: ${tokens.text};
            letter-spacing: -0.02em;
            line-height: 1.25;
            margin: clamp(1.2rem, 4vw, 2.2rem) 0 clamp(0.6rem, 2vw, 1.2rem);
          }
          #main-content h1 { font-size: clamp(2rem, 5vw, 3.2rem); }
          #main-content h2 { font-size: clamp(1.6rem, 4vw, 2.4rem); }
          #main-content h3 { font-size: clamp(1.3rem, 3vw, 1.8rem); }
          #main-content h4 { font-size: clamp(1.1rem, 2.5vw, 1.4rem); }

          #main-content p {
            font-family: ${tokens.fontBody};
            line-height: 1.65;
            color: ${tokens.textMuted};
            margin-bottom: 1.25rem;
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

          #main-content ul, #main-content ol {
            padding-left: 1.5rem;
            margin: 1.25rem 0;
            color: ${tokens.textMuted};
          }
          #main-content li {
            margin-bottom: 0.5rem;
            line-height: 1.6;
          }

          #main-content code {
            background: ${tokens.surfaceVariant};
            border: 1px solid ${tokens.border};
            border-radius: 6px;
            color: ${tokens.primary};
            padding: 0.2rem 0.45rem;
            font-family: ${tokens.fontMono};
            font-size: 0.9rem;
          }

          #main-content blockquote {
            background: ${tokens.surfaceVariant};
            border-left: 4px solid ${tokens.primary};
            border-radius: 0 12px 12px 0;
            padding: 1.25rem 1.5rem;
            margin: 1.75rem 0;
            font-style: italic;
            color: ${tokens.text};
          }
          #main-content blockquote p { margin: 0; }
        `,
      },
    ],
  };
}

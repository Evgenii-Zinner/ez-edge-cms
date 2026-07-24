import { defineConfig } from "unocss";
import presetWind4 from "@unocss/preset-wind4";
import presetAttributify from "@unocss/preset-attributify";
import presetIcons from "@unocss/preset-icons";

/**
 * Base Safelist: Minimal set of classes that might be used dynamically in content
 * but are not easily detectable by the static analyzer.
 */
export const BASE_SAFELIST = [
  "text-left",
  "text-center",
  "text-right",
  "italic",
  "font-bold",
  "underline",
  "open", // Used for mobile menu toggle
];

/**
 * Editor Safelist: Heavy UI classes for Editor.js and Admin-specific components
 * that are injected via client-side JavaScript.
 */
export const EDITOR_SAFELIST = [
  // Editor.js Core & Structure
  "ce-block",
  "ce-block__content",
  "ce-toolbar__content",
  "ce-block--selected",
  "ce-header",
  "ce-paragraph",
  "cdx-list",
  "cdx-list__item",
  "cdx-quote",
  "cdx-quote__text",
  "cdx-quote__caption",
  "cdx-simple-image",

  // Editor.js UI Action classes
  "ce-toolbar__plus",
  "ce-toolbar__settings-btn",
  "ce-toolbar__actions",
];

export default defineConfig({
  safelist: [...BASE_SAFELIST],
  presets: [
    presetWind4(),
    presetAttributify(),
    presetIcons({
      warn: true,
      cdn: "https://esm.sh/",
      extraProperties: {
        display: "inline-block",
        "vertical-align": "middle",
      },
    }),
  ],
  theme: {
    fontFamily: {
      header: "var(--font-header)",
      nav: "var(--font-nav)",
      body: "var(--font-body)",
      mono: "var(--font-mono)",
    },
  },
});

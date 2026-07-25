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

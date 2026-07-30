/** @jsxImportSource hono/jsx */
/**
 * @module ThemeComponents
 * @description Shared UI components for the Theme Styler.
 */

import type { FC } from "hono/jsx";

/**
 * Component: ThemeFontPreloader
 * Loads all available font options in bulk when the Theme Styler is opened.
 *
 * @param props - Component properties containing the array of font names.
 * @returns A JSX element containing the link tag.
 */
export const ThemeFontPreloader: FC<{ fonts: string[] }> = (props) => {
  const { fonts } = props;
  const uniqueFonts = [...new Set(fonts)];

  const fontUrl =
    "https://fonts.googleapis.com/css2?" +
    uniqueFonts
      .map((f) => "family=" + encodeURIComponent(f) + ":wght@400;600;700")
      .join("&") +
    "&display=swap";

  return <link rel="stylesheet" href={fontUrl} />;
};

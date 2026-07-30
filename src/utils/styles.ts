/**
 * @module Styles
 * @description Utilities for generating dynamic CSS variables and theming.
 * Delegates to the pluggable ThemeConnector architecture.
 */

import { ThemeConfig } from "@core/schema";
import { themeRegistry } from "@core/theme";

/**
 * Generates a string of CSS variable definitions based on the provided theme configuration.
 * Delegates to the active ThemeConnector (e.g. RuriThemeConnector).
 *
 * @param theme - The validated ThemeConfig object.
 * @returns A minified string of CSS variables defined within the :root scope.
 */
export const generateCssVariables = (theme: ThemeConfig): string => {
  const stylingSystem =
    (theme.values as Record<string, any>)?.styling_system || "ruri";
  const connector = themeRegistry.get(stylingSystem);
  return connector.generateCssVariables(theme, false);
};

/**
 * Generates a standard set of CSS variables for the administrative HUD.
 * Delegates to the active ThemeConnector in admin mode.
 *
 * @returns A minified string of administrative CSS variables.
 */
export const generateAdminCssVariables = (stylingSystem = "ruri"): string => {
  const connector = themeRegistry.get(stylingSystem);
  // Pass dummy theme object for admin mode
  const dummyTheme: ThemeConfig = {
    schemaVersion: "1.0.0",
    updatedAt: new Date().toISOString(),
    values: {
      font_header: "Orbitron",
      font_nav: "Chakra Petch",
      font_body: "Roboto",
      font_mono: "Fira Code",
      styling_system: stylingSystem,
    },
  };
  return connector.generateCssVariables(dummyTheme, true);
};

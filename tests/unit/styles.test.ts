import { describe, expect, it } from "bun:test";
import {
  generateCssVariables,
  generateAdminCssVariables,
} from "../../src/utils/styles";
import { ThemeConfig } from "../../src/core/schema";

describe("Styles Utilities", () => {
  describe("generateCssVariables", () => {
    const mockTheme: ThemeConfig = {
      schemaVersion: "1.0.0",
      updatedAt: new Date().toISOString(),
      values: {
        primary_hue: 200,
        primary_sat: "80%",
        primary_light: "60%",
        bg_sat: "10%",
        bg_light: "5%",
        surface_sat: "15%",
        surface_light: "10%",
        surface_opacity: 0.5,
        text_main_sat: "5%",
        text_main_light: "95%",
        text_dim_sat: "5%",
        text_dim_light: "75%",
        glow_spread: "15px",
        boot_speed: "1s",
        elevation: "20px",
        font_header: "HeaderFont",
        font_nav: "NavFont",
        font_body: "BodyFont",
        font_mono: "MonoFont",
      },
    };

    it("should generate correct CSS variables string using HSL", () => {
      const css = generateCssVariables(mockTheme);

      expect(css).toContain("--theme-primary-hue: 200");
      expect(css).toContain("--theme-primary-sat: 80%");
      expect(css).toContain(
        "--theme-bg: hsl(var(--theme-primary-hue), 10%, 5%)",
      );
      expect(css).toContain(
        "--theme-surface: hsla(var(--theme-primary-hue), 15%, 10%, 0.5)",
      );
      expect(css).toContain('--font-header: "HeaderFont", sans-serif');
      expect(css).toContain("--ui-glow-spread: 15px");
    });

    it("should be minified (no multiple spaces)", () => {
      const css = generateCssVariables(mockTheme);
      expect(css).not.toContain("  ");
      expect(css.startsWith(":root {")).toBe(true);
    });

    it("should handle different HSL values correctly", () => {
      const theme = {
        ...mockTheme,
        values: { ...mockTheme.values, bg_light: "2%" },
      };
      const css = generateCssVariables(theme);
      expect(css).toContain(
        "--theme-bg: hsl(var(--theme-primary-hue), 10%, 2%)",
      );
    });
  });

  describe("generateAdminCssVariables", () => {
    it("should generate administrative CSS variables string", () => {
      const css = generateAdminCssVariables();

      expect(css).toContain("--theme-primary-hue: 180");
      expect(css).toContain("--theme-accent: #00ffff");
      expect(css).toContain("--theme-bg: #050a0a");
      expect(css).toContain('--font-header: "Orbitron", sans-serif');
    });

    it("should be minified (no multiple spaces)", () => {
      const css = generateAdminCssVariables();
      expect(css).not.toContain("  ");
      expect(css.startsWith(":root {")).toBe(true);
    });
  });
});

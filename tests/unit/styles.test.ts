import { describe, expect, it, beforeEach, spyOn } from "bun:test";
import {
  generateCssVariables,
  generateAdminCssVariables,
} from "../../src/utils/styles";
import { ThemeConfig } from "../../src/core/schema";

describe("Styles Utilities", () => {
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

  beforeEach(() => {
    // Silence console for clean output
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
  });

  describe("generateCssVariables", () => {
    it("should generate a complete, HSL-driven CSS variable block for the public site", () => {
      const css = generateCssVariables(mockTheme);

      // Verify foundational HSL variables
      expect(css).toContain("--theme-primary-hue: 200");
      expect(css).toContain("--theme-primary-sat: 80%");
      expect(css).toContain("--theme-primary-light: 60%");

      // Verify derived semantic variables
      expect(css).toContain("--theme-accent: hsl(var(--theme-primary-hue), var(--theme-primary-sat), var(--theme-primary-light))");
      expect(css).toContain("--theme-bg: hsl(var(--theme-primary-hue), 10%, 5%)");
      expect(css).toContain("--theme-surface: hsla(var(--theme-primary-hue), 15%, 10%, 0.5)");
      expect(css).toContain("--theme-surface-solid: hsl(var(--theme-primary-hue), 15%, 10%)");
      
      // Verify typography and stacks
      expect(css).toContain('--font-header: "HeaderFont", sans-serif');
      expect(css).toContain('--font-mono: "MonoFont", "Consolas", "Monaco"');

      // Verify UI effects
      expect(css).toContain("--ui-glow-spread: 15px");
      expect(css).toContain("--ui-boot-speed: 1s");
      expect(css).toContain("--ui-elevation: 20px");
    });

    it("should ensure the output is strictly minified for edge performance", () => {
      const css = generateCssVariables(mockTheme);
      
      // No multiple spaces
      expect(css).not.toContain("  ");
      // No newlines (replaced by spaces in minifyCss)
      expect(css).not.toContain("\n");
      // Starts and ends correctly
      expect(css.startsWith(":root {")).toBe(true);
      expect(css.endsWith("}")).toBe(true);
    });

    it("should accurately reflect dynamic changes to theme values", () => {
      const darkTheme = {
        ...mockTheme,
        values: { ...mockTheme.values, primary_hue: 0, bg_light: "1%", surface_opacity: 0.2 }
      };
      const css = generateCssVariables(darkTheme);
      
      expect(css).toContain("--theme-primary-hue: 0");
      expect(css).toContain("--theme-bg: hsl(var(--theme-primary-hue), 10%, 1%)");
      expect(css).toContain("10%, 0.2)");
    });
  });

  describe("generateAdminCssVariables", () => {
    it("should generate a stable, readable CSS block for the Administrative HUD", () => {
      const css = generateAdminCssVariables();

      // Verify hardcoded fallback values for admin consistency
      expect(css).toContain("--theme-primary-hue: 180");
      expect(css).toContain("--theme-accent: #00ffff");
      expect(css).toContain("--theme-bg: #050a0a");
      
      // Verify semantic status colors (essential for admin UI)
      expect(css).toContain("--color-success: #00ff00");
      expect(css).toContain("--color-error: #ff4444");
      expect(css).toContain("--color-warning: #ffcc00");
      
      // Verify admin font stack
      expect(css).toContain('--font-header: "Orbitron", sans-serif');
    });

    it("should provide a high-fidelity monospaced stack for the JSON editor", () => {
      const css = generateAdminCssVariables();
      expect(css).toContain('--font-mono: "Fira Code", "Consolas"');
    });

    it("should be minified for zero-overhead injection into the admin panel", () => {
      const css = generateAdminCssVariables();
      expect(css).not.toContain("  ");
      expect(css).not.toContain("\n");
    });
  });
});

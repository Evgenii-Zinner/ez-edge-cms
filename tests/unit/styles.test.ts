import { describe, expect, it, beforeEach, spyOn } from "bun:test";
import {
  generateCssVariables,
  generateAdminCssVariables,
} from "../../src/utils/styles";
import { ThemeConfig } from "../../src/core/schema";
import { themeRegistry, RuriThemeConnector } from "../../src/core/theme";

describe("Styles Utilities & Theme Connectors", () => {
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
      styling_system: "ruri",
    },
  };

  beforeEach(() => {
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
  });

  describe("RuriThemeConnector", () => {
    it("should generate Ruri design system tokens driven by ThemeConfig", () => {
      const css = generateCssVariables(mockTheme);

      // Verify Ruri primary HSL & RGB tokens
      expect(css).toContain("--ruri-primary-h: 200");
      expect(css).toContain('--font-header: "HeaderFont", sans-serif');
    });

    it("should generate minified output without whitespace or newlines", () => {
      const css = generateCssVariables(mockTheme);
      expect(css).not.toContain("  ");
      expect(css).not.toContain("\n");
      expect(css).toContain(":root {");
      expect(css.endsWith("}")).toBe(true);
    });

    it("should accurately reflect dynamic changes to theme values", () => {
      const darkTheme: ThemeConfig = {
        ...mockTheme,
        values: {
          ...mockTheme.values,
          primary_hue: 0,
          bg_light: "1%",
          surface_opacity: 0.2,
          styling_system: "ruri",
        },
      };
      const css = generateCssVariables(darkTheme);

      expect(css).toContain("--ruri-primary-h: 0");
    });
  });

  describe("ThemeConnectorRegistry", () => {
    it("should register and retrieve connectors correctly", () => {
      const ruri = themeRegistry.get("ruri");
      expect(ruri).toBeInstanceOf(RuriThemeConnector);
      expect(themeRegistry.get("non-existent")).toBeInstanceOf(RuriThemeConnector);
      expect(themeRegistry.list().length).toBeGreaterThanOrEqual(2);

      // Verify ThemeComponents primitives exist on connectors
      expect(typeof ruri.components.Card).toBe("function");
      expect(typeof ruri.components.Button).toBe("function");
      expect(typeof ruri.components.Hero).toBe("function");
    });
  });

  describe("generateAdminCssVariables", () => {
    it("should generate a stable, readable CSS block for the Administrative HUD", () => {
      const css = generateAdminCssVariables();

      expect(css).toContain("--ruri-primary-h: 180");
      expect(css).toContain('--font-header: "Orbitron", sans-serif');
    });

    it("should provide a high-fidelity monospaced stack for the JSON editor", () => {
      const css = generateAdminCssVariables();
      expect(css).toContain('--font-mono: "Fira Code", "Consolas"');
    });

    it("should be minified for zero-overhead injection into the admin panel", () => {
      const css = generateAdminCssVariables();
      expect(css).not.toContain("  ");
    });
  });
});

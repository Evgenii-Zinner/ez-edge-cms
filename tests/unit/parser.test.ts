import { expect, test, describe, it } from "bun:test";
import { parseTheme, parseSite, parsePage } from "../../src/core/parser";

describe("Core Parser", () => {
  describe("parseTheme", () => {
    test("should parse valid theme JSON", () => {
      const valid = {
        schemaVersion: "1.0.0",
        updatedAt: new Date().toISOString(),
        values: {
          primary_hue: 200,
          primary_sat: "70%",
          primary_light: "50%",
          bg_color: "#050a0a",
          surface_color: "#0a1a1a",
          surface_opacity: 0.7,
          text_main: "#e0f2f2",
          text_dim: "#a0baba",
          glow_spread: "10px",
          boot_speed: "0.8s",
          elevation: "20px",
          font_header: "Orbitron",
          font_nav: "Chakra Petch",
          font_body: "Roboto",
          font_mono: "Fira Code",
        },
      };
      const result = parseTheme(valid);
      expect(result.values.primary_hue).toBe(200);
      expect(result.schemaVersion).toBe("1.0.0");
      expect(result.updatedAt).toBe(valid.updatedAt);
    });

    test("should fallback to default for invalid theme JSON (silent)", () => {
      const invalid = { values: { primary_hue: "not-a-number" } };
      // Passing empty string as name suppresses the console.error in safeParse
      const result = parseTheme(invalid, "");
      expect(result.values.primary_hue).toBe(180);
    });

    test("should fallback to default and log error for invalid theme JSON with name", () => {
      const invalid = { values: { primary_hue: "nan" } };
      // Passing a name will trigger console.error which is what we want for coverage
      const result = parseTheme(invalid, "Theme-Test-Error");
      expect(result.values.primary_hue).toBe(180);
    });

    test("should fallback to default for null theme", () => {
      const result = parseTheme(null);
      expect(result.values.primary_hue).toBe(180);
    });

    it("should handle unexpected errors during parsing (catch block)", () => {
      const explodingObject = {
        get values() {
          throw new Error("Boom");
        },
      };
      const result = parseTheme(explodingObject, "");
      expect(result.values.primary_hue).toBe(180);
    });
  });

  describe("parseSite", () => {
    test("should parse valid site JSON", () => {
      const valid = {
        title: "Test Site",
        adminEmail: "admin@test.com",
        language: "en",
        showStatus: true,
      };
      const result = parseSite(valid);
      expect(result.title).toBe("Test Site");
      expect(result.seo.identity.type).toBe("Organization");
    });

    test("should parse site with identity and links", () => {
      const complex = {
        title: "Brand Name",
        adminEmail: "admin@brand.com",
        seo: {
          identity: {
            type: "Person",
            name: "John Doe",
            links: [
              { platform: "Twitter", url: "https://twitter.com/johndoe" },
            ],
          },
        },
      };
      const result = parseSite(complex);
      expect(result.title).toBe("Brand Name");
      expect(result.seo.identity.type).toBe("Person");
      expect(result.seo.identity.name).toBe("John Doe");
      expect(result.seo.identity.links).toHaveLength(1);
    });

    test("should fallback to default for invalid site JSON", () => {
      const result = parseSite({ title: "" }, "");
      expect(result.title).toBe("My Awesome Website");
    });
  });

  describe("parsePage", () => {
    test("should return null for null page JSON", () => {
      const result = parsePage(null);
      expect(result).toBeNull();
    });

    test("should return null for invalid page JSON", () => {
      const result = parsePage({ title: "Incomplete" }, "");
      expect(result).toBeNull();
    });

    test("should parse valid page JSON", () => {
      const valid = {
        slug: "test",
        title: "Test Page",
        metadata: {
          author: "Test",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
      const result = parsePage(valid);
      expect(result?.title).toBe("Test Page");
      expect(result?.slug).toBe("test");
    });
  });
});

import { expect, describe, it, beforeEach, spyOn } from "bun:test";
import {
  parseTheme,
  parseSite,
  parseNav,
  parseFooter,
  parsePage,
} from "../../src/core/parser";
import { VERSIONS } from "@core/schema";

describe("Core Parser Utility", () => {
  beforeEach(() => {
    // Silence console for clean output
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
  });

  describe("parseTheme", () => {
    it("should parse a valid theme with foundational values", () => {
      const validTheme = {
        schemaVersion: VERSIONS.THEME,
        updatedAt: new Date().toISOString(),
        values: {
          primary_hue: 220,
          surface_opacity: 0.8,
          font_header: "Custom Font",
        },
      };

      const result = parseTheme(validTheme);
      expect(result.values.primary_hue).toBe(220);
      expect(result.values.surface_opacity).toBe(0.8);
      expect(result.values.font_header).toBe("Custom Font");
      // Verify defaults for omitted fields
      expect(result.values.font_body).toBe("Roboto");
    });

    it("should coerce string values to numbers where schema allows (primary_hue)", () => {
      const raw = {
        updatedAt: new Date().toISOString(),
        values: { primary_hue: "300" },
      };
      const result = parseTheme(raw);
      expect(result.values.primary_hue).toBe(300);
    });

    it("should fallback to factory defaults for invalid hue (outside 0-360)", () => {
      const invalid = { values: { primary_hue: 999 } };
      const result = parseTheme(invalid);
      expect(result.values.primary_hue).toBe(180); // Default
    });

    it("should fallback to defaults for null or undefined input", () => {
      expect(parseTheme(null).values.primary_hue).toBe(180);
      expect(parseTheme(undefined).values.primary_hue).toBe(180);
    });

    it("should handle unexpected object access errors gracefully", () => {
      const bomb = {
        get values() {
          throw new Error("Parser Bomb");
        },
      };
      const result = parseTheme(bomb);
      expect(result.values.primary_hue).toBe(180);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("parseSite", () => {
    it("should parse a valid site configuration", () => {
      const validSite = {
        title: "Parser Test",
        adminEmail: "dev@test.com",
        seo: {
          identity: {
            type: "LocalBusiness",
            name: "Test Shop",
          },
        },
      };

      const result = parseSite(validSite);
      expect(result.title).toBe("Parser Test");
      expect(result.adminEmail).toBe("dev@test.com");
      expect(result.seo.identity.type).toBe("LocalBusiness");
    });

    it("should fallback to default site when required fields (title) are missing", () => {
      const invalid = { tagline: "Missing Title" };
      const result = parseSite(invalid);
      expect(result.title).toBe("My Awesome Website");
    });

    it("should fallback to defaults for malformed email addresses", () => {
      const invalid = { title: "Test", adminEmail: "not-an-email" };
      const result = parseSite(invalid);
      expect(result.adminEmail).toBe("admin@example.com"); // Factory default
    });
  });

  describe("parseNav", () => {
    it("should parse a valid navigation menu", () => {
      const raw = {
        items: [
          { label: "Home", path: "/" },
          { label: "Blog", path: "/blog", icon: "mdi:blog" },
        ],
      };
      const result = parseNav(raw);
      expect(result.items).toHaveLength(2);
      expect(result.items[1].icon).toBe("mdi:blog");
    });

    it("should fallback to default navigation for malformed items", () => {
      const invalid = { items: "not-an-array" };
      const result = parseNav(invalid);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].label).toBe("HOME");
    });
  });

  describe("parseFooter", () => {
    it("should parse a valid footer configuration", () => {
      const raw = {
        links: [{ label: "Help", path: "/help" }],
      };
      const result = parseFooter(raw);
      expect(result.links).toHaveLength(1);
      expect(result.links[0].label).toBe("Help");
    });

    it("should fallback to defaults for empty or null input", () => {
      const result = parseFooter(null);
      expect(result.links).toContainEqual({ label: "Terms", path: "/terms" });
    });
  });

  describe("parsePage", () => {
    it("should parse a valid page configuration", () => {
      const now = new Date().toISOString();
      const validPage = {
        slug: "test-page",
        title: "Test Page",
        metadata: {
          author: "Admin",
          createdAt: now,
          updatedAt: now,
        },
      };

      const result = parsePage(validPage);
      expect(result).not.toBeNull();
      expect(result?.slug).toBe("test-page");
      expect(result?.title).toBe("Test Page");
    });

    it("should return null for invalid page data (Pages don't have factory fallbacks)", () => {
      const invalid = { slug: "", title: "Incomplete" };
      const result = parsePage(invalid);
      expect(result).toBeNull();
    });

    it("should return null for null or undefined input", () => {
      expect(parsePage(null)).toBeNull();
      expect(parsePage(undefined)).toBeNull();
    });
  });
});

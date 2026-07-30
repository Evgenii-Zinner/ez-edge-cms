import { describe, expect, it, beforeEach, spyOn } from "bun:test";
import {
  ThemeSchema,
  PageSchema,
  SiteSchema,
  NavSchema,
  FooterSchema,
  VERSIONS,
} from "../../src/core/schema";

describe("Core Zod Schemas", () => {
  beforeEach(() => {
    // Silence console for clean output (rarely needed for pure schema tests, but good practice)
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
  });

  describe("ThemeSchema", () => {
    const baseTheme = {
      updatedAt: new Date().toISOString(),
      values: {
        font_header: "Orbitron",
      },
    };

    it("should validate and apply all defaults from factory constants", () => {
      const result = ThemeSchema.safeParse(baseTheme);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.schemaVersion).toBe(VERSIONS.THEME);
        expect(result.data.values.font_header).toBe("Orbitron");
      }
    });

    it("should perform automatic type coercion for numeric inputs (Admin HUD compatibility)", () => {
      // (No longer applies to ThemeSchema as numeric fields were removed, but keeping test structure if needed)
    });
  });

  describe("PageSchema", () => {
    const basePage = {
      slug: "test-slug",
      title: "Test Page",
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    it("should validate a minimal page and assign default status/category", () => {
      const result = PageSchema.safeParse(basePage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("draft");
        expect(result.data.category).toBe("General");
        expect(result.data.content).toEqual([]);
      }
    });

    it("should enforce non-empty, slug-friendly characters (if enforced by regex in schema)", () => {
      expect(PageSchema.safeParse({ ...basePage, slug: "" }).success).toBe(
        false,
      );
    });

    it("should validate enum values for status and layout", () => {
      expect(
        PageSchema.safeParse({ ...basePage, status: "published" }).success,
      ).toBe(true);
      expect(
        PageSchema.safeParse({ ...basePage, status: "invalid" }).success,
      ).toBe(false);

      expect(
        PageSchema.safeParse({ ...basePage, appearance: { layout: "page" } })
          .success,
      ).toBe(true);
      expect(
        PageSchema.safeParse({ ...basePage, appearance: { layout: "custom" } })
          .success,
      ).toBe(false);
    });

    it("should handle optional SEO fields correctly", () => {
      const pageWithSeo = {
        ...basePage,
        seo: {
          metaTitle: "SEO Override",
          ogImage: "https://example.com/images/custom.png",
        },
      };
      const result = PageSchema.safeParse(pageWithSeo);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.seo.metaTitle).toBe("SEO Override");
      }
    });
  });

  describe("SiteSchema", () => {
    const baseSite = {
      title: "Parser Test",
      adminEmail: "dev@ezinner.com",
    };

    it("should strictly validate email formats for admin and contact fields", () => {
      expect(
        SiteSchema.safeParse({ ...baseSite, adminEmail: "invalid" }).success,
      ).toBe(false);
      expect(
        SiteSchema.safeParse({ ...baseSite, contactEmail: "valid@test.com" })
          .success,
      ).toBe(true);
      expect(
        SiteSchema.safeParse({ ...baseSite, contactEmail: "" }).success,
      ).toBe(true);
    });

    it("should validate complex nested objects like SEO identity and txtFiles", () => {
      const site = {
        ...baseSite,
        seo: {
          identity: {
            type: "Organization",
            name: "EZ-CORP",
            links: [{ platform: "Twitter", url: "https://twitter.com/ez" }],
          },
        },
        txtFiles: {
          robots: "User-agent: *",
        },
      };
      const result = SiteSchema.safeParse(site);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.seo.identity.type).toBe("Organization");
        expect(result.data.txtFiles.robots).toBe("User-agent: *");
      }
    });

    it("should validate the baseUrl as a proper URL or empty string", () => {
      expect(
        SiteSchema.safeParse({ ...baseSite, baseUrl: "https://ez-cms.com" })
          .success,
      ).toBe(true);
      expect(
        SiteSchema.safeParse({ ...baseSite, baseUrl: "not-a-url" }).success,
      ).toBe(false);
    });
  });

  describe("Nav & Footer Schemas", () => {
    it("NavSchema should validate an array of items with labels and paths", () => {
      const nav = {
        items: [
          { label: "Home", path: "/" },
          {
            label: "External",
            path: "https://google.com",
            icon: "mdi:external",
          },
        ],
      };
      const result = NavSchema.safeParse(nav);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(2);
        expect(result.data.items[1].icon).toBe("mdi:external");
      }
    });

    it("FooterSchema should validate links array and apply versioning", () => {
      const footer = {
        links: [{ label: "Help", path: "/help" }],
      };
      const result = FooterSchema.safeParse(footer);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.schemaVersion).toBe(VERSIONS.FOOTER);
        expect(result.data.links[0].label).toBe("Help");
      }
    });
  });
});

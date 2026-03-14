import { describe, expect, it } from "bun:test";
import {
  ThemeSchema,
  PageSchema,
  SiteSchema,
  VERSIONS,
} from "../../src/core/schema";

describe("Zod Schemas", () => {
  describe("ThemeSchema", () => {
    const validTheme = {
      updatedAt: new Date().toISOString(),
      values: {
        primary_hue: 200,
        surface_opacity: 0.5,
      },
    };

    it("should validate a correct theme object with defaults", () => {
      const result = ThemeSchema.safeParse(validTheme);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.schemaVersion).toBe(VERSIONS.THEME);
        expect(result.data.values.primary_hue).toBe(200);
        expect(result.data.values.glow_spread).toBe("10px"); // Default
      }
    });

    it("should reject invalid primary_hue", () => {
      const invalid = { ...validTheme, values: { primary_hue: 400 } };
      const result = ThemeSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject invalid surface_opacity", () => {
      const invalid = { ...validTheme, values: { surface_opacity: 1.5 } };
      const result = ThemeSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should coerce string hue to number", () => {
      const theme = { ...validTheme, values: { primary_hue: "250" } };
      const result = ThemeSchema.safeParse(theme);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.values.primary_hue).toBe(250);
      }
    });
  });

  describe("PageSchema", () => {
    const validPage = {
      slug: "test-page",
      title: "Test Title",
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    it("should validate a minimal page", () => {
      const result = PageSchema.safeParse(validPage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("draft");
        expect(result.data.category).toBe("General");
      }
    });

    it("should reject empty slug", () => {
      const invalid = { ...validPage, slug: "" };
      const result = PageSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject invalid featuredImage URL", () => {
      const invalid = { ...validPage, featuredImage: "not-a-url" };
      const result = PageSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should allow empty string for featuredImage", () => {
      const page = { ...validPage, featuredImage: "" };
      const result = PageSchema.safeParse(page);
      expect(result.success).toBe(true);
    });

    it("should validate SEO overrides", () => {
      const page = {
        ...validPage,
        seo: {
          metaTitle: "SEO Title",
          pageType: "AboutPage",
        },
      };
      const result = PageSchema.safeParse(page);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.seo.pageType).toBe("AboutPage");
      }
    });
  });

  describe("SiteSchema", () => {
    const validSite = {
      title: "My Site",
      adminEmail: "admin@test.com",
    };

    it("should validate a minimal site config", () => {
      const result = SiteSchema.safeParse(validSite);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.language).toBe("en");
        expect(result.data.showStatus).toBe(true);
      }
    });

    it("should reject invalid adminEmail", () => {
      const invalid = { ...validSite, adminEmail: "not-email" };
      const result = SiteSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should validate social links in SEO identity", () => {
      const site = {
        ...validSite,
        seo: {
          identity: {
            links: [{ platform: "Twitter", url: "https://twitter.com/test" }],
          },
        },
      };
      const result = SiteSchema.safeParse(site);
      expect(result.success).toBe(true);
    });

    it("should reject invalid social link URL", () => {
      const site = {
        ...validSite,
        seo: {
          identity: {
            links: [{ platform: "Twitter", url: "invalid-url" }],
          },
        },
      };
      const result = SiteSchema.safeParse(site);
      expect(result.success).toBe(false);
    });
  });
});

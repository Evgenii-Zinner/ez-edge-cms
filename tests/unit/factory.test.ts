import { describe, expect, it, beforeAll, spyOn } from "bun:test";
import {
  createDefaultSite,
  createDefaultNav,
  createDefaultFooter,
  createDefaultTheme,
  createDefaultPage,
  createTermsPage,
  createPrivacyPage,
  createDefaultTxtFiles,
} from "../../src/core/factory";
import { VERSIONS } from "../../src/core/schema";

describe("Factory Utilities", () => {
  // Silence console during tests to keep output clean
  beforeAll(() => {
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
    spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("createDefaultTxtFiles", () => {
    it("should generate standard compliance files", () => {
      const files = createDefaultTxtFiles("https://example.com", "John Doe");
      expect(files.robots).toContain("User-agent: *");
      expect(files.humans).toContain("Developer: John Doe");
      expect(files.humans).toContain("Site: https://example.com");
      expect(files.llms).toContain("# AI Crawler Instructions");
      expect(files.ads).toContain("# Add your authorized digital sellers here");
    });

    it("should use default parameters", () => {
      const files = createDefaultTxtFiles();
      expect(files.humans).toContain("Developer: Admin");
      expect(files.humans).toContain("Site: ");
    });
  });

  describe("createDefaultSite", () => {
    it("should create a valid default site configuration", () => {
      const site = createDefaultSite();
      expect(site.schemaVersion).toBe(VERSIONS.SITE);
      expect(site.title).toBe("My Awesome Website");
      expect(site.adminEmail).toBe("admin@example.com");
      expect(site.copyright).toContain("{year}");
      expect(site.seo.identity.type).toBe("Organization");
      expect(site.txtFiles.robots).toBeDefined();
    });
  });

  describe("createDefaultNav", () => {
    it("should create a minimal navigation menu", () => {
      const nav = createDefaultNav();
      expect(nav.schemaVersion).toBe(VERSIONS.NAV);
      expect(nav.items).toHaveLength(1);
      expect(nav.items[0]).toEqual({ label: "HOME", path: "/" });
    });
  });

  describe("createDefaultFooter", () => {
    it("should include legal compliance links", () => {
      const footer = createDefaultFooter();
      expect(footer.schemaVersion).toBe(VERSIONS.FOOTER);
      expect(footer.links).toHaveLength(2);
      expect(footer.links.some((l) => l.path === "/terms")).toBe(true);
      expect(footer.links.some((l) => l.path === "/privacy")).toBe(true);
    });
  });

  describe("createDefaultTheme", () => {
    it("should set foundational design system values", () => {
      const theme = createDefaultTheme();
      expect(theme.schemaVersion).toBe(VERSIONS.THEME);
      expect(theme.values.primary_hue).toBe(180);
      expect(theme.values.font_header).toBe("Orbitron");
    });

    it("should allow partial overrides", () => {
      const theme = createDefaultTheme({
        primary_hue: 250,
        font_body: "Inter",
      });
      expect(theme.values.primary_hue).toBe(250);
      expect(theme.values.font_body).toBe("Inter");
      expect(theme.values.font_header).toBe("Orbitron"); // Preserved default
    });
  });

  describe("createDefaultPage", () => {
    it("should initialize a draft page with unique block IDs", () => {
      const page = createDefaultPage("New Page", "new-page");
      expect(page.schemaVersion).toBe(VERSIONS.PAGE);
      expect(page.title).toBe("New Page");
      expect(page.slug).toBe("new-page");
      expect(page.status).toBe("draft");
      expect(page.content.blocks).toHaveLength(2);

      const blockIds = page.content.blocks.map((b) => b.id);
      expect(blockIds[0]).not.toBe(blockIds[1]); // Ensure ID generator is working
      expect(page.metadata.author).toBeDefined();
      expect(page.metadata.createdAt).toBe(page.metadata.updatedAt);
    });
  });

  describe("Legal Page Generators", () => {
    it("should create a terms page from template with injected data", () => {
      const page = createTermsPage("CoolSite", "EntityX");
      expect(page.title).toBe("Terms of Service");
      expect(page.slug).toBe("terms");

      const contentStr = JSON.stringify(page.content);
      expect(contentStr).toContain("CoolSite");
      expect(contentStr).toContain("EntityX");
      expect(page.metadata.usedBlocks).toContain("header");
    });

    it("should create a privacy page from template with injected data", () => {
      const page = createPrivacyPage("SafeSite", "OwnerY");
      expect(page.title).toBe("Privacy Policy");
      expect(page.slug).toBe("privacy");

      const contentStr = JSON.stringify(page.content);
      expect(contentStr).toContain("SafeSite");
      expect(contentStr).toContain("OwnerY");
    });
  });
});

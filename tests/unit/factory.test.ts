import { describe, expect, it } from "bun:test";
import {
  createDefaultSite,
  createDefaultNav,
  createDefaultFooter,
  createDefaultTheme,
  createDefaultPage,
  createTermsPage,
  createPrivacyPage,
} from "../../src/core/factory";
import { VERSIONS } from "../../src/core/schema";

describe("Factory Utilities", () => {
  it("should create a default site configuration", () => {
    const site = createDefaultSite();
    expect(site.schemaVersion).toBe(VERSIONS.SITE);
    expect(site.title).toBeDefined();
    expect(site.seo.identity.type).toBe("Organization");
  });

  it("should create a default navigation configuration", () => {
    const nav = createDefaultNav();
    expect(nav.schemaVersion).toBe(VERSIONS.NAV);
    expect(nav.items.length).toBeGreaterThan(0);
    expect(nav.items[0].path).toBe("/");
  });

  it("should create a default footer configuration", () => {
    const footer = createDefaultFooter();
    expect(footer.schemaVersion).toBe(VERSIONS.FOOTER);
    expect(footer.links.some((l) => l.path === "/terms")).toBe(true);
  });

  it("should create a default theme with overrides", () => {
    const theme = createDefaultTheme({ primary_hue: 200 });
    expect(theme.schemaVersion).toBe(VERSIONS.THEME);
    expect(theme.values.primary_hue).toBe(200);
    expect(theme.values.font_header).toBeDefined();
  });

  it("should create a default page", () => {
    const page = createDefaultPage("Test Page", "test-page");
    expect(page.schemaVersion).toBe(VERSIONS.PAGE);
    expect(page.title).toBe("Test Page");
    expect(page.slug).toBe("test-page");
    expect(page.status).toBe("draft");
    expect(page.content.blocks.length).toBeGreaterThan(0);
  });

  it("should create a terms page from template", () => {
    const page = createTermsPage("My Site", "John Doe");
    expect(page.title).toBe("Terms of Service");
    expect(page.slug).toBe("terms");
    // Check if template injection worked
    const text = JSON.stringify(page.content);
    expect(text).toContain("My Site");
    expect(text).toContain("John Doe");
  });

  it("should create a privacy page from template", () => {
    const page = createPrivacyPage("My Site", "John Doe");
    expect(page.title).toBe("Privacy Policy");
    expect(page.slug).toBe("privacy");
    const text = JSON.stringify(page.content);
    expect(text).toContain("My Site");
    expect(text).toContain("John Doe");
  });
});

import { describe, it, expect } from "bun:test";
import { BaseLayout } from "../../src/layouts/BaseLayout";
import { AdminLayout } from "../../src/layouts/AdminLayout";
import {
  createDefaultSite,
  createDefaultNav,
  createDefaultFooter,
  createDefaultTheme,
  createDefaultPage,
} from "../../src/core/factory";

describe("Layouts", () => {
  const site = createDefaultSite();
  const nav = createDefaultNav();
  const footer = createDefaultFooter();
  const theme = createDefaultTheme();
  const page = createDefaultPage("Test", "test");

  describe("BaseLayout", () => {
    it("should render correctly", () => {
      const html = BaseLayout({
        title: "Test Page",
        children: <div>Content</div>,
        site,
        nav,
        footer,
        theme,
        page,
      }).toString();

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html");
      expect(html).toContain("<head>");
      expect(html).toContain("TEST PAGE | " + site.title);
      expect(html).toContain("Content");
      expect(html).toContain("main-header");
      expect(html).toContain("main-footer");
      expect(html).toContain("mobile-menu-toggle");
    });

    it("should render logo if present", () => {
      const siteWithLogo = { ...site, logoSvg: "<svg>logo</svg>" };
      const html = BaseLayout({
        title: "Test",
        children: "Content",
        site: siteWithLogo,
        nav,
        footer,
        theme,
      }).toString();
      expect(html).toContain("data:image/svg+xml");
      expect(html).toContain("%3Csvg%3Elogo%3C%2Fsvg%3E");
    });

    it("should render copyright with year and author", () => {
      const siteWithCopyright = {
        ...site,
        copyright: "© {year} {author}",
        author: "Test Author",
      };
      const html = BaseLayout({
        title: "Test",
        children: "Content",
        site: siteWithCopyright,
        nav,
        footer,
        theme,
      }).toString();
      expect(html).toContain(`© ${new Date().getFullYear()} Test Author`);
    });

    it("should show status branding if enabled", () => {
      const siteWithStatus = { ...site, showStatus: true };
      const html = BaseLayout({
        title: "Test",
        children: "Content",
        site: siteWithStatus,
        nav,
        footer,
        theme,
      }).toString();
      expect(html).toContain("POWERED BY EZ EDGE CMS");
    });

    it("should render custom scripts from page", () => {
      const pageWithScripts = {
        ...page,
        seo: {
          ...page.seo,
          customHeadScripts: "<script>alert('test')</script>",
        },
      };
      const html = BaseLayout({
        title: "Test",
        children: "Content",
        site,
        nav,
        footer,
        theme,
        page: pageWithScripts,
      }).toString();
      expect(html).toContain("<script>alert('test')</script>");
    });
  });

  describe("AdminLayout", () => {
    it("should render correctly", () => {
      const html = AdminLayout({
        title: "Admin HUD",
        children: <div>Admin Content</div>,
        site,
        theme,
        seo: site.seo,
      }).toString();

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("admin-shell");
      expect(html).toContain("admin-sidebar");
      expect(html).toContain("Admin Content");
      expect(html).toContain("confirm-modal");
      expect(html).toContain("global-toast");
    });

    it("should hide sidebar if requested", () => {
      const html = AdminLayout({
        title: "Setup",
        children: "Setup Content",
        site,
        theme,
        seo: site.seo,
        hideSidebar: true,
      }).toString();

      expect(html).not.toContain("admin-sidebar");
      expect(html).toContain("Setup Content");
      expect(html).toContain("bg-[var(--theme-bg)]");
    });

    it("should render editor assets if isEditor is true", () => {
      const html = AdminLayout({
        title: "Editor",
        children: "Editor Content",
        site,
        theme,
        seo: site.seo,
        isEditor: true,
      }).toString();
      expect(html).toContain("editorjs");
    });
  });
});

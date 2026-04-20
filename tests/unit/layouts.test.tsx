import { describe, it, expect, beforeEach, spyOn } from "bun:test";
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

  beforeEach(() => {
    // Silence console for clean output
    spyOn(console, "error").mockImplementation(() => {});
    spyOn(console, "log").mockImplementation(() => {});
  });

  describe("BaseLayout", () => {
    it("should render correctly with foundational UI tiers", () => {
      const html = BaseLayout({
        title: "Home",
        children: <div id="test-content">Content</div>,
        site,
        nav,
        footer,
        theme,
        page,
      }).toString();

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html lang=\"en\">");
      
      // Design System Tiers (Z-Layer Stacking check)
      expect(html).toContain("class=\"ui-overlay scanlines\"");
      expect(html).toContain("class=\"ui-overlay dots\"");
      expect(html).toContain("class=\"ui-overlay dots-interactive\"");

      // Semantic Structure
      expect(html).toContain("<header class=\"main-header\"");
      expect(html).toContain("<main id=\"main-content\"");
      expect(html).toContain("<footer class=\"main-footer\"");
      expect(html).toContain("id=\"test-content\"");
    });

    it("should render logo with drop-shadow filter", () => {
      const siteWithLogo = { ...site, logoSvg: "<svg id='logo'>logo</svg>" };
      const html = BaseLayout({
        title: "Test",
        children: "Content",
        site: siteWithLogo,
        nav,
        footer,
        theme,
      }).toString();
      
      expect(html).toContain("data:image/svg+xml");
      expect(html).toContain("drop-shadow(0 0 5px var(--theme-accent))");
    });

    it("should render localized copyright with {year} and {author} replacement", () => {
      const siteWithCopyright = {
        ...site,
        copyright: "© {year} | {author} CMS",
        author: "EZ-Dev",
      };
      const html = BaseLayout({
        title: "Test",
        children: "Content",
        site: siteWithCopyright,
        nav,
        footer,
        theme,
      }).toString();
      
      const currentYear = new Date().getFullYear().toString();
      expect(html).toContain(`© ${currentYear} | EZ-Dev CMS`);
    });

    it("should include HTMX boost on the body", () => {
      const html = BaseLayout({
        title: "Boosted",
        children: "Content",
        site,
        nav,
        footer,
        theme,
      }).toString();
      expect(html).toContain("<body hx-boost=\"true\">");
    });

    it("should render mobile navigation drawer separately from header", () => {
      const html = BaseLayout({
        title: "Nav Test",
        children: "Content",
        site,
        nav,
        footer,
        theme,
      }).toString();
      expect(html).toContain("<nav class=\"main-nav lg:hidden\" id=\"main-nav\"");
    });

    it("should inject custom head scripts from page SEO overrides", () => {
      const customScript = "<script id='seo-script'>console.log('SEO')</script>";
      const pageWithScript = {
        ...page,
        seo: { ...page.seo, customHeadScripts: customScript },
      };
      const html = BaseLayout({
        title: "SEO Test",
        children: "Content",
        site,
        nav,
        footer,
        theme,
        page: pageWithScript,
      }).toString();
      expect(html).toContain(customScript);
    });
  });

  describe("AdminLayout", () => {
    it("should render administrative HUD shell and sidebar", () => {
      const html = AdminLayout({
        title: "Dashboard",
        children: <div id="admin-view">HUD</div>,
        site,
        theme,
        seo: site.seo,
      }).toString();

      expect(html).toContain("<body class=\"admin-body\">");
      expect(html).toContain("class=\"admin-shell\"");
      expect(html).toContain("<aside class=\"admin-sidebar\"");
      expect(html).toContain("DASHBOARD");
      expect(html).toContain("THEME STYLER");
      expect(html).toContain("id=\"admin-view\"");
    });

    it("should render full-width layout without sidebar for onboarding/auth", () => {
      const html = AdminLayout({
        title: "Setup",
        children: "Setup",
        site,
        theme,
        seo: site.seo,
        hideSidebar: true,
      }).toString();

      expect(html).not.toContain("class=\"admin-shell\"");
      expect(html).not.toContain("class=\"admin-sidebar\"");
      expect(html).toContain("bg-[var(--theme-bg)]");
      expect(html).toContain("class=\"ml-0 w-full");
    });

    it("should include global interactive UI components (Modals & Toasts)", () => {
      const html = AdminLayout({
        title: "UI Elements",
        children: "Content",
        site,
        theme,
        seo: site.seo,
      }).toString();

      // Confirmation Modal
      expect(html).toContain("id=\"confirm-modal\"");
      expect(html).toContain("id=\"confirm-title\"");
      expect(html).toContain("id=\"confirm-yes\"");
      
      // Toast Notification Target
      expect(html).toContain("id=\"global-toast\"");
    });

    it("should include complex unsaved changes detection logic in script", () => {
      const html = AdminLayout({
        title: "Scripts",
        children: "Content",
        site,
        theme,
        seo: site.seo,
      }).toString();

      expect(html).toContain("window.adminHasChanges = false;");
      expect(html).toContain("htmx:confirm");
      expect(html).toContain("DISCARD & LEAVE");
    });

    it("should inject Editor.js assets only when isEditor is true", () => {
      const editorHtml = AdminLayout({
        title: "Edit",
        children: "Editor",
        site,
        theme,
        seo: site.seo,
        isEditor: true,
      }).toString();
      
      const normalHtml = AdminLayout({
        title: "View",
        children: "Content",
        site,
        theme,
        seo: site.seo,
        isEditor: false,
      }).toString();

      expect(editorHtml).toContain("editorjs");
      expect(normalHtml).not.toContain("editorjs");
    });
  });
});

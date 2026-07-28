/** @jsxImportSource hono/jsx */
import { describe, it, expect } from "bun:test";
import { BaseLayout } from "@layouts/BaseLayout";
import { AdminLayout } from "@layouts/AdminLayout";
import {
  ThemeConfig,
  SiteConfig,
  NavConfig,
  FooterConfig,
  PageConfig,
} from "@core/schema";

describe("Layouts", () => {
  const site: SiteConfig = {
    schemaVersion: "1.0.0",
    title: "Test Site",
    tagline: "Testing Layouts",
    author: "Tester",
    adminEmail: "admin@ezinner.com",
    language: "en",
    showStatus: true,
    copyright: "© 2026",
    txtFiles: {},
    seo: {
      identity: {
        type: "Person",
        name: "Tester",
        description: "Tester",
        links: [],
      },
    },
  };

  const nav: NavConfig = {
    schemaVersion: "1.0.0",
    items: [{ label: "Home", path: "/" }],
  };

  const footer: FooterConfig = {
    schemaVersion: "1.0.0",
    links: [{ label: "Privacy", path: "/privacy" }],
  };

  const theme: ThemeConfig = {
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
      text_main_sat: "90%",
      text_main_light: "95%",
      text_dim_sat: "20%",
      text_dim_light: "60%",
      font_header: "HeaderFont",
      font_nav: "NavFont",
      font_body: "BodyFont",
      font_mono: "MonoFont",
      glow_spread: "5px",
      boot_speed: "0.5s",
      elevation: "10px",
      styling_system: "ruri",
    },
  };

  const page: PageConfig = {
    schemaVersion: "1.0.0",
    title: "Page Title",
    slug: "page-title",
    status: "published",
    content: [],
    category: "General",
    tags: [],
    seo: {
      pageType: "WebPage",
    },
    appearance: {
      layout: "page",
    },
    metadata: {
      author: "Admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usedBlocks: [],
    },
  };

  describe("BaseLayout", () => {
    it("should render correctly with foundational UI tiers", () => {
      const html = BaseLayout({
        title: "Base Test",
        children: <div id="test-content">Content</div>,
        site,
        nav,
        footer,
        theme,
        page,
      })!.toString();

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain('<html lang="en">');

      // Design System Tiers (Z-Layer Stacking check)
      expect(html).toContain('class="ui-overlay scanlines"');
      expect(html).toContain('class="ui-overlay dots"');
      expect(html).toContain('class="ui-overlay dots-interactive"');

      // Semantic Structure
      expect(html).toContain("<header");
      expect(html).toContain('<main id="main-content"');
      expect(html).toContain("<footer");
      expect(html).toContain('id="test-content"');
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
      })!.toString();

      expect(html).toContain("data:image/svg+xml");
      expect(html).toContain("drop-shadow(0 0 5px var(--ruri-primary))");
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
      })!.toString();

      const currentYear = new Date().getFullYear()!.toString();
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
      })!.toString();
      expect(html).toContain('<body hx-boost="true">');
    });

    it("should render mobile navigation drawer separately from header", () => {
      const defaultTheme = {
        ...theme,
        values: { ...theme.values, styling_system: "default" },
      };
      const html = BaseLayout({
        title: "Nav Test",
        children: "Content",
        site,
        nav,
        footer,
        theme: defaultTheme,
      })!.toString();
      expect(html).toContain('id="main-nav"');
    });

    it("should inject custom head scripts from page SEO overrides", () => {
      const customScript =
        "<script id='seo-script'>console.log('SEO')</script>";
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
      })!.toString();
      expect(html).toContain(customScript);
    });
  });

  describe("AdminLayout", () => {
    it("should render administrative HUD shell and sidebar", () => {
      const html = AdminLayout({
        title: "Admin",
        children: "Admin Content",
        site,
        theme,
        seo: site.seo,
      })!.toString();

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain('<body class="admin-body">');
      expect(html).toContain('<aside class="admin-sidebar"');
      expect(html).toContain('<main class="admin-content" id="admin-main">');
      expect(html).toContain("EZ-ADMIN");
      expect(html).toContain("DASHBOARD");
    });

    it("should render full-width layout without sidebar for onboarding/auth", () => {
      const html = AdminLayout({
        title: "Auth",
        children: "Login Form",
        site,
        theme,
        seo: site.seo,
        hideSidebar: true,
      })!.toString();

      expect(html).not.toContain('<aside class="admin-sidebar"');
      expect(html).toContain("admin-auth-shell");
    });

    it("should include global interactive UI components (Modals & Toasts)", () => {
      const html = AdminLayout({
        title: "Components",
        children: "Content",
        site,
        theme,
        seo: site.seo,
      })!.toString();

      expect(html).toContain('id="confirm-modal"');
      expect(html).toContain('id="global-toast"');
    });

    it("should include complex unsaved changes detection logic in script", () => {
      const html = AdminLayout({
        title: "Script Test",
        children: "Content",
        site,
        theme,
        seo: site.seo,
      })!.toString();

      expect(html).toContain("window.adminHasChanges");
      expect(html).toContain("showConfirm");
      expect(html).toContain("htmx:confirm");
    });

    it("should inject ez-portable-text assets by default when isEditor is true", () => {
      const html = AdminLayout({
        title: "PortableText Editor",
        children: "Editor Content",
        site,
        theme,
        seo: site.seo,
        isEditor: true,
      })!.toString();

      expect(html).toContain("ez-portable-text.css");
    });
  });
});

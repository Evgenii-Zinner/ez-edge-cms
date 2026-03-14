import { describe, expect, it } from "bun:test";
import { generateMetaTags, generateJsonLd } from "../../src/utils/seo";
import { SiteConfig, PageConfig } from "../../src/core/schema";

describe("SEO Utilities", () => {
  const mockSite: SiteConfig = {
    schemaVersion: "1.0.0",
    title: "Test Site",
    tagline: "Test Tagline",
    author: "Test Author",
    adminEmail: "admin@test.com",
    language: "en",
    showStatus: true,
    txtFiles: {},
    seo: {
      identity: {
        type: "Organization",
        name: "Test Org",
        description: "Test Org Description",
        links: [{ platform: "Twitter", url: "https://twitter.com/test" }],
      },
    },
  };

  const mockPage: PageConfig = {
    schemaVersion: "1.0.0",
    slug: "test-page",
    status: "published",
    title: "Test Page",
    description: "Test Page Description",
    content: { blocks: [] },
    category: "General",
    tags: [],
    seo: {
      pageType: "WebPage",
      metaTitle: "SEO Title",
      metaDescription: "SEO Description",
    },
    appearance: { layout: "post" },
    metadata: {
      author: "Test Author",
      createdAt: "2024-01-01T12:00:00Z",
      updatedAt: "2024-01-02T12:00:00Z",
      publishedAt: "2024-01-01T12:00:00Z",
      usedBlocks: [],
    },
  };

  describe("generateMetaTags", () => {
    it("should generate basic meta tags for a page", () => {
      const tags = generateMetaTags(mockSite, mockPage, "https://example.com");
      const findTag = (nameOrProp: string) =>
        tags.find((t) => t.name === nameOrProp || t.property === nameOrProp);

      expect(findTag("og:title")?.content).toBe("SEO Title");
      expect(findTag("description")?.content).toBe("SEO Description");
      expect(findTag("og:url")?.content).toBe("https://example.com/test-page");
      expect(findTag("og:type")?.content).toBe("website");
    });

    it("should fallback to site defaults if page SEO is missing", () => {
      const pageWithoutSeo = { ...mockPage, seo: {} } as any;
      const tags = generateMetaTags(
        mockSite,
        pageWithoutSeo,
        "https://example.com",
      );
      const findTag = (nameOrProp: string) =>
        tags.find((t) => t.name === nameOrProp || t.property === nameOrProp);

      expect(findTag("og:title")?.content).toBe("Test Page");
      expect(findTag("description")?.content).toBe("Test Page Description");
    });

    it("should handle index slug correctly", () => {
      const indexPage = { ...mockPage, slug: "index" };
      const tags = generateMetaTags(mockSite, indexPage, "https://example.com");
      const urlTag = tags.find((t) => t.property === "og:url");
      expect(urlTag?.content).toBe("https://example.com/");
    });

    it("should include og:image if provided", () => {
      const pageWithImage = {
        ...mockPage,
        seo: { ...mockPage.seo, ogImage: "https://example.com/image.jpg" },
      };
      const tags = generateMetaTags(
        mockSite,
        pageWithImage,
        "https://example.com",
      );
      const imgTag = tags.find((t) => t.property === "og:image");
      expect(imgTag?.content).toBe("https://example.com/image.jpg");
    });

    it("should prepend baseUrl to relative og:image paths", () => {
      const pageWithRelativeImage = {
        ...mockPage,
        seo: { ...mockPage.seo, ogImage: "/images/site/og-image.webp" },
      };
      const tags = generateMetaTags(
        mockSite,
        pageWithRelativeImage,
        "https://example.com",
      );
      const imgTag = tags.find((t) => t.property === "og:image");
      expect(imgTag?.content).toBe(
        "https://example.com/images/site/og-image.webp",
      );
    });

    it("should include twitter:site if twitterHandle is present", () => {
      const siteWithTwitter = {
        ...mockSite,
        seo: { ...mockSite.seo, twitterHandle: "@testuser" },
      } as any;
      const tags = generateMetaTags(
        siteWithTwitter,
        mockPage,
        "https://example.com",
      );
      const twitterTag = tags.find((t) => t.name === "twitter:site");
      expect(twitterTag?.content).toBe("@testuser");
    });

    it("should use site.baseUrl if provided", () => {
      const siteWithBase = { ...mockSite, baseUrl: "https://site.com/" };
      const tags = generateMetaTags(siteWithBase, mockPage);
      const urlTag = tags.find((t) => t.property === "og:url");
      expect(urlTag?.content).toBe("https://site.com/test-page");
    });

    it("should set og:type to article for Article page type", () => {
      const articlePage = {
        ...mockPage,
        seo: { ...mockPage.seo, pageType: "Article" },
      } as any;
      const tags = generateMetaTags(
        mockSite,
        articlePage,
        "https://example.com",
      );
      const typeTag = tags.find((t) => t.property === "og:type");
      expect(typeTag?.content).toBe("article");
    });
  });

  describe("generateJsonLd", () => {
    it("should generate a valid JSON-LD graph", () => {
      const jsonLd = generateJsonLd(mockSite, mockPage, "https://example.com");
      expect(jsonLd["@context"]).toBe("https://schema.org");
      const graph = jsonLd["@graph"];
      const identity = graph.find(
        (item: any) => item["@type"] === "Organization",
      );
      const website = graph.find((item: any) => item["@type"] === "WebSite");
      const webpage = graph.find((item: any) => item["@type"] === "WebPage");

      expect(identity.name).toBe("Test Org");
      expect(website.name).toBe("Test Site");
      expect(webpage.name).toBe("Test Page");
    });

    it("should handle LocalBusiness identity with address and phone", () => {
      const localSite = {
        ...mockSite,
        seo: {
          identity: {
            type: "LocalBusiness",
            name: "Local Biz",
            address: "123 Street",
            phone: "555-1234",
            logo: "https://biz.com/logo.png",
          },
        },
      } as any;
      const jsonLd = generateJsonLd(
        localSite,
        undefined,
        "https://example.com",
      );
      const identity = jsonLd["@graph"].find(
        (item: any) => item["@type"] === "LocalBusiness",
      );
      expect(identity.address).toBe("123 Street");
      expect(identity.telephone).toBe("555-1234");
      expect(identity.logo).toBe("https://biz.com/logo.png");
    });

    it("should generate breadcrumbs for nested slugs", () => {
      const nestedPage = { ...mockPage, slug: "services/web-design" };
      const jsonLd = generateJsonLd(
        mockSite,
        nestedPage,
        "https://example.com",
      );
      const breadcrumbs = jsonLd["@graph"].find(
        (item: any) => item["@type"] === "BreadcrumbList",
      );
      expect(breadcrumbs.itemListElement.length).toBe(3);
      expect(breadcrumbs.itemListElement[1].name).toBe("Services");
    });

    it("should handle Article page specific JSON-LD", () => {
      const articlePage = {
        ...mockPage,
        seo: { ...mockPage.seo, pageType: "Article" },
      } as any;
      const jsonLd = generateJsonLd(
        mockSite,
        articlePage,
        "https://example.com",
      );
      const article = jsonLd["@graph"].find(
        (item: any) => item["@type"] === "Article",
      );
      expect(article.headline).toBe("Test Page");
      expect(article.datePublished).toBe("2024-01-01T12:00:00Z");
      expect(article.dateModified).toBe("2024-01-02T12:00:00Z");
    });

    it("should use logoSvg as fallback for logo if present", () => {
      const siteWithSvg = { ...mockSite, logoSvg: "<svg></svg>" };
      const jsonLd = generateJsonLd(
        siteWithSvg,
        undefined,
        "https://example.com",
      );
      const identity = jsonLd["@graph"].find(
        (item: any) => item["@type"] === "Organization",
      );
      expect(identity.logo).toContain("data:image/svg+xml");
    });

    it("should handle breadcrumbs for index page (root only)", () => {
      const indexPage = { ...mockPage, slug: "index" };
      const jsonLd = generateJsonLd(mockSite, indexPage, "https://example.com");
      const breadcrumbs = jsonLd["@graph"].find(
        (item: any) => item["@type"] === "BreadcrumbList",
      );
      expect(breadcrumbs.itemListElement.length).toBe(1);
      expect(breadcrumbs.itemListElement[0].name).toBe("Home");
    });
  });
});

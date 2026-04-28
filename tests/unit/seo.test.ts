import { describe, expect, it, beforeEach, spyOn } from "bun:test";
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

  beforeEach(() => {
    // Silence console for clean output
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
  });

  describe("generateMetaTags", () => {
    const findTag = (tags: any[], nameOrProp: string) =>
      tags.find((t) => t.name === nameOrProp || t.property === nameOrProp);

    it("should generate standard meta and OpenGraph tags with correct inheritance", () => {
      const tags = generateMetaTags(mockSite, mockPage, "https://example.com");

      expect(findTag(tags, "og:title")?.content).toBe("SEO Title");
      expect(findTag(tags, "description")?.content).toBe("SEO Description");
      expect(findTag(tags, "og:description")?.content).toBe("SEO Description");
      expect(findTag(tags, "og:url")?.content).toBe(
        "https://example.com/test-page",
      );
      expect(findTag(tags, "og:type")?.content).toBe("website");
    });

    it("should fall back to site-level branding when page SEO fields are omitted", () => {
      const minimalPage = {
        ...mockPage,
        title: "Title Only",
        description: "Desc Only",
        seo: {},
      } as any;
      const tags = generateMetaTags(mockSite, minimalPage, "https://site.com");

      expect(findTag(tags, "og:title")?.content).toBe("Title Only");
      expect(findTag(tags, "description")?.content).toBe("Desc Only");

      const siteOnlyPage = {
        ...mockPage,
        title: "T",
        description: "",
        seo: {},
      } as any;
      const tags2 = generateMetaTags(
        mockSite,
        siteOnlyPage,
        "https://site.com",
      );
      expect(findTag(tags2, "description")?.content).toBe(mockSite.tagline);
    });

    it("should handle the 'index' slug by mapping to the root canonical URL", () => {
      const indexPage = { ...mockPage, slug: "index" };
      const tags = generateMetaTags(mockSite, indexPage, "https://root.com");
      expect(findTag(tags, "og:url")?.content).toBe("https://root.com/");
    });

    it("should choose 'summary_large_image' for Twitter card only when an image is present", () => {
      const noImgTags = generateMetaTags(
        mockSite,
        mockPage,
        "https://test.com",
      );
      expect(findTag(noImgTags, "twitter:card")?.content).toBe("summary");

      const imgPage = {
        ...mockPage,
        seo: { ...mockPage.seo, ogImage: "/img.png" },
      };
      const imgTags = generateMetaTags(mockSite, imgPage, "https://test.com");
      expect(findTag(imgTags, "twitter:card")?.content).toBe(
        "summary_large_image",
      );
      expect(findTag(imgTags, "og:image")?.content).toBe(
        "https://test.com/img.png",
      );
    });

    it("should include twitter:site attribution if handle is configured in identity", () => {
      const siteWithTwitter = {
        ...mockSite,
        seo: { ...mockSite.seo, twitterHandle: "@ezinner" },
      } as any;
      const tags = generateMetaTags(
        siteWithTwitter,
        mockPage,
        "https://test.com",
      );
      expect(findTag(tags, "twitter:site")?.content).toBe("@ezinner");
    });

    it("should prioritize site.baseUrl over detectedUrl fallback", () => {
      const site = { ...mockSite, baseUrl: "https://hardcoded.com" };
      const tags = generateMetaTags(site, mockPage, "https://detected.com");
      expect(findTag(tags, "og:url")?.content).toBe(
        "https://hardcoded.com/test-page",
      );
    });
  });

  describe("generateJsonLd", () => {
    it("should generate a multi-entity graph with valid @context and linkages", () => {
      const jsonLd = generateJsonLd(mockSite, mockPage, "https://base.com");
      expect(jsonLd["@context"]).toBe("https://schema.org");
      const graph = jsonLd["@graph"];

      const identity = graph.find((i: any) => i["@id"].endsWith("#identity"));
      const website = graph.find((i: any) => i["@id"].endsWith("#website"));
      const webpage = graph.find((i: any) => i["@id"].endsWith("#webpage"));

      expect(identity).toBeDefined();
      expect(website.publisher["@id"]).toBe(identity["@id"]);
      expect(webpage.isPartOf["@id"]).toBe(website["@id"]);
    });

    it("should correctly handle 'Person' identity type with specific fields", () => {
      const personSite = {
        ...mockSite,
        seo: {
          identity: { type: "Person", name: "Evgenii", description: "Dev" },
        },
      } as any;
      const jsonLd = generateJsonLd(personSite, undefined, "https://dev.com");
      const identity = jsonLd["@graph"].find(
        (i: any) => i["@type"] === "Person",
      );

      expect(identity.name).toBe("Evgenii");
      expect(identity).not.toHaveProperty("logo"); // People don't have logos in schema.org
    });

    it("should correctly handle 'LocalBusiness' identity type with specific fields", () => {
      const businessSite = {
        ...mockSite,
        seo: {
          identity: {
            type: "LocalBusiness",
            name: "Pizza Shop",
            address: "123 Main St",
            phone: "555-1234",
            logo: "/logo.png",
          },
        },
      } as any;
      const jsonLd = generateJsonLd(
        businessSite,
        undefined,
        "https://pizza.com",
      );
      const identity = jsonLd["@graph"].find(
        (i: any) => i["@type"] === "LocalBusiness",
      );

      expect(identity.name).toBe("Pizza Shop");
      expect(identity.address).toBe("123 Main St");
      expect(identity.telephone).toBe("555-1234");
      expect(identity.logo).toBe("/logo.png");
    });

    it("should generate a valid BreadcrumbList with correct positioning and hierarchical names", () => {
      const page = { ...mockPage, slug: "docs/api/v1" };
      const jsonLd = generateJsonLd(mockSite, page, "https://base.com");
      const breadcrumbs = jsonLd["@graph"].find(
        (i: any) => i["@type"] === "BreadcrumbList",
      );

      expect(breadcrumbs.itemListElement).toHaveLength(4); // Home + Docs + Api + V1
      expect(breadcrumbs.itemListElement[0]).toEqual({
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://base.com",
      });
      expect(breadcrumbs.itemListElement[1].name).toBe("Docs");
      expect(breadcrumbs.itemListElement[1].position).toBe(2);
      expect(breadcrumbs.itemListElement[3].name).toBe("V1");
    });

    it("should enrich the Article entity with modified dates and author linkage", () => {
      const articlePage = {
        ...mockPage,
        seo: { ...mockPage.seo, pageType: "Article" },
      } as any;
      const jsonLd = generateJsonLd(mockSite, articlePage, "https://base.com");
      const article = jsonLd["@graph"].find(
        (i: any) => i["@type"] === "Article",
      );

      expect(article.headline).toBe(mockPage.title);
      expect(article.datePublished).toBe(mockPage.metadata.publishedAt);
      expect(article.dateModified).toBe(mockPage.metadata.updatedAt);
      expect(article.author["@id"]).toBe("https://base.com/#identity");
    });

    it("should correctly handle index page breadcrumbs by returning only the root", () => {
      const indexPage = { ...mockPage, slug: "index" };
      const jsonLd = generateJsonLd(mockSite, indexPage, "https://base.com");
      const breadcrumbs = jsonLd["@graph"].find(
        (i: any) => i["@type"] === "BreadcrumbList",
      );
      expect(breadcrumbs.itemListElement).toHaveLength(1);
    });

    it("should fall back to data URI logos when explicitly missing in identity", () => {
      const siteWithLogo = { ...mockSite, logoSvg: "<svg id='logo'></svg>" };
      const jsonLd = generateJsonLd(
        siteWithLogo,
        undefined,
        "https://base.com",
      );
      const identity = jsonLd["@graph"].find(
        (i: any) => i["@type"] === "Organization",
      );

      expect(identity.logo).toContain("data:image/svg+xml");
      // Encoded version of id='logo'
      expect(identity.logo).toContain("id%3D'logo'");
    });
  });
});

/**
 * @module SEO
 * @description Utilities for generating search engine optimization (SEO) metadata.
 * Handles the generation of HTML meta tags (OpenGraph, Twitter) and complex
 * Schema.org JSON-LD graphs for enhanced search results and rich snippets.
 */

import { SiteConfig, PageConfig } from "@core/schema";

/**
 * Normalizes the base URL by removing any trailing slashes to ensure consistent path joining.
 *
 * @param site - The global site configuration.
 * @param detectedUrl - The URL detected from the request context (fallback).
 * @returns A normalized base URL string.
 */
const getNormalizedBaseUrl = (
  site: SiteConfig,
  detectedUrl?: string,
): string => {
  return (site.baseUrl || detectedUrl || "").replace(/\/$/, "");
};

/**
 * Generates the absolute canonical URL for a specific page.
 * Correctly handles the 'index' slug by returning the root URL.
 *
 * @param baseUrl - The normalized base URL of the site.
 * @param page - Optional page configuration.
 * @returns The full URL for the page.
 */
const getPageUrl = (baseUrl: string, page?: PageConfig): string => {
  if (!page) return baseUrl;
  return `${baseUrl}/${page.slug === "index" ? "" : page.slug}`;
};

/**
 * Interface for a generic HTML meta tag object.
 */
export interface MetaTag {
  name?: string;
  property?: string;
  content: string;
}

/**
 * Generates an array of meta tag objects for use in the HTML `<head>`.
 * Supports standard meta descriptions, OpenGraph (Facebook/LinkedIn),
 * and Twitter Card metadata.
 *
 * @param site - The global site configuration.
 * @param page - Optional page-specific configuration overrides.
 * @param detectedUrl - The URL detected from the request context.
 * @returns An array of objects with 'name'/'property' and 'content' attributes.
 */
export const generateMetaTags = (
  site: SiteConfig,
  page?: PageConfig,
  detectedUrl?: string,
): MetaTag[] => {
  const baseUrl = getNormalizedBaseUrl(site, detectedUrl);
  const url = getPageUrl(baseUrl, page);

  const metaTitle = page?.seo?.metaTitle || page?.title || site.title;
  const metaDescription =
    page?.seo?.metaDescription || page?.description || site.tagline || "";

  const image = page?.seo?.ogImage || page?.featuredImage || site.ogImage;
  const type = page?.seo?.pageType === "Article" ? "article" : "website";

  const tags: MetaTag[] = [
    { property: "og:title", content: metaTitle },
    { property: "og:description", content: metaDescription },
    { property: "og:url", content: url },
    { property: "og:type", content: type },
    { name: "description", content: metaDescription },
  ];

  if (image) {
    const finalImage = image.startsWith("/") ? `${baseUrl}${image}` : image;
    tags.push({ property: "og:image", content: finalImage });
    tags.push({ name: "twitter:card", content: "summary_large_image" });
  } else {
    tags.push({ name: "twitter:card", content: "summary" });
  }

  // Optional: Twitter handle for attribution
  if ((site.seo as any).twitterHandle) {
    tags.push({
      name: "twitter:site",
      content: (site.seo as any).twitterHandle,
    });
  }

  return tags;
};

/**
 * Generates a comprehensive Schema.org JSON-LD graph.
 * Constructs a multi-entity graph including the primary Identity (Person/Org),
 * the WebSite itself, and page-specific metadata like Breadcrumbs and WebPage/Article info.
 *
 * @param site - The global site configuration.
 * @param page - Optional page-specific configuration.
 * @param detectedUrl - The URL detected from the request context.
 * @returns A JSON-LD object with '@context' and '@graph'.
 */
export const generateJsonLd = (
  site: SiteConfig,
  page?: PageConfig,
  detectedUrl?: string,
): Record<string, any> => {
  const baseUrl = getNormalizedBaseUrl(site, detectedUrl);
  const graph: any[] = [];

  // Fallback for logo if not explicitly provided in identity
  const defaultLogo = site.logoSvg
    ? `data:image/svg+xml,${encodeURIComponent(site.logoSvg)}`
    : site.ogImage;
  const identity = site.seo.identity;

  // 1. Primary Identity Entity (The publisher/owner of the site)
  const identityLd: any = {
    "@type": identity.type,
    "@id": `${baseUrl}/#identity`,
    name: identity.name || site.title,
    description: identity.description || site.tagline,
    url: baseUrl,
    image: identity.image || defaultLogo,
  };

  if (identity.type === "Organization" || identity.type === "LocalBusiness") {
    identityLd.logo = identity.logo || defaultLogo;
  }

  if (identity.type === "LocalBusiness") {
    if (identity.address) identityLd.address = identity.address;
    if (identity.phone) identityLd.telephone = identity.phone;
  }

  graph.push(identityLd);

  // 2. WebSite (The identity of the site itself)
  const website: any = {
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: site.title,
    description: site.tagline,
    publisher: { "@id": `${baseUrl}/#identity` },
  };
  graph.push(website);

  // 3. Page Specific Entities (Breadcrumbs + WebPage/Article)
  if (page) {
    const isArticle = page.seo?.pageType === "Article";
    const pageUrl = getPageUrl(baseUrl, page);

    // Breadcrumbs generation for hierarchical path structures
    const breadcrumbs: any = {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: baseUrl,
        },
      ],
    };

    if (page.slug !== "index") {
      const parts = page.slug.split("/");
      parts.forEach((part, i) => {
        breadcrumbs.itemListElement.push({
          "@type": "ListItem",
          position: i + 2,
          name: part.charAt(0).toUpperCase() + part.slice(1),
          item: `${baseUrl}/${parts.slice(0, i + 1).join("/")}`,
        });
      });
    }
    graph.push(breadcrumbs);

    // Specific WebPage identity
    const pageLd: any = {
      "@type": page.seo?.pageType || "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: page.title,
      description: page.description,
      isPartOf: { "@id": `${baseUrl}/#website` },
    };

    // The 'breadcrumb' property is only valid on WebPage and its subtypes
    const webPageTypes = ["WebPage", "AboutPage", "ContactPage"];
    if (webPageTypes.includes(page.seo?.pageType || "WebPage")) {
      pageLd.breadcrumb = { "@id": `${pageUrl}#breadcrumb` };
    }

    // Article-specific enhancements (Published/Modified dates, Author attribution)
    if (isArticle) {
      pageLd.headline = page.title;
      pageLd.datePublished =
        page.metadata.publishedAt || page.metadata.createdAt;
      pageLd.dateModified = page.metadata.updatedAt;
      pageLd.author = { "@id": `${baseUrl}/#identity` };
    }
    graph.push(pageLd);
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph.filter((item) => item !== undefined),
  };
};

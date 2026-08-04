/**
 * @module SEO
 * @description Utilities for generating search engine optimization (SEO) metadata.
 * Handles the generation of HTML meta tags (OpenGraph, Twitter) and complex
 * Schema.org JSON-LD graphs for enhanced search results and rich snippets.
 */

import { SiteConfig, PageConfig } from "@core/schema";
import { getFirstImageForPortableText } from "./portabletext-parser";

/**
 * Normalizes a navigation path to ensure it is absolute if it is an internal link.
 * Prevents URL duplication (e.g. /articles/articles) when navigating from subpages.
 *
 * @param path - The raw path or URL.
 * @returns A normalized absolute path or the original external URL.
 */
export const normalizePath = (path: string): string => {
  if (!path) return "/";
  const p = path.trim();
  if (
    p.startsWith("/") ||
    p.startsWith("http") ||
    p.startsWith("mailto:") ||
    p.startsWith("tel:") ||
    p.startsWith("#")
  ) {
    return p;
  }
  return `/${p}`;
};

/**
 * Extracts plain text from an array of PortableText blocks.
 * Used for generating automatic meta descriptions and article bodies.
 */
const extractPlainText = (content?: any[], maxLength: number = 160): string => {
  if (!content || !Array.isArray(content)) return "";
  let text = content
    .map((b) => {
      if (b.children && Array.isArray(b.children)) {
        return b.children.map((c: any) => c.text || "").join("");
      }
      return "";
    })
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (maxLength > 0 && text.length > maxLength) {
    text = text.substring(0, maxLength).trim() + "...";
  }
  return text;
};

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

  const metaTitle =
    page?.seo?.metaTitle || page?.title || site?.title || "EZ EDGE";
    
  const autoDesc = page?.content ? extractPlainText(page.content, 160) : "";
  const metaDescription =
    page?.seo?.metaDescription || page?.description || autoDesc || site?.tagline || "";

  let image = page?.seo?.ogImage || page?.featuredImage || site?.ogImage;
  if (!image && page?.content) {
    const extractedImage = getFirstImageForPortableText(page.content);
    if (extractedImage) {
      image = extractedImage;
    }
  }
  
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

  if ((site?.seo as any)?.twitterHandle) {
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
  const defaultLogo = site?.logoSvg
    ? `data:image/svg+xml,${encodeURIComponent(site.logoSvg)}`
    : site?.ogImage;
  const identity = site?.seo?.identity;

  // 1. Primary Identity Entity (The publisher/owner of the site)
  const identityLd: any = {
    "@type": identity?.type || "Person",
    "@id": `${baseUrl}/#identity`,
    name: identity?.name || site?.title || "EZ EDGE",
    description: identity?.description || site?.tagline || "",
    url: baseUrl,
    image: identity?.image || defaultLogo,
  };

  if (identity?.type === "Organization" || identity?.type === "LocalBusiness") {
    identityLd.logo = identity.logo || defaultLogo;
  }

  if (identity?.type === "LocalBusiness") {
    if (identity.address) identityLd.address = identity.address;
    if (identity.phone) identityLd.telephone = identity.phone;
  }

  graph.push(identityLd);

  // 2. WebSite (The identity of the site itself)
  const website: any = {
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: site?.title || "EZ EDGE",
    description: site?.tagline || "",
    publisher: { "@id": `${baseUrl}/#identity` },
  };
  graph.push(website);

  // 3. Page Specific Entities (Breadcrumbs + WebPage/Article)
  if (page) {
    const isArticle = page.seo?.pageType === "Article";
    const pageUrl = getPageUrl(baseUrl, page);

    const autoDesc = page.content ? extractPlainText(page.content, 160) : "";

    // Specific WebPage identity
    const pageLd: any = {
      "@type": page.seo?.pageType || "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: page.title,
      description: page.seo?.metaDescription || page.description || autoDesc || site?.tagline || "",
      isPartOf: { "@id": `${baseUrl}/#website` },
    };

    if (page.slug !== "index") {
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

      const parts = page.slug.split("/");
      parts.forEach((part, i) => {
        breadcrumbs.itemListElement.push({
          "@type": "ListItem",
          position: i + 2,
          name: part.charAt(0).toUpperCase() + part.slice(1),
          item: `${baseUrl}/${parts.slice(0, i + 1).join("/")}`,
        });
      });
      graph.push(breadcrumbs);

      // The 'breadcrumb' property is only valid on WebPage and its subtypes
      const webPageTypes = ["WebPage", "AboutPage", "ContactPage"];
      if (webPageTypes.includes(page.seo?.pageType || "WebPage")) {
        pageLd.breadcrumb = { "@id": `${pageUrl}#breadcrumb` };
      }
    }

    // Article-specific enhancements (Published/Modified dates, Author attribution)
    if (isArticle) {
      pageLd.headline = page.title;
      pageLd.datePublished =
        page.metadata?.publishedAt || page.metadata?.createdAt || new Date().toISOString();
      pageLd.dateModified = page.metadata?.updatedAt || new Date().toISOString();
      pageLd.author = { "@id": `${baseUrl}/#identity` };
      pageLd.publisher = { "@id": `${baseUrl}/#identity` };
      
      let articleImage = page.seo?.ogImage || page.featuredImage || site.ogImage;
      if (!articleImage && page.content) {
        const extractedImage = getFirstImageForPortableText(page.content);
        if (extractedImage) {
          articleImage = extractedImage;
        }
      }

      if (articleImage) {
        pageLd.image = articleImage.startsWith("/") ? `${baseUrl}${articleImage}` : articleImage;
      }

      if (page.content && Array.isArray(page.content)) {
        const text = extractPlainText(page.content, 0); // 0 means no limit
        if (text) {
          pageLd.articleBody = text;
        }
      }
    }
    graph.push(pageLd);
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph.filter((item) => item !== undefined),
  };
};

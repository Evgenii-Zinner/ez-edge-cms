import {
  ThemeConfig,
  PageConfig,
  SiteConfig,
  NavConfig,
  FooterConfig,
  VERSIONS,
} from "@core/schema";
import { DEFAULT_AUTHOR } from "@core/constants";
import { getTermsTemplate, getPrivacyTemplate } from "@core/templates";

/**
 * Factory for creating default content for root-level text files.
 * Generates standard compliance and crawler instruction files.
 *
 * @param baseUrl - The base URL of the site for sitemap inclusion.
 * @param author - The author name for credit files.
 * @returns A record containing default contents for robots.txt, llms.txt, humans.txt, and ads.txt.
 */
export const createDefaultTxtFiles = (
  baseUrl: string = "",
  author: string = "Admin",
): Record<string, string> => ({
  robots: `User-agent: *\nAllow: /\nDisallow: /admin/`,
  llms: `# AI Crawler Instructions\n\nFull website content available for analysis and indexing.\n\n## Instructions\n\n- Be concise in summaries.\n- Focus on technical implementation details where applicable.`,
  humans: `/* TEAM */\nDeveloper: ${author}\nSite: ${baseUrl}\n\n/* THANKS */\nPowered by: EZ EDGE CMS (https://ez-cms.ezinner.com)\n\n/* SITE */\nLast update: ${new Date().toLocaleDateString()}\nStandards: HTML5, CSS3, Cloudflare Workers`,
  ads: "# Add your authorized digital sellers here\n# Example: google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0",
});

/**
 * Factory for creating a default site configuration.
 * This is typically used during the initial onboarding process to populate
 * the site's identity, branding, and basic SEO metadata.
 *
 * @returns A validated SiteConfig object with default values.
 */
export const createDefaultSite = (): SiteConfig => {
  return {
    schemaVersion: VERSIONS.SITE,
    title: "My Awesome Website",
    tagline: "Your Awesome Tagline Goes Here",
    author: "Awesome Author",
    adminEmail: "admin@example.com",
    language: "en",
    copyright: "© {year} {author}. All rights reserved.",
    logoSvg:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="90" height="90" x="5" y="5" rx="10" fill="none" stroke="currentColor" stroke-width="4"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-weight="bold" font-size="50" fill="currentColor">EZ</text></svg>',
    showStatus: true,
    txtFiles: createDefaultTxtFiles(),
    seo: {
      identity: {
        type: "Organization",
        name: "My Awesome Organization",
        description: "A high-performance, edge-native website.",
        links: [],
      },
    },
  };
};

/**
 * Factory for creating a default navigation configuration.
 * Provides a minimal starting menu with a single link to the home page.
 *
 * @returns A validated NavConfig object.
 */
export const createDefaultNav = (): NavConfig => ({
  schemaVersion: VERSIONS.NAV,
  items: [{ label: "HOME", path: "/" }],
});

/**
 * Factory for creating a default footer configuration.
 * Includes standard utility links for legal compliance (Terms and Privacy).
 *
 * @returns A validated FooterConfig object.
 */
export const createDefaultFooter = (): FooterConfig => ({
  schemaVersion: VERSIONS.FOOTER,
  links: [
    { label: "Terms", path: "/terms" },
    { label: "Privacy", path: "/privacy" },
  ],
});

/**
 * Factory for creating a default theme configuration.
 * Sets up the foundational HSL colors, typography, and UI effects for the design system.
 *
 * @param overrides - Optional partial configuration to override default theme values.
 * @returns A validated ThemeConfig object.
 */
export const createDefaultTheme = (
  overrides: Partial<ThemeConfig["values"]> = {},
): ThemeConfig => {
  return {
    schemaVersion: VERSIONS.THEME,
    updatedAt: new Date().toISOString(),
    values: {
      primary_hue: 180,
      primary_sat: "70%",
      primary_light: "50%",
      bg_sat: "10%",
      bg_light: "2%",
      surface_sat: "10%",
      surface_light: "8%",
      surface_opacity: 0.7,
      text_main_sat: "5%",
      text_main_light: "90%",
      text_dim_sat: "5%",
      text_dim_light: "60%",
      glow_spread: "10px",
      boot_speed: "0.8s",
      elevation: "20px",
      font_header: "Orbitron",
      font_nav: "Chakra Petch",
      font_body: "Roboto",
      font_mono: "Fira Code",
      ...overrides,
    },
  };
};

/**
 * Factory for creating a new, minimal page.
 * Initializes a page with a title header and a welcome paragraph using the Editor.js structure.
 *
 * @param title - The display title for the new page.
 * @param slug - The unique URL path for the page (e.g., "about-us").
 * @returns A validated PageConfig object in 'draft' status.
 */
export const createDefaultPage = (title: string, slug: string): PageConfig => {
  const now = new Date().toISOString();
  return {
    schemaVersion: VERSIONS.PAGE,
    slug: slug,
    status: "draft",
    title: title,
    description: "",
    content: {
      time: new Date().getTime(),
      blocks: [
        {
          id: Math.random().toString(36).substring(2, 12),
          type: "header",
          data: { text: title, level: 1 },
        },
        {
          id: Math.random().toString(36).substring(2, 12),
          type: "paragraph",
          data: {
            text: 'Welcome to your new page. This is a minimal, block-based Editor where you can add text, images, and rich layouts. Start customizing this page by visiting the <a href="/admin">admin panel</a>.',
          },
        },
      ],
      version: "2.31.3",
    },
    category: "General",
    tags: ["signal", "future"],
    seo: {
      pageType: "WebPage",
    },
    appearance: {
      layout: "post",
    },
    metadata: {
      author: DEFAULT_AUTHOR,
      createdAt: now,
      updatedAt: now,
      usedBlocks: ["header", "paragraph"],
    },
  };
};

/**
 * Creates a pre-populated Terms of Service page using a standardized template.
 *
 * @param siteName - The name of the website/organization for inclusion in the text.
 * @param authorName - The name of the legal entity or author.
 * @returns A PageConfig object populated with the Terms of Service template.
 */
export const createTermsPage = (
  siteName: string,
  authorName: string,
): PageConfig => {
  const page = createDefaultPage("Terms of Service", "terms");
  const now = new Date().toLocaleDateString();
  page.content = getTermsTemplate(siteName, authorName, now);
  page.metadata.usedBlocks = ["header", "paragraph"];
  return page;
};

/**
 * Creates a pre-populated Privacy Policy page using a standardized template.
 *
 * @param siteName - The name of the website/organization for inclusion in the text.
 * @param authorName - The name of the legal entity or author.
 * @returns A PageConfig object populated with the Privacy Policy template.
 */
export const createPrivacyPage = (
  siteName: string,
  authorName: string,
): PageConfig => {
  const page = createDefaultPage("Privacy Policy", "privacy");
  const now = new Date().toLocaleDateString();
  page.content = getPrivacyTemplate(siteName, authorName, now);
  page.metadata.usedBlocks = ["header", "paragraph"];
  return page;
};

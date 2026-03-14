/**
 * @module Schema
 * @description Centralized Zod schema definitions for the EZ EDGE CMS.
 * These schemas provide runtime validation and TypeScript type inference for
 * configurations stored in Cloudflare KV and managed via the Admin UI.
 */

import { z } from "zod";
import { PAGE_STATUSES } from "@core/constants";

/**
 * Current versioning for each configuration type to handle future migrations.
 */
export const VERSIONS = {
  /** Theme configuration schema version. */
  THEME: "1.0.0",
  /** Page configuration schema version. */
  PAGE: "1.0.0",
  /** Navigation menu schema version. */
  NAV: "1.0.0",
  /** Site identity schema version. */
  SITE: "1.0.0",
  /** Footer configuration schema version. */
  FOOTER: "1.0.0",
} as const;

/**
 * Zod schema for global theme visual settings, including HSL color foundations,
 * surface transparencies, and typography preferences.
 */
export const ThemeSchema = z.object({
  /** Schema version for migration tracking. */
  schemaVersion: z.string().default(VERSIONS.THEME),
  /** ISO timestamp of the last theme update. */
  updatedAt: z.string().datetime(),
  /** The specific visual variables for the design system. */
  values: z.object({
    /** HSL Hue for the primary brand color (0-360). */
    primary_hue: z.coerce.number().min(0).max(360).default(180),
    /** HSL Saturation for the primary brand color (e.g., '70%'). */
    primary_sat: z.string().default("70%"),
    /** HSL Lightness for the primary brand color (e.g., '50%'). */
    primary_light: z.string().default("50%"),
    /** HSL Saturation for the site background. */
    bg_sat: z.string().default("10%"),
    /** HSL Lightness for the site background. */
    bg_light: z.string().default("2%"),
    /** HSL Saturation for cards and surfaces. */
    surface_sat: z.string().default("10%"),
    /** HSL Lightness for cards and surfaces. */
    surface_light: z.string().default("8%"),
    /** Opacity for the surface color (0-1). */
    surface_opacity: z.coerce.number().min(0).max(1).default(0.7),
    /** HSL Saturation for primary text. */
    text_main_sat: z.string().default("10%"),
    /** HSL Lightness for primary text. */
    text_main_light: z.string().default("90%"),
    /** HSL Saturation for dimmed text. */
    text_dim_sat: z.string().default("10%"),
    /** HSL Lightness for dimmed text. */
    text_dim_light: z.string().default("60%"),
    /** Visual spread for glow effects (e.g., '10px'). */
    glow_spread: z.string().default("10px"),
    /** Speed for 'boot' animations (e.g., '0.8s'). */
    boot_speed: z.string().default("0.8s"),
    /** Visual elevation for depth effects (e.g., '20px'). */
    elevation: z.string().default("20px"),
    /** Font family for headings. */
    font_header: z.string().default("Orbitron"),
    /** Font family for navigation. */
    font_nav: z.string().default("Chakra Petch"),
    /** Font family for body text. */
    font_body: z.string().default("Roboto"),
    /** Font family for monospaced elements. */
    font_mono: z.string().default("Fira Code"),
  }),
});

/**
 * Zod schema for an individual Editor.js block.
 */
export const EditorJsBlockSchema = z.object({
  /** Unique block identifier. */
  id: z.string().optional(),
  /** The type of block (e.g., 'header', 'paragraph', 'image'). */
  type: z.string(),
  /** The specific payload for the block type. */
  data: z.any(),
});

/**
 * Zod schema for the full Editor.js output data structure.
 */
export const EditorJsDataSchema = z.object({
  /** Timestamp of the last editor save. */
  time: z.number().optional(),
  /** Array of content blocks. */
  blocks: z.array(EditorJsBlockSchema).default([]),
  /** Editor.js version. */
  version: z.string().optional(),
});

/**
 * Zod schema for page-level content, metadata, SEO overrides, and layout settings.
 */
export const PageSchema = z.object({
  /** Schema version for migration tracking. */
  schemaVersion: z.string().default(VERSIONS.PAGE),
  /** Unique URL identifier for the page. */
  slug: z.string().min(1),
  /** Publishing status (draft, published, archived). */
  status: z.enum(PAGE_STATUSES).default("draft"),
  /** Display title for the page. */
  title: z.string().min(1),
  /** Brief description for previews and lists. */
  description: z.string().optional(),
  /** Structured content in Editor.js format. */
  content: EditorJsDataSchema.default({ blocks: [] }),
  /** Primary hero image URL for the page. */
  featuredImage: z.string().url().or(z.literal("")).optional(),
  /** Primary content category for listing logic. */
  category: z.string().default("General"),
  /** Array of tags for categorization. */
  tags: z.array(z.string()).default([]),
  /** Page-specific SEO overrides. */
  seo: z
    .object({
      /** Override for the browser title. */
      metaTitle: z.string().optional(),
      /** Override for the meta description. */
      metaDescription: z.string().optional(),
      /** Specific OpenGraph image for social sharing. */
      ogImage: z.string().url().or(z.literal("")).optional(),
      /** Canonical URL for the page. */
      canonicalUrl: z.string().url().or(z.literal("")).optional(),
      /** Custom scripts to be injected into the <head> of this page. */
      customHeadScripts: z.string().optional(),
      /** Schema.org page type classification. */
      pageType: z
        .enum(["Article", "WebPage", "AboutPage", "ContactPage", "MenuItem"])
        .default("WebPage"),
    })
    .default({}),
  /** Layout and visual overrides for the page. */
  appearance: z
    .object({
      /** Hue override for the design system on this specific page. */
      hue_override: z.coerce.number().min(0).max(360).optional(),
      /** Layout template selection. */
      layout: z.enum(["post", "page", "dashboard"]).default("post"),
    })
    .default({}),
  /** Technical metadata for the page. */
  metadata: z.object({
    /** Author name. */
    author: z.string().default("Admin"),
    /** Creation timestamp. */
    createdAt: z.string().datetime(),
    /** Last update timestamp. */
    updatedAt: z.string().datetime(),
    /** Actual publishing timestamp (null if draft). */
    publishedAt: z.string().datetime().optional(),
    /** Registry of Block IDs used on this page for tracking. */
    usedBlocks: z.array(z.string()).default([]),
  }),
});

/**
 * Zod schema for an individual navigation menu item.
 */
export const NavItemSchema = z.object({
  /** Human-readable label for the link. */
  label: z.string(),
  /** Destination path or URL. */
  path: z.string(),
  /** Optional Iconify identifier for the menu item. */
  icon: z.string().optional(),
});

/**
 * Zod schema for the global site navigation menu configuration.
 */
export const NavSchema = z.object({
  /** Schema version for migration tracking. */
  schemaVersion: z.string().default(VERSIONS.NAV),
  /** Ordered array of navigation items. */
  items: z.array(NavItemSchema).default([]),
});

/**
 * Zod schema for global site-wide settings, identity metadata, and SEO.
 */
export const SiteSchema = z.object({
  /** Schema version for migration tracking. */
  schemaVersion: z.string().default(VERSIONS.SITE),
  /** Primary site name. */
  title: z.string().min(1),
  /** Short descriptive tagline. */
  tagline: z.string().optional(),
  /** Raw SVG source for the site logo. */
  logoSvg: z.string().optional(),
  /** Absolute base URL for SEO and links. */
  baseUrl: z.string().url().or(z.literal("")).optional(),
  /** Global fallback image for OpenGraph sharing. */
  ogImage: z.string().optional(),
  /** Global default author name. */
  author: z.string().optional(),
  /** Email address for administrative notifications. */
  adminEmail: z.string().email(),
  /** ISO language code for the site (e.g., 'en'). */
  language: z.string().default("en"),
  /** Public-facing contact email address. */
  contactEmail: z.string().email().or(z.literal("")).optional(),
  /** Custom global scripts for injection into the <head> of all pages. */
  customHeadScripts: z.string().optional(),
  /** Global copyright notice string (supports {year} and {author} tokens). */
  copyright: z.string().optional(),
  /** Custom content for standard root-level text files. */
  txtFiles: z
    .object({
      /** robots.txt content. */
      robots: z.string().optional(),
      /** llms.txt content (for AI crawler instructions). */
      llms: z.string().optional(),
      /** humans.txt content (for credits/team info). */
      humans: z.string().optional(),
      /** ads.txt content (for advertising authorization). */
      ads: z.string().optional(),
    })
    .default({}),
  /** Whether to display the system status in the footer. */
  showStatus: z.boolean().default(true),
  /** Global SEO and Schema.org identity settings. */
  seo: z
    .object({
      /** Identity entity configuration for Schema.org. */
      identity: z
        .object({
          /** The type of entity (Person, Organization, LocalBusiness). */
          type: z
            .enum(["Person", "Organization", "LocalBusiness"])
            .default("Organization"),
          /** Name of the person or entity. */
          name: z.string().default(""),
          /** Brief description of the person or entity. */
          description: z.string().default(""),
          /** Logo URL for the entity. */
          logo: z.string().url().or(z.literal("")).optional(),
          /** Profile or primary image URL for the entity. */
          image: z.string().url().or(z.literal("")).optional(),
          /** Array of social profile links. */
          links: z
            .array(
              z.object({
                platform: z.string(),
                url: z.string().url(),
              }),
            )
            .default([]),
          /** Physical address (for LocalBusiness). */
          address: z.string().optional(),
          /** Phone number (for LocalBusiness). */
          phone: z.string().optional(),
        })
        .default({}),
    })
    .default({}),
});

/**
 * Zod schema for an individual link in the site footer.
 */
export const FooterLinkSchema = z.object({
  /** Human-readable label for the link. */
  label: z.string(),
  /** Destination path or URL. */
  path: z.string(),
});

/**
 * Zod schema for the global site footer configuration.
 */
export const FooterSchema = z.object({
  /** Schema version for migration tracking. */
  schemaVersion: z.string().default(VERSIONS.FOOTER),
  /** Array of links for the footer menu. */
  links: z.array(FooterLinkSchema).default([]),
});

/**
 * Zod schema for administrative user credentials and security salt.
 */
export const AdminUserSchema = z.object({
  /** Unique administrative username. */
  username: z.string().min(3),
  /** SHA-256 password hash. */
  passwordHash: z.string(),
  /** Unique salt used for hashing. */
  salt: z.string(),
});

/** Inferred type for the global theme configuration. */
export type ThemeConfig = z.infer<typeof ThemeSchema>;
/** Inferred type for an individual page configuration. */
export type PageConfig = z.infer<typeof PageSchema>;
/** Inferred type for the primary navigation configuration. */
export type NavConfig = z.infer<typeof NavSchema>;
/** Inferred type for a single navigation menu item. */
export type NavItem = z.infer<typeof NavItemSchema>;
/** Inferred type for global site settings and identity. */
export type SiteConfig = z.infer<typeof SiteSchema>;
/** Inferred type for the global footer configuration. */
export type FooterConfig = z.infer<typeof FooterSchema>;
/** Inferred type for a single footer link item. */
export type FooterLink = z.infer<typeof FooterLinkSchema>;
/** Inferred type for administrative user credentials. */
export type AdminUser = z.infer<typeof AdminUserSchema>;

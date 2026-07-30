/**
 * @module Parser
 * @description Safe parsing utilities for KV JSON data.
 * Wraps Zod schema parsing with fallbacks and logging to prevent application crashes
 * due to malformed or legacy KV data. These utilities ensure the application
 * always has access to a valid, albeit default, configuration.
 */

import {
  ThemeSchema,
  PageSchema,
  SiteSchema,
  NavSchema,
  FooterSchema,
  ThemeConfig,
  PageConfig,
  SiteConfig,
  NavConfig,
  FooterConfig,
} from "@core/schema";
import {
  createDefaultTheme,
  createDefaultSite,
  createDefaultNav,
  createDefaultFooter,
} from "@core/factory";
import { z } from "zod";

/**
 * Helper constant for null fallbacks.
 *
 * @returns Always returns null.
 */
const nullFallback = (): null => null;

/**
 * Generic safe parsing helper for KV JSON data.
 * Validates raw data against a Zod schema. If validation fails, it logs the error
 * and returns a provided fallback value (or throws if strict is true).
 *
 * @param schema - The Zod schema to validate against.
 * @param rawJson - The raw JSON data retrieved from KV.
 * @param fallback - A function that returns a fallback object of the correct type.
 * @param name - Optional name for error logging (e.g., 'Theme').
 * @param strict - If true, throws on schema validation failure instead of returning fallback.
 * @returns A validated object conforming to the schema, or the fallback value.
 */
const safeParse = <T extends z.ZodTypeAny>(
  schema: T,
  rawJson: any,
  fallback: () => z.infer<T> | null,
  name?: string,
  strict: boolean = false,
): z.infer<T> | null => {
  // If no data is provided, return fallback immediately (or null for nullFallback)
  if (!rawJson) return fallback === nullFallback ? null : fallback();

  try {
    const result = schema.safeParse(rawJson);
    if (result.success) return result.data;

    if (name) {
      console.error(`${name} validation failed:`, result.error);
    }

    if (strict) {
      throw new Error(`${name || "Data"} validation failed: ${result.error.message}`);
    }

    return fallback();
  } catch (e) {
    if (strict) throw e;
    return fallback();
  }
};

/**
 * Parses and validates Site identity configuration.
 * Always returns a valid SiteConfig, falling back to system defaults if necessary.
 *
 * @param rawJson - The raw JSON data from KV.
 * @param name - Optional name for error logging (defaults to 'Site').
 * @param strict - If true, throws on validation error instead of returning fallback.
 * @returns A validated SiteConfig object.
 */
export const parseSite = (
  rawJson: any,
  name: string = "Site",
  strict: boolean = false,
): SiteConfig => {
  const result = safeParse(SiteSchema, rawJson, createDefaultSite, name, strict);
  return result!;
};

/**
 * Parses and validates Theme configuration.
 * Always returns a valid ThemeConfig, falling back to system defaults if necessary.
 *
 * @param rawJson - The raw JSON data from KV.
 * @param name - Optional name for error logging (defaults to 'Theme').
 * @param strict - If true, throws on validation error instead of returning fallback.
 * @returns A validated ThemeConfig object.
 */
export const parseTheme = (
  rawJson: any,
  name: string = "Theme",
  strict: boolean = false,
): ThemeConfig => {
  const result = safeParse(ThemeSchema, rawJson, createDefaultTheme, name, strict);
  return result!;
};

/**
 * Parses and validates Navigation configuration.
 *
 * @param rawJson - The raw JSON data from KV.
 * @param name - Optional name for error logging (defaults to 'Nav').
 * @param strict - If true, throws on validation error instead of returning fallback.
 * @returns A validated NavConfig object.
 */
export const parseNav = (
  rawJson: any,
  name: string = "Nav",
  strict: boolean = false,
): NavConfig => {
  const result = safeParse(NavSchema, rawJson, createDefaultNav, name, strict);
  return result!;
};

/**
 * Parses and validates Footer configuration.
 *
 * @param rawJson - The raw JSON data from KV.
 * @param name - Optional name for error logging (defaults to 'Footer').
 * @param strict - If true, throws on validation error instead of returning fallback.
 * @returns A validated FooterConfig object.
 */
export const parseFooter = (
  rawJson: any,
  name: string = "Footer",
  strict: boolean = false,
): FooterConfig => {
  const result = safeParse(FooterSchema, rawJson, createDefaultFooter, name, strict);
  return result!;
};

/**
 * Parses and validates a Page configuration.
 * Unlike site or theme configs, pages can be missing; returns null if the page is invalid or not found.
 *
 * @param rawJson - The raw JSON data from KV.
 * @param name - Optional name for error logging (defaults to 'Page').
 * @param strict - If true, throws on validation error instead of returning null.
 * @returns A validated PageConfig object, or null.
 */
export const parsePage = (
  rawJson: any,
  name: string = "Page",
  strict: boolean = false,
): PageConfig | null => {
  return safeParse(PageSchema, rawJson, nullFallback, name, strict);
};

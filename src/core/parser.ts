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
 * and returns a provided fallback value.
 *
 * @param schema - The Zod schema to validate against.
 * @param rawJson - The raw JSON data retrieved from KV.
 * @param fallback - A function that returns a fallback object of the correct type.
 * @param name - Optional name for error logging (e.g., 'Theme').
 * @returns A validated object conforming to the schema, or the fallback value.
 */
const safeParse = <T extends z.ZodTypeAny>(
  schema: T,
  rawJson: any,
  fallback: () => z.infer<T> | null,
  name?: string,
): z.infer<T> | null => {
  // If no data is provided and we don't have a default fallback generator,
  // return null immediately without triggering a validation error log.
  if (!rawJson && fallback === nullFallback) return null;

  try {
    // If no data is provided but we HAVE a fallback generator (like createDefaultTheme),
    // skip validation and return the fallback immediately.
    if (!rawJson) return fallback();

    const result = schema.safeParse(rawJson);
    if (result.success) return result.data;

    if (name) {
      console.error(`${name} validation failed, falling back:`, result.error);
    }
    return fallback();
  } catch (e) {
    return fallback();
  }
};

/**
 * Parses and validates Site identity configuration.
 * Always returns a valid SiteConfig, falling back to system defaults if necessary.
 *
 * @param rawJson - The raw JSON data from KV.
 * @param name - Optional name for error logging (defaults to 'Site').
 * @returns A validated SiteConfig object.
 */
export const parseSite = (rawJson: any, name: string = "Site"): SiteConfig => {
  const result = safeParse(SiteSchema, rawJson, createDefaultSite, name);
  return result!;
};

/**
 * Parses and validates Theme configuration.
 * Always returns a valid ThemeConfig, falling back to system defaults if necessary.
 *
 * @param rawJson - The raw JSON data from KV.
 * @param name - Optional name for error logging (defaults to 'Theme').
 * @returns A validated ThemeConfig object.
 */
export const parseTheme = (
  rawJson: any,
  name: string = "Theme",
): ThemeConfig => {
  const result = safeParse(ThemeSchema, rawJson, createDefaultTheme, name);
  return result!;
};

/**
 * Parses and validates Navigation configuration.
 *
 * @param rawJson - The raw JSON data from KV.
 * @param name - Optional name for error logging (defaults to 'Nav').
 * @returns A validated NavConfig object.
 */
export const parseNav = (rawJson: any, name: string = "Nav"): NavConfig => {
  const result = safeParse(NavSchema, rawJson, createDefaultNav, name);
  return result!;
};

/**
 * Parses and validates Footer configuration.
 *
 * @param rawJson - The raw JSON data from KV.
 * @param name - Optional name for error logging (defaults to 'Footer').
 * @returns A validated FooterConfig object.
 */
export const parseFooter = (
  rawJson: any,
  name: string = "Footer",
): FooterConfig => {
  const result = safeParse(FooterSchema, rawJson, createDefaultFooter, name);
  return result!;
};

/**
 * Parses and validates a Page configuration.
 * Unlike site or theme configs, pages can be missing; returns null if the page is invalid or not found.
 *
 * @param rawJson - The raw JSON data from KV.
 * @param name - Optional name for error logging (defaults to 'Page').
 * @returns A validated PageConfig object, or null.
 */
export const parsePage = (
  rawJson: any,
  name: string = "Page",
): PageConfig | null => {
  return safeParse(PageSchema, rawJson, nullFallback, name);
};

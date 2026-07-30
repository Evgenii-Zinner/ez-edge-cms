/**
 * @module KVBase
 * @description Internal helpers, in-memory caching, and concurrency control for the KV layer.
 */

import { KV_KEYS, KV_PREFIX } from "@core/constants";
import {
  ThemeConfig,
  SiteConfig,
  NavConfig,
  FooterConfig,
  PageListIndex,
} from "@core/schema";

/**
 * @description Standardized key mapping for Cloudflare KV access.
 * Provides a central registry for all KV keys used in the application.
 */
export const KEYS = KV_KEYS;

/**
 * @description Identifies transient or system-specific keys that should be excluded from backups.
 *
 * @param key - The KV key to check.
 * @returns True if the key is internal or transient.
 */
export const isInternalKey = (key: string): boolean => {
  return (
    key.startsWith(KV_PREFIX.SESSION) ||
    key.startsWith(KV_PREFIX.RATE_LIMIT) ||
    key.startsWith("system:")
  );
};

/**
 * @description Identifies critical system keys that should NOT be wiped or overwritten during a restore.
 *
 * @param key - The KV key to check.
 * @returns True if the key is protected from deletion during restore.
 */
export const isProtectedKey = (key: string): boolean => {
  return key.startsWith(KV_PREFIX.SESSION) || key.startsWith("system:");
};

/**
 * @description Isolate-level in-memory cache for global configurations.
 * Used to avoid redundant KV reads within the same Cloudflare Worker isolate.
 */
export const cache = {
  theme: null as ThemeConfig | null,
  nav: null as NavConfig | null,
  site: null as SiteConfig | null,
  footer: null as FooterConfig | null,
  pageListLive: null as PageListIndex | null,
  pageListDraft: null as PageListIndex | null,
};

/**
 * @description Abstract helper for fetching, parsing, and caching system configurations.
 *
 * @param env - Cloudflare Worker environment.
 * @param key - The KV key to fetch.
 * @param parser - Validation and parsing function for the raw JSON.
 * @param forceRefresh - If true, bypasses the in-memory cache.
 * @param cacheKey - Key in the isolate-level cache object.
 * @returns A promise resolving to the parsed data.
 */
export async function getCached<T>(
  env: Env,
  key: string,
  parser: (raw: any) => T,
  forceRefresh: boolean,
  cacheKey: keyof typeof cache,
): Promise<T> {
  const cached = cache[cacheKey] as T | null;
  if (cached && !forceRefresh) return cached;

  const raw = await env.EZ_CONTENT.get(key, { type: "json" });
  const data = parser(raw);
  (cache[cacheKey] as any) = data;
  return data;
}

/**
 * @description Abstract helper for persisting and updating memory cache.
 *
 * @param env - Cloudflare Worker environment.
 * @param key - The KV key to write.
 * @param config - The data object to persist.
 * @param cacheKey - Key in the isolate-level cache object.
 * @returns A promise resolving when the data is saved and cached.
 */
export async function saveCached<T>(
  env: Env,
  key: string,
  config: T,
  cacheKey: keyof typeof cache,
): Promise<void> {
  await env.EZ_CONTENT.put(key, JSON.stringify(config));
  (cache[cacheKey] as any) = config;
}

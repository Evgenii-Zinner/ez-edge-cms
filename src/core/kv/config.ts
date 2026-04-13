/**
 * @module KVConfig
 * @description Logical domain for global system configurations (Theme, Site, Nav, Footer).
 */

import { ThemeConfig, NavConfig, SiteConfig, FooterConfig } from "@core/schema";
import { parseTheme, parseSite, parseNav, parseFooter } from "@core/parser";
import { KEYS, getCached, saveCached, cache } from "@core/kv/base";

/**
 * Internal helper to create a configuration manager for a specific domain.
 * Centralizes the getter/setter logic to ensure DRY adherence.
 *
 * @param key - The KV key for the configuration.
 * @param parser - The parser function for the configuration type.
 * @param cacheKey - The key in the global isolate cache.
 * @returns An object with get and save methods.
 */
function createConfigManager<T>(
  key: string,
  parser: (raw: any) => T,
  cacheKey: keyof typeof cache,
) {
  return {
    get: (env: Env, force: boolean = false): Promise<T> =>
      getCached(
        env,
        key,
        parser,
        force,
        () => cache[cacheKey] as T | null,
        (v) => (cache[cacheKey] = v as any),
      ),
    save: (env: Env, config: T): Promise<void> =>
      saveCached(env, key, config, (v) => (cache[cacheKey] = v as any)),
  };
}

const themeManager = createConfigManager(KEYS.THEME, parseTheme, "theme");
const siteManager = createConfigManager(KEYS.SITE, parseSite, "site");
const navManager = createConfigManager(KEYS.NAV, parseNav, "nav");
const footerManager = createConfigManager(KEYS.FOOTER, parseFooter, "footer");

/**
 * Fetches the global theme configuration.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param force - If true, bypasses the in-memory cache.
 * @returns A promise resolving to the theme configuration.
 */
export const getTheme = themeManager.get;

/**
 * Persists the theme configuration.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param config - The theme configuration to save.
 * @returns A promise resolving when the save is complete.
 */
export const saveTheme = themeManager.save;

/**
 * Fetches site-wide identity and branding configuration.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param force - If true, bypasses the in-memory cache.
 * @returns A promise resolving to the site configuration.
 */
export const getSite = siteManager.get;

/**
 * Persists site identity configuration.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param config - The site configuration to save.
 * @returns A promise resolving when the save is complete.
 */
export const saveSite = siteManager.save;

/**
 * Fetches the primary navigation menu configuration.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param force - If true, bypasses the in-memory cache.
 * @returns A promise resolving to the navigation configuration.
 */
export const getNav = navManager.get;

/**
 * Persists navigation configuration.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param config - The navigation configuration to save.
 * @returns A promise resolving when the save is complete.
 */
export const saveNav = navManager.save;

/**
 * Fetches the global footer configuration.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param force - If true, bypasses the in-memory cache.
 * @returns A promise resolving to the footer configuration.
 */
export const getFooter = footerManager.get;

/**
 * Persists footer configuration.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param config - The footer configuration to save.
 * @returns A promise resolving when the save is complete.
 */
export const saveFooter = footerManager.save;

/**
 * Fetches all core site-wide configurations in parallel.
 *
 * @param env - Cloudflare Worker environment.
 * @returns Promise resolving to an object containing all core site configurations.
 */
export const getGlobalConfig = async (
  env: Env,
): Promise<{
  theme: ThemeConfig;
  site: SiteConfig;
  nav: NavConfig;
  footer: FooterConfig;
  seo: SiteConfig["seo"];
}> => {
  const [theme, site, nav, footer] = await Promise.all([
    getTheme(env),
    getSite(env),
    getNav(env),
    getFooter(env),
  ]);
  return { theme, site, nav, footer, seo: site.seo };
};

/**
 * Checks if the system initialization process has been completed.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @returns A promise resolving to true if initialized, false otherwise.
 */
export const getInitializedStatus = async (env: Env): Promise<boolean> => {
  const status = await env.EZ_CONTENT.get(KEYS.INITIALIZED, { type: "json" });
  return status === true;
};

/**
 * Updates the system initialization status.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param complete - The initialization status to set.
 * @returns A promise resolving when the update is complete.
 */
export const setInitializedStatus = async (
  env: Env,
  complete: boolean,
): Promise<void> => {
  await env.EZ_CONTENT.put(KEYS.INITIALIZED, JSON.stringify(complete));
};

/**
 * Checks if the system onboarding process has been completed.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @returns A promise resolving to true if onboarding is complete, false otherwise.
 */
export const getOnboardingStatus = async (env: Env): Promise<boolean> => {
  const status = await env.EZ_CONTENT.get(KEYS.ONBOARDING, { type: "json" });
  return status === true;
};

/**
 * Updates the system onboarding completion status.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param complete - The onboarding status to set.
 * @returns A promise resolving when the update is complete.
 */
export const setOnboardingStatus = async (
  env: Env,
  complete: boolean,
): Promise<void> => {
  await env.EZ_CONTENT.put(KEYS.ONBOARDING, JSON.stringify(complete));
};

/**
 * Checks for and populates any missing core configurations and the index page.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @returns A promise resolving when defaults are ensured.
 */
export const ensureSystemDefaults = async (env: Env): Promise<void> => {
  const isInitialized = await getInitializedStatus(env);
  if (isInitialized) return;

  const {
    createDefaultTheme,
    createDefaultSite,
    createDefaultNav,
    createDefaultFooter,
    createDefaultPage,
  } = await import("@core/factory");

  const [theme, site, nav, footer, indexPage] = await Promise.all([
    env.EZ_CONTENT.get(KEYS.THEME),
    env.EZ_CONTENT.get(KEYS.SITE),
    env.EZ_CONTENT.get(KEYS.NAV),
    env.EZ_CONTENT.get(KEYS.FOOTER),
    env.EZ_CONTENT.get(KEYS.PAGE("live", "index")),
  ]);

  const tasks: Promise<any>[] = [];

  const { savePage } = await import("@core/kv/content");

  if (!theme) tasks.push(saveTheme(env, createDefaultTheme()));
  if (!site) tasks.push(saveSite(env, createDefaultSite()));
  if (!nav) tasks.push(saveNav(env, createDefaultNav()));
  if (!footer) tasks.push(saveFooter(env, createDefaultFooter()));
  if (!indexPage)
    tasks.push(
      savePage(env, createDefaultPage("HOME SECTOR", "index"), "live"),
    );

  if (tasks.length > 0) {
    await Promise.all(tasks);
  }

  await setInitializedStatus(env, true);
};

/**
 * Resets all isolate-level in-memory configuration caches.
 */
export const clearCache = (): void => {
  cache.theme = null;
  cache.nav = null;
  cache.site = null;
  cache.footer = null;
};

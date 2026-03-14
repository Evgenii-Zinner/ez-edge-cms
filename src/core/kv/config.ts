/**
 * @module KVConfig
 * @description Logical domain for global system configurations (Theme, Site, Nav, Footer).
 */

import { ThemeConfig, NavConfig, SiteConfig, FooterConfig } from "@core/schema";
import { parseTheme, parseSite, parseNav, parseFooter } from "@core/parser";
import { KEYS, getCached, saveCached, cache } from "@core/kv/base";

/**
 * Fetches the global theme configuration.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param force - If true, bypasses the in-memory cache.
 * @returns A promise resolving to the theme configuration.
 */
export const getTheme = (
  env: Env,
  force: boolean = false,
): Promise<ThemeConfig> =>
  getCached(
    env,
    KEYS.THEME,
    parseTheme,
    force,
    () => cache.theme,
    (v) => (cache.theme = v),
  );

/**
 * Persists the theme configuration.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param config - The theme configuration to save.
 * @returns A promise resolving when the save is complete.
 */
export const saveTheme = (env: Env, config: ThemeConfig): Promise<void> =>
  saveCached(env, KEYS.THEME, config, (v) => (cache.theme = v));

/**
 * Fetches site-wide identity and branding configuration.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param force - If true, bypasses the in-memory cache.
 * @returns A promise resolving to the site configuration.
 */
export const getSite = (
  env: Env,
  force: boolean = false,
): Promise<SiteConfig> =>
  getCached(
    env,
    KEYS.SITE,
    parseSite,
    force,
    () => cache.site,
    (v) => (cache.site = v),
  );

/**
 * Persists site identity configuration.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param config - The site configuration to save.
 * @returns A promise resolving when the save is complete.
 */
export const saveSite = (env: Env, config: SiteConfig): Promise<void> =>
  saveCached(env, KEYS.SITE, config, (v) => (cache.site = v));

/**
 * Fetches the primary navigation menu configuration.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param force - If true, bypasses the in-memory cache.
 * @returns A promise resolving to the navigation configuration.
 */
export const getNav = (env: Env, force: boolean = false): Promise<NavConfig> =>
  getCached(
    env,
    KEYS.NAV,
    parseNav,
    force,
    () => cache.nav,
    (v) => (cache.nav = v),
  );

/**
 * Persists navigation configuration.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param config - The navigation configuration to save.
 * @returns A promise resolving when the save is complete.
 */
export const saveNav = (env: Env, config: NavConfig): Promise<void> =>
  saveCached(env, KEYS.NAV, config, (v) => (cache.nav = v));

/**
 * Fetches the global footer configuration.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param force - If true, bypasses the in-memory cache.
 * @returns A promise resolving to the footer configuration.
 */
export const getFooter = (
  env: Env,
  force: boolean = false,
): Promise<FooterConfig> =>
  getCached(
    env,
    KEYS.FOOTER,
    parseFooter,
    force,
    () => cache.footer,
    (v) => (cache.footer = v),
  );

/**
 * Persists footer configuration.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param config - The footer configuration to save.
 * @returns A promise resolving when the save is complete.
 */
export const saveFooter = (env: Env, config: FooterConfig): Promise<void> =>
  saveCached(env, KEYS.FOOTER, config, (v) => (cache.footer = v));

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

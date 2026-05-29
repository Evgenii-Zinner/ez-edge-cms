/**
 * @module KVContent
 * @description Logical domain for page content management, indexing, and publication.
 */

import {
  PageConfig,
  PageListEntry,
  PageListIndex,
  VERSIONS,
} from "@core/schema";
import { parsePage } from "@core/parser";
import { KEYS, updateQueue, setUpdateQueue, cache } from "@core/kv/base";

/**
 * Fetches a single page configuration by its slug and environment mode.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param slug - The unique path identifier for the page.
 * @param mode - The environment mode to fetch from ('draft' or 'live').
 * @returns A promise resolving to the parsed PageConfig, or null if not found or invalid.
 */
export const getPage = async (
  env: Env,
  slug: string,
  mode: "draft" | "live" = "live",
): Promise<PageConfig | null> => {
  const key = KEYS.PAGE(mode, slug);
  const raw = await env.EZ_CONTENT.get(key, { type: "json" });
  return parsePage(raw);
};

/**
 * Updates the persistent index list of page slugs for a specific environment mode.
 * Utilizes a sequential update queue to prevent race conditions during indexing.
 * Handles the v1 (string array) to v2 (object array) schema migration on-the-fly.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param pageOrSlug - The full page config (for add) or slug (for remove).
 * @param mode - The environment mode index to update.
 * @param action - Whether to 'add' or 'remove' the page from the index.
 * @returns A promise resolving when the index has been updated.
 */
const modifyPageList = async (
  env: Env,
  pageOrSlug: PageConfig | string,
  mode: "draft" | "live",
  action: "add" | "remove",
): Promise<void> => {
  const newQueue = updateQueue
    .then(async () => {
      const slug =
        typeof pageOrSlug === "string" ? pageOrSlug : pageOrSlug.slug;
      const key = KEYS.PAGE_LIST(mode);
      const raw: any = await env.EZ_CONTENT.get(key, { type: "json" });

      let indexObj: PageListIndex = {
        schemaVersion: VERSIONS.PAGE_LIST,
        items: [],
      };

      // Handle V1 (string array) to V2 migration
      if (Array.isArray(raw)) {
        indexObj.items = raw.map((s) => ({
          slug: s,
          title: s, // Fallback title
          createdAt: new Date().toISOString(),
        }));
      } else if (raw && raw.items) {
        indexObj = raw;
      }

      const existingIndex = indexObj.items.findIndex(
        (item) => item.slug === slug,
      );

      if (action === "add" && typeof pageOrSlug !== "string") {
        const entry: PageListEntry = {
          slug: pageOrSlug.slug,
          title: pageOrSlug.title,
          description: pageOrSlug.description,
          featuredImage: pageOrSlug.featuredImage,
          createdAt: pageOrSlug.metadata.createdAt,
          publishedAt: pageOrSlug.metadata.publishedAt,
        };

        if (existingIndex === -1) {
          indexObj.items.push(entry);
        } else {
          indexObj.items[existingIndex] = entry; // Update existing entry
        }
      } else if (action === "remove" && existingIndex !== -1) {
        indexObj.items.splice(existingIndex, 1);
      } else {
        return; // No change needed
      }

      await env.EZ_CONTENT.put(key, JSON.stringify(indexObj));

      // Update isolate cache
      if (mode === "live") cache.pageListLive = indexObj;
      else cache.pageListDraft = indexObj;
    })
    .catch((err) => {
      console.error("PageList Update Queue Error:", err);
    });

  setUpdateQueue(newQueue as Promise<void>);
  return newQueue as Promise<void>;
};

/**
 * Persists a page configuration to KV storage and updates the corresponding slug index.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param page - The page configuration object to save.
 * @param mode - The environment mode to save to ('draft' or 'live').
 * @returns A promise resolving when the save operation is complete.
 */
export const savePage = async (
  env: Env,
  page: PageConfig,
  mode: "draft" | "live" = "draft",
): Promise<void> => {
  const key = KEYS.PAGE(mode, page.slug);
  await env.EZ_CONTENT.put(key, JSON.stringify(page));
  await modifyPageList(env, page, mode, "add");
};

/**
 * Transitions a page from 'draft' to 'live' status.
 * Updates the status flag, sets the publication timestamp, and migrates the KV entry.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param slug - The slug of the page to publish.
 * @returns A promise resolving to true if the page was successfully published, false otherwise.
 */
export const publishPage = async (env: Env, slug: string): Promise<boolean> => {
  const draft = await getPage(env, slug, "draft");
  if (!draft) return false;

  const livePage: PageConfig = {
    ...draft,
    status: "published" as const,
    metadata: { ...draft.metadata, publishedAt: new Date().toISOString() },
  };

  await Promise.all([
    savePage(env, livePage, "live"),
    env.EZ_CONTENT.delete(KEYS.PAGE("draft", slug)),
    modifyPageList(env, slug, "draft", "remove"),
  ]);

  return true;
};

/**
 * Reverts a 'live' page to 'draft' status.
 * Removes the live entry and moves the configuration back into the draft workspace.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param slug - The slug of the page to unpublish.
 * @returns A promise resolving to true if the page was successfully unpublished, false otherwise.
 */
export const unpublishPage = async (
  env: Env,
  slug: string,
): Promise<boolean> => {
  const live = await getPage(env, slug, "live");
  if (!live) return false;

  const draftPage: PageConfig = {
    ...live,
    status: "draft" as const,
  };

  await Promise.all([
    savePage(env, draftPage, "draft"),
    env.EZ_CONTENT.delete(KEYS.PAGE("live", slug)),
    modifyPageList(env, slug, "live", "remove"),
  ]);

  return true;
};

/**
 * Permanently removes a page and its associated image assets from all environments.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param slug - The unique slug of the page to delete.
 * @returns A promise resolving when the deletion process is complete.
 */
export const deletePage = async (env: Env, slug: string): Promise<void> => {
  await Promise.all([
    env.EZ_CONTENT.delete(KEYS.PAGE("draft", slug)),
    env.EZ_CONTENT.delete(KEYS.PAGE("live", slug)),
    modifyPageList(env, slug, "draft", "remove"),
    modifyPageList(env, slug, "live", "remove"),
  ]);

  const imageList = await env.EZ_CONTENT.list({ prefix: `img:${slug}:` });
  await Promise.all(imageList.keys.map((k) => env.EZ_CONTENT.delete(k.name)));
};

/**
 * Retrieves the full list of page entries indexed within a specific environment mode.
 * Falls back to in-memory migration for v1 arrays if needed.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param mode - The environment mode to list ('draft' or 'live').
 * @returns A promise resolving to an array of PageListEntry objects.
 */
export const listPages = async (
  env: Env,
  mode: "draft" | "live" = "live",
): Promise<PageListEntry[]> => {
  const cached = mode === "live" ? cache.pageListLive : cache.pageListDraft;
  if (cached) return cached.items;

  const key = KEYS.PAGE_LIST(mode);
  const raw: any = await env.EZ_CONTENT.get(key, { type: "json" });

  if (!raw) return [];

  let indexObj: PageListIndex;

  // Handle V1 fallback
  if (Array.isArray(raw)) {
    indexObj = {
      schemaVersion: VERSIONS.PAGE_LIST,
      items: raw.map((s) => ({
        slug: s,
        title: s,
        createdAt: new Date().toISOString(),
      })),
    };
  } else {
    indexObj = raw as PageListIndex;
  }

  if (mode === "live") cache.pageListLive = indexObj;
  else cache.pageListDraft = indexObj;

  return indexObj.items;
};

/**
 * Safely renames a page by duplicating its data and images to a new slug,
 * updating the index lists, and deleting the old keys.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param oldSlug - The current slug of the page.
 * @param newSlug - The new slug to rename the page to.
 * @returns A promise resolving when the migration is complete.
 */
export const renamePage = async (
  env: Env,
  oldSlug: string,
  newSlug: string,
): Promise<void> => {
  const [draftPage, livePage] = await Promise.all([
    getPage(env, oldSlug, "draft"),
    getPage(env, oldSlug, "live"),
  ]);

  const savePromises: Promise<void>[] = [];
  const deletePromises: Promise<void>[] = [];

  // 1. Migrate Draft
  if (draftPage) {
    draftPage.slug = newSlug;
    savePromises.push(savePage(env, draftPage, "draft"));
    deletePromises.push(env.EZ_CONTENT.delete(KEYS.PAGE("draft", oldSlug)));
    deletePromises.push(modifyPageList(env, oldSlug, "draft", "remove"));
  }

  // 2. Migrate Live
  if (livePage) {
    livePage.slug = newSlug;
    savePromises.push(savePage(env, livePage, "live"));
    deletePromises.push(env.EZ_CONTENT.delete(KEYS.PAGE("live", oldSlug)));
    deletePromises.push(modifyPageList(env, oldSlug, "live", "remove"));
  }

  // 3. Migrate Images
  const imageList = await env.EZ_CONTENT.list({ prefix: `img:${oldSlug}:` });
  const imagePromises = imageList.keys.map(async (k) => {
    const buffer = await env.EZ_CONTENT.get(k.name, { type: "arrayBuffer" });
    if (buffer) {
      const newKey = k.name.replace(`img:${oldSlug}:`, `img:${newSlug}:`);
      await env.EZ_CONTENT.put(newKey, buffer);
      await env.EZ_CONTENT.delete(k.name);
    }
  });

  // Execute saves first
  await Promise.all([...savePromises, ...imagePromises]);

  // Then deletions
  await Promise.all(deletePromises);
};

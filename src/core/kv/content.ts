/**
 * @module KVContent
 * @description Logical domain for page content management, indexing, and publication.
 */

import { PageConfig } from "@core/schema";
import { parsePage } from "@core/parser";
import { KEYS, updateQueue, setUpdateQueue } from "@core/kv/base";

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
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param slug - The slug to ensure is present in the index.
 * @param mode - The environment mode index to update.
 * @returns A promise resolving when the index has been updated.
 */
const updatePageList = async (
  env: Env,
  slug: string,
  mode: "draft" | "live",
): Promise<void> => {
  const newQueue = updateQueue.then(async () => {
    const key = KEYS.PAGE_LIST(mode);
    const currentList: string[] =
      (await env.EZ_CONTENT.get(key, { type: "json" })) || [];

    if (!currentList.includes(slug)) {
      currentList.push(slug);
      await env.EZ_CONTENT.put(key, JSON.stringify(currentList));
    }
  });

  setUpdateQueue(newQueue);
  return newQueue;
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
  await updatePageList(env, page.slug, mode);
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
  ]);

  const draftKey = KEYS.PAGE_LIST("draft");
  const draftList: string[] =
    (await env.EZ_CONTENT.get(draftKey, { type: "json" })) || [];
  const newDraftList = draftList.filter((s) => s !== slug);
  await env.EZ_CONTENT.put(draftKey, JSON.stringify(newDraftList));

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
  ]);

  const liveKey = KEYS.PAGE_LIST("live");
  const liveList: string[] =
    (await env.EZ_CONTENT.get(liveKey, { type: "json" })) || [];
  const newLiveList = liveList.filter((s) => s !== slug);
  await env.EZ_CONTENT.put(liveKey, JSON.stringify(newLiveList));

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
  ]);

  const imageList = await env.EZ_CONTENT.list({ prefix: `img:${slug}:` });
  await Promise.all(imageList.keys.map((k) => env.EZ_CONTENT.delete(k.name)));

  await Promise.all(
    (["draft", "live"] as const).map(async (mode) => {
      const key = KEYS.PAGE_LIST(mode);
      const list: string[] =
        (await env.EZ_CONTENT.get(key, { type: "json" })) || [];
      const newList = list.filter((s) => s !== slug);
      await env.EZ_CONTENT.put(key, JSON.stringify(newList));
    }),
  );
};

/**
 * Retrieves the full list of page slugs indexed within a specific environment mode.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param mode - The environment mode to list ('draft' or 'live').
 * @returns A promise resolving to an array of slugs.
 */
export const listPages = async (
  env: Env,
  mode: "draft" | "live" = "live",
): Promise<string[]> => {
  const key = KEYS.PAGE_LIST(mode);
  return (await env.EZ_CONTENT.get(key, { type: "json" })) || [];
};

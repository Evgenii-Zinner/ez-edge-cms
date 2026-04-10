/**
 * @module KVLayouts
 * @description Data access layer for ELS layout blueprints stored in KV.
 */

import { KV_KEYS, KV_PREFIX } from "@core/constants";
import { ELSBlueprintSchema, type ELSBlueprint } from "@core/schema";

/**
 * @description Retrieves all saved layout slugs.
 *
 * @param env - Cloudflare Worker environment.
 * @returns A promise resolving to an array of layout slugs.
 */
export async function listLayouts(env: Env): Promise<string[]> {
  const { keys } = await env.EZ_CONTENT.list({ prefix: KV_PREFIX.LAYOUT });
  return keys.map((key) => key.name.replace(KV_PREFIX.LAYOUT, ""));
}

/**
 * @description Fetches and parses a specific layout blueprint.
 *
 * @param env - Cloudflare Worker environment.
 * @param slug - The layout slug to fetch.
 * @returns A promise resolving to the parsed ELSBlueprint or null if not found.
 */
export async function getLayout(
  env: Env,
  slug: string,
): Promise<ELSBlueprint | null> {
  const raw = await env.EZ_CONTENT.get(KV_KEYS.LAYOUT(slug), { type: "json" });
  if (!raw) return null;

  try {
    return ELSBlueprintSchema.parse(raw);
  } catch (e: any) {
    const details = e.issues ? JSON.stringify(e.issues, null, 2) : e.message;
    console.error(`Layout validation failed for ${slug}:`, details);
    return null;
  }
}

/**
 * @description Fetches the raw JSON for a layout without validation.
 * Used for the Pro Mode editor when data is corrupted.
 *
 * @param env - Cloudflare Worker environment.
 * @param slug - The layout slug to fetch.
 * @returns A promise resolving to the raw object or null if not found.
 */
export async function getRawLayout(
  env: Env,
  slug: string,
): Promise<any | null> {
  return await env.EZ_CONTENT.get(KV_KEYS.LAYOUT(slug), { type: "json" });
}

/**
 * @description Persists an ELS layout blueprint to KV after validation.
 *
 * @param env - Cloudflare Worker environment.
 * @param slug - The unique layout slug.
 * @param data - The raw ELSBlueprint object to save.
 * @returns A promise resolving when the layout is saved.
 */
export async function saveLayout(
  env: Env,
  slug: string,
  data: any,
): Promise<void> {
  const validated = ELSBlueprintSchema.parse(data);
  await env.EZ_CONTENT.put(KV_KEYS.LAYOUT(slug), JSON.stringify(validated));
}

/**
 * @description Deletes a layout blueprint from KV.
 *
 * @param env - Cloudflare Worker environment.
 * @param slug - The layout slug to remove.
 * @returns A promise resolving when the layout is deleted.
 */
export async function deleteLayout(env: Env, slug: string): Promise<void> {
  await env.EZ_CONTENT.delete(KV_KEYS.LAYOUT(slug));
}

/**
 * @module KVShards
 * @description Data access layer for Global Shards (reusable content blocks) stored in KV.
 */

import { KV_KEYS, KV_PREFIX } from "@core/constants";
import { GlobalShardSchema, type GlobalShard } from "@core/schema";

/**
 * @description Retrieves all saved global shard IDs.
 *
 * @param env - Cloudflare Worker environment.
 * @returns A promise resolving to an array of shard IDs.
 */
export async function listShards(env: Env): Promise<string[]> {
  const { keys } = await env.EZ_CONTENT.list({ prefix: KV_PREFIX.SHARD });
  return keys.map((key) => key.name.replace(KV_PREFIX.SHARD, ""));
}

/**
 * @description Fetches and parses a specific global shard.
 *
 * @param env - Cloudflare Worker environment.
 * @param id - The shard ID to fetch.
 * @returns A promise resolving to the parsed GlobalShard or null if not found.
 */
export async function getShard(env: Env, id: string): Promise<GlobalShard | null> {
  const raw = await env.EZ_CONTENT.get(KV_KEYS.SHARD(id), { type: "json" });
  if (!raw) return null;
  
  try {
    return GlobalShardSchema.parse(raw);
  } catch (e: any) {
    const details = e.issues ? JSON.stringify(e.issues, null, 2) : e.message;
    console.error(`Shard validation failed for ${id}:`, details);
    return null;
  }
}

/**
 * @description Persists a global shard to KV after validation.
 *
 * @param env - Cloudflare Worker environment.
 * @param id - The unique shard ID.
 * @param data - The raw GlobalShard object to save.
 * @returns A promise resolving when the shard is saved.
 */
export async function saveShard(env: Env, id: string, data: any): Promise<void> {
  const validated = GlobalShardSchema.parse(data);
  await env.EZ_CONTENT.put(KV_KEYS.SHARD(id), JSON.stringify(validated));
}

/**
 * @description Deletes a global shard from KV.
 *
 * @param env - Cloudflare Worker environment.
 * @param id - The shard ID to remove.
 * @returns A promise resolving when the shard is deleted.
 */
export async function deleteShard(env: Env, id: string): Promise<void> {
  await env.EZ_CONTENT.delete(KV_KEYS.SHARD(id));
}

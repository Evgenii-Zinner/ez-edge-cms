/**
 * @module KVMaintenance
 * @description Logical domain for system maintenance, backup, restore, and project-wide key operations.
 */

import { isInternalKey, isProtectedKey } from "@core/kv/base";
import { clearCache } from "@core/kv/config";

/**
 * Retrieves a list of all project-related keys in the KV namespace, excluding internal system keys.
 * Handles KV pagination automatically.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @returns A promise resolving to an array of project-related key names.
 */
export const listAllProjectKeys = async (env: Env): Promise<string[]> => {
  const allKeys: string[] = [];
  let cursor: string | undefined;

  do {
    const list: KVNamespaceListResult<any> = await env.EZ_CONTENT.list({
      cursor,
    });
    for (const key of list.keys) {
      if (!isInternalKey(key.name)) {
        allKeys.push(key.name);
      }
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  return allKeys;
};

/**
 * Converts an ArrayBuffer into a Base64-encoded string.
 *
 * @param buffer - The source ArrayBuffer to convert.
 * @returns The resulting Base64 string.
 */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

/**
 * Exports all non-internal project data from KV as a single JSON object.
 * Automatically handles image assets by converting them to Data URLs.
 *
 * @param env - Cloudflare Worker environment bindings.
 * @returns A promise resolving to a record containing all exported project keys and values.
 */
export const exportAllData = async (env: Env): Promise<Record<string, any>> => {
  const allData: Record<string, any> = {};
  let cursor: string | undefined;

  do {
    const list: KVNamespaceListResult<any> = await env.EZ_CONTENT.list({
      cursor,
    });

    for (const key of list.keys) {
      if (isInternalKey(key.name)) continue;

      if (key.name.startsWith("img:")) {
        const { value, metadata } = await env.EZ_CONTENT.getWithMetadata<{
          contentType: string;
        }>(key.name, "arrayBuffer");
        if (value) {
          const base64 = arrayBufferToBase64(value as ArrayBuffer);
          const contentType = metadata?.contentType || "image/webp";
          allData[key.name] = `data:${contentType};base64,${base64}`;
        }
      } else {
        const value = await env.EZ_CONTENT.get(key.name, { type: "json" });
        allData[key.name] = value;
      }
    }

    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  return allData;
};

/**
 * Restores project data from a provided JSON object into KV storage.
 * Performs a selective clear of existing data before importing (skipping protected keys).
 *
 * @param env - Cloudflare Worker environment bindings.
 * @param data - The project data object to import.
 * @returns A promise resolving to the total count of keys successfully imported.
 */
export const importAllData = async (
  env: Env,
  data: Record<string, any>,
): Promise<number> => {
  let cursor: string | undefined;
  do {
    const list: KVNamespaceListResult<any> = await env.EZ_CONTENT.list({
      cursor,
    });
    for (const key of list.keys) {
      if (isProtectedKey(key.name)) continue;
      await env.EZ_CONTENT.delete(key.name);
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  let count = 0;
  for (const [key, value] of Object.entries(data)) {
    if (isProtectedKey(key)) continue;

    if (
      key.startsWith("img:") &&
      typeof value === "string" &&
      value.startsWith("data:")
    ) {
      const [meta, b64] = value.split(",");
      const contentType = meta.split(":")[1].split(";")[0];
      const binaryString = atob(b64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      await env.EZ_CONTENT.put(key, bytes as any, {
        metadata: { contentType },
      });
    } else {
      const finalValue =
        typeof value === "object" ? JSON.stringify(value) : value;
      await env.EZ_CONTENT.put(key, finalValue);
    }
    count++;
  }

  clearCache();
  return count;
};

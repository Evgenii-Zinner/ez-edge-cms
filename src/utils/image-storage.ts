/**
 * @module ImageStorage
 * @description Utilities for processing and storing images in Cloudflare KV.
 * Handles Base64 extraction, KV persistence, and garbage collection of orphaned images.
 */

/**
 * Core internal helper to save a binary image from a Base64 string to KV.
 *
 * @param env - The Cloudflare Worker environment bindings.
 * @param key - The unique KV key for the image.
 * @param base64Data - The raw Base64 data string (with data:image/... prefix).
 * @returns A promise resolving to the final content type of the image.
 */
async function putBinaryImage(
  env: Env,
  key: string,
  base64Data: string,
): Promise<string> {
  const [meta, data] = base64Data.split(",");
  const contentType = meta.split(":")[1].split(";")[0];

  // Convert base64 to Uint8Array for KV storage
  const binaryString = atob(data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  await env.EZ_CONTENT.put(key, bytes as any, {
    metadata: { contentType },
  });

  return contentType;
}

/**
 * Scans Editor.js JSON content, extracts Base64 images, saves them to KV,
 * and replaces the Base64 strings with permanent relative URLs.
 * Also performs garbage collection of orphaned images for the given slug.
 *
 * @param env - The Cloudflare Worker environment bindings.
 * @param slug - The unique path identifier for the content.
 * @param content - The Editor.js data object.
 * @returns The updated Editor.js data object with KV URLs.
 */
export async function extractAndSaveImages(
  env: Env,
  slug: string,
  content: any,
): Promise<any> {
  if (!content || !content.blocks) return content;

  const currentImageKeys: string[] = [];

  for (const block of content.blocks) {
    // 1. Process Standard Image Blocks
    if (block.type === "image" && block.data?.file) {
      const { url } = block.data.file;
      const imageId = block.id || Math.random().toString(36).substring(2, 12);

      // Process Image
      if (url && url.startsWith("data:image/")) {
        const extension = url.split(";")[0].split("/")[1] || "webp";
        const filename = `${imageId}.${extension}`;
        const imageKey = `img:${slug}:${filename}`;

        await putBinaryImage(env, imageKey, url);
        block.data.file.url = `/images/${slug}/${filename}`;
        currentImageKeys.push(imageKey);
      } else if (
        url &&
        (url.startsWith("/images/") || url.startsWith("images/"))
      ) {
        // Correctly extract slug and filename from existing URLs
        const relPath = url.startsWith("/")
          ? url.substring(8)
          : url.substring(7);
        const lastSlash = relPath.lastIndexOf("/");
        if (lastSlash !== -1) {
          const existingSlug = relPath.substring(0, lastSlash);
          const existingFilename = relPath.substring(lastSlash + 1);
          currentImageKeys.push(`img:${existingSlug}:${existingFilename}`);
        }
      }

      // Cleanup: Remove any legacy urlMobile from the data
      if (block.data.file.urlMobile) {
        delete block.data.file.urlMobile;
      }
    }

    // 2. Process Custom Hero Blocks
    if (block.type === "hero" && block.data?.url) {
      const { url } = block.data;
      const imageId = block.id || Math.random().toString(36).substring(2, 12);

      if (url && url.startsWith("data:image/")) {
        const extension = url.split(";")[0].split("/")[1] || "webp";
        const filename = `hero-${imageId}.${extension}`;
        const imageKey = `img:${slug}:${filename}`;

        await putBinaryImage(env, imageKey, url);
        block.data.url = `/images/${slug}/${filename}`;
        currentImageKeys.push(imageKey);
      } else if (
        url &&
        (url.startsWith("/images/") || url.startsWith("images/"))
      ) {
        const relPath = url.startsWith("/")
          ? url.substring(8)
          : url.substring(7);
        const lastSlash = relPath.lastIndexOf("/");
        if (lastSlash !== -1) {
          const existingSlug = relPath.substring(0, lastSlash);
          const existingFilename = relPath.substring(lastSlash + 1);
          currentImageKeys.push(`img:${existingSlug}:${existingFilename}`);
        }
      }
    }
  }

  // Garbage Collection: Delete images in KV that are no longer in the content
  try {
    const list = await env.EZ_CONTENT.list({ prefix: `img:${slug}:` });
    const deletePromises = list.keys
      .filter((k) => !currentImageKeys.includes(k.name))
      .map((k) => env.EZ_CONTENT.delete(k.name));

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }
  } catch (e) {
    console.error("Image GC failed", e);
  }

  return content;
}

/**
 * Saves a single image to KV for site-wide settings (e.g., OG Image).
 *
 * @param env - The Cloudflare Worker environment bindings.
 * @param key - The unique sub-key for this image (e.g., 'og-image').
 * @param base64Data - The raw Base64 data string (with data:image/... prefix).
 * @returns The final relative URL of the saved image.
 */
export async function saveSiteImage(
  env: Env,
  key: string,
  base64Data: string,
): Promise<string> {
  if (!base64Data || !base64Data.startsWith("data:image/")) {
    return base64Data;
  }

  const filename = `${key}.webp`;
  const imageKey = `img:site:${filename}`;

  // Garbage Collection: Delete any old versions of this specific site image (e.g. different extensions)
  try {
    const list = await env.EZ_CONTENT.list({ prefix: `img:site:${key}.` });
    const deletePromises = list.keys.map((k) => env.EZ_CONTENT.delete(k.name));
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }
  } catch (e) {
    console.error(`Failed to clean up old site image for ${key}`, e);
  }

  await putBinaryImage(env, imageKey, base64Data);

  return `/images/site/${filename}`;
}

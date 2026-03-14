import { describe, it, expect, beforeEach } from "bun:test";
import {
  extractAndSaveImages,
  saveSiteImage,
} from "../../src/utils/image-storage";

const createMockEnv = () => {
  const store = new Map<string, any>();
  return {
    EZ_CONTENT: {
      get: async (key: string) => store.get(key),
      put: async (key: string, value: any) => store.set(key, value),
      delete: async (key: string) => store.delete(key),
      list: async (options?: { prefix?: string }) => {
        let keys = Array.from(store.keys());
        if (options?.prefix) {
          keys = keys.filter((k) => k.startsWith(options.prefix!));
        }
        return {
          keys: keys.map((k) => ({ name: k })),
          list_complete: true,
        };
      },
    },
  } as unknown as Env;
};

describe("ImageStorage Utilities", () => {
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
  });

  it("should return content unchanged if no images are present", async () => {
    const content = {
      blocks: [{ type: "paragraph", data: { text: "No images here" } }],
    };
    const result = await extractAndSaveImages(env, "test", content);
    expect(result).toEqual(content);
  });

  it("should extract base64 images and save to KV", async () => {
    const base64Image =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const content = {
      blocks: [
        {
          id: "block1",
          type: "image",
          data: {
            file: {
              url: base64Image,
              urlMobile: base64Image, // Should be cleaned up
            },
          },
        },
      ],
    };

    const result = await extractAndSaveImages(env, "page1", content);

    // Verify URL is replaced
    expect(result.blocks[0].data.file.url).toBe("/images/page1/block1.png");
    expect(result.blocks[0].data.file.urlMobile).toBeUndefined();

    // Verify KV persistence
    const list = await env.EZ_CONTENT.list({ prefix: "img:page1:" });
    expect(list.keys.length).toBe(1);
    expect(list.keys.map((k) => k.name)).toContain("img:page1:block1.png");
    expect(list.keys.map((k) => k.name)).not.toContain(
      "img:page1:desktop-block1.png",
    );
  });

  it("should perform garbage collection on orphaned images", async () => {
    const slug = "gc-test";

    // 1. Setup existing images in KV
    await env.EZ_CONTENT.put(`img:${slug}:old-image.webp`, "data");
    await env.EZ_CONTENT.put(`img:${slug}:keep-me.webp`, "data");

    // 2. Process content that only references one of the images
    const content = {
      blocks: [
        {
          type: "image",
          data: {
            file: {
              url: `/images/${slug}/keep-me.webp`,
            },
          },
        },
      ],
    };

    await extractAndSaveImages(env, slug, content);

    // 3. Verify 'old-image.webp' is deleted, but 'keep-me.webp' remains
    const list = await env.EZ_CONTENT.list({ prefix: `img:${slug}:` });
    expect(list.keys.length).toBe(1);
    expect(list.keys[0].name).toBe(`img:${slug}:keep-me.webp`);
  });

  it("should track existing image URLs correctly", async () => {
    const slug = "tracking-test";
    const content = {
      blocks: [
        {
          type: "image",
          data: {
            file: {
              url: `/images/${slug}/existing.webp`,
            },
          },
        },
      ],
    };

    // Put it in KV first
    await env.EZ_CONTENT.put(`img:${slug}:existing.webp`, "data");

    await extractAndSaveImages(env, slug, content);

    // Verify it is NOT deleted
    const list = await env.EZ_CONTENT.list({ prefix: `img:${slug}:` });
    expect(list.keys.length).toBe(1);
  });

  it("should handle GC failures gracefully", async () => {
    const errorEnv = {
      EZ_CONTENT: {
        list: async () => {
          throw new Error("KV List Failure");
        },
      },
    } as any;

    const content = { blocks: [] };
    // This should not throw
    const result = await extractAndSaveImages(errorEnv, "test", content);
    expect(result).toEqual(content);
  });

  it("should cover mock list helper branches", async () => {
    await env.EZ_CONTENT.put("a", "1");
    await env.EZ_CONTENT.put("b", "2");

    // Call get to cover function
    expect(await env.EZ_CONTENT.get("a")).toBe("1");

    const all = await env.EZ_CONTENT.list();
    expect(all.keys.length).toBe(2);

    const filtered = await env.EZ_CONTENT.list({ prefix: "a" });
    expect(filtered.keys.length).toBe(1);

    // Call delete to cover function
    await env.EZ_CONTENT.delete("a");
    expect(await env.EZ_CONTENT.get("a")).toBeUndefined();
  });

  describe("saveSiteImage", () => {
    it("should save site image to KV and return relative URL", async () => {
      const base64Image =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      const url = await saveSiteImage(env, "og-image", base64Image);

      expect(url).toBe("/images/site/og-image.webp");
      const kvValue = await env.EZ_CONTENT.get("img:site:og-image.webp");
      expect(kvValue).toBeDefined();
    });

    it("should return unchanged value if not base64", async () => {
      const url = "https://example.com/external.jpg";
      const result = await saveSiteImage(env, "og-image", url);
      expect(result).toBe(url);
    });

    it("should clean up old versions of the site image", async () => {
      // 1. Setup old images with different extensions
      await env.EZ_CONTENT.put("img:site:og-image.webp", "old-data");
      await env.EZ_CONTENT.put("img:site:og-image.jpg", "old-data");
      await env.EZ_CONTENT.put("img:site:other.png", "keep-me");

      const base64Image =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

      // 2. Save new version (will be webp now)
      await saveSiteImage(env, "og-image", base64Image);

      // 3. Verify old extensions are deleted, but other images remain
      const allKeys = (await env.EZ_CONTENT.list()).keys.map((k) => k.name);
      expect(allKeys).toContain("img:site:og-image.webp");
      expect(allKeys).not.toContain("img:site:og-image.jpg");
      expect(allKeys).toContain("img:site:other.png");
      // The old og-image.webp was replaced, so it's still there but with new data
    });

    it("should handle cleanup failures gracefully", async () => {
      const errorEnv = {
        EZ_CONTENT: {
          list: async () => {
            throw new Error("KV List Failure");
          },
          put: async () => {},
        },
      } as any;

      const base64Image = "data:image/png;base64,abc";
      // Should not throw
      const url = await saveSiteImage(errorEnv, "og-image", base64Image);
      expect(url).toBe("/images/site/og-image.webp");
    });
  });
});

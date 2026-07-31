import { describe, it, expect, beforeEach } from "bun:test";
import {
  extractAndSaveImages,
  saveSiteImage,
} from "../../src/utils/image-storage";

/**
 * Enhanced Mock Environment for Image Storage Tests.
 * This helper tracks not just keys, but also values and metadata to verify binary storage.
 */
const createMockEnv = () => {
  const store = new Map<string, { value: any; metadata?: any }>();
  return {
    EZ_CONTENT: {
      get: async (key: string) => store.get(key)?.value || null,
      put: async (key: string, value: any, options?: { metadata?: any }) => {
        store.set(key, { value, metadata: options?.metadata });
      },
      delete: async (key: string) => {
        store.delete(key);
      },
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
      // Helper for testing
      _getMetadata: (key: string) => store.get(key)?.metadata,
      _getRaw: (key: string) => store.get(key),
    },
  } as any;
};

describe("ImageStorage Utilities", () => {
  let env: any;

  beforeEach(() => {
    env = createMockEnv();
  });

  describe("extractAndSaveImages", () => {
    it("should return content unchanged if no blocks are present", async () => {
      const content: any[] = [];
      const result = await extractAndSaveImages(env, "test", content);
      expect(result).toEqual(content);
    });

    it("should process images and hero blocks in PortableText content array", async () => {
      const base64Image =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      const content = [
        {
          _key: "block1",
          _type: "image",
          url: base64Image,
        },
        {
          _key: "block2",
          _type: "hero",
          imageUrl: base64Image,
        },
        {
          _type: "image",
          url: base64Image,
        },
      ];

      const result = await extractAndSaveImages(env, "pt-page", content);

      expect(result).toHaveLength(3);
      expect(result[0].url).toBe("/images/pt-page/block1.png");
      expect(result[1].imageUrl).toBe("/images/pt-page/hero-block2.png");
      expect(result[2].url).toMatch(/\/images\/pt-page\/[a-z0-9]+\.png/);

      const list = await env.EZ_CONTENT.list({ prefix: "img:pt-page:" });
      expect(list.keys).toHaveLength(3);
    });

    it("should handle null or undefined content gracefully", async () => {
      expect(await extractAndSaveImages(env, "test", null)).toBeNull();
      expect(
        await extractAndSaveImages(env, "test", undefined),
      ).toBeUndefined();
    });

    it("should extract base64 images and save as binary with metadata", async () => {
      // 1x1 transparent PNG
      const base64Image =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      const content = [
        {
          _key: "block1",
          _type: "image",
          url: base64Image,
        },
      ];

      const result = await extractAndSaveImages(env, "page1", content);

      // Verify URL transformation
      expect(result[0].url).toBe("/images/page1/block1.png");

      // Verify KV persistence and binary integrity
      const imageKey = "img:page1:block1.png";
      const stored = env.EZ_CONTENT._getRaw(imageKey);
      expect(stored).toBeDefined();
      expect(stored.value).toBeInstanceOf(Uint8Array);
      expect(stored.metadata.contentType).toBe("image/png");
    });

    it("should extract images from custom hero blocks with 'hero-' prefix", async () => {
      const base64Webp =
        "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TAYAAAAvAAAAAAfQAA==";
      const content = [
        {
          _key: "hero-1",
          _type: "hero",
          imageUrl: base64Webp,
        },
      ];

      const result = await extractAndSaveImages(env, "home", content);
      expect(result[0].imageUrl).toBe("/images/home/hero-hero-1.webp");
      expect(
        env.EZ_CONTENT._getMetadata("img:home:hero-hero-1.webp").contentType,
      ).toBe("image/webp");
    });

    it("should generate random IDs for blocks without an ID", async () => {
      const base64 =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      const content = [
        {
          _type: "image",
          url: base64,
        },
      ];

      const result = await extractAndSaveImages(env, "no-id", content);
      const url = result[0].url;
      expect(url).toMatch(/\/images\/no-id\/[a-z0-9]+\.png/);
    });

    it("should perform thorough garbage collection of orphaned images", async () => {
      const slug = "gc-test";

      // Setup KV with various "old" images
      await env.EZ_CONTENT.put(`img:${slug}:old-1.png`, "data");
      await env.EZ_CONTENT.put(`img:${slug}:old-2.webp`, "data");
      await env.EZ_CONTENT.put(`img:${slug}:keep-me.jpg`, "data");

      // Content only references 'keep-me.jpg'
      const content = [
        {
          _key: "keep-me",
          _type: "image",
          url: `/images/${slug}/keep-me.jpg`,
        },
      ];

      await extractAndSaveImages(env, slug, content);

      // Verify orphaned images were deleted and active image was retained
      expect(await env.EZ_CONTENT.get(`img:${slug}:old-1.png`)).toBeNull();
      expect(await env.EZ_CONTENT.get(`img:${slug}:old-2.webp`)).toBeNull();
      expect(
        await env.EZ_CONTENT.get(`img:${slug}:keep-me.jpg`),
      ).not.toBeNull();
    });

    it("should correctly identify existing images even with leading slashes", async () => {
      const slug = "slash-test";
      await env.EZ_CONTENT.put(`img:${slug}:image.png`, "data");

      const content = [
        {
          _key: "1",
          _type: "image",
          url: `/images/${slug}/image.png`,
        },
      ];

      await extractAndSaveImages(env, slug, content);
      expect(await env.EZ_CONTENT.get(`img:${slug}:image.png`)).not.toBeNull();
    });

    it("should handle mixed content (base64, existing, external) in one pass", async () => {
      const slug = "mixed-test";
      const base64 =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

      // Existing image in KV
      await env.EZ_CONTENT.put(`img:${slug}:existing.png`, "data");

      const content = [
        {
          _key: "new",
          _type: "image",
          url: base64,
        },
        {
          _key: "existing",
          _type: "image",
          url: `/images/${slug}/existing.png`,
        },
        {
          _key: "external",
          _type: "image",
          url: "https://example.com/external.jpg",
        },
      ];

      const result = await extractAndSaveImages(env, slug, content);

      expect(result[0].url).toBe(`/images/${slug}/new.png`);
      expect(result[1].url).toBe(`/images/${slug}/existing.png`);
      expect(result[2].url).toBe("https://example.com/external.jpg");

      // Verify KV state: new and existing are present, no extra files
      const list = await env.EZ_CONTENT.list({ prefix: `img:${slug}:` });
      expect(list.keys).toHaveLength(2);
      expect(list.keys.map((k: any) => k.name).sort()).toEqual([
        `img:${slug}:existing.png`,
        `img:${slug}:new.png`,
      ]);
    });
    it("should handle garbage collection error gracefully if KV list fails", async () => {
      const failingEnv = {
        EZ_CONTENT: {
          get: async () => null,
          list: async () => ({ keys: [{ name: "img:page-gc-fail:old.png" }] }),
          put: async () => {},
          delete: async () => {
            throw new Error("KV Delete Error");
          },
        },
      } as any;

      const base64Image =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      const content = [{ _key: "b1", _type: "image", url: base64Image }];

      const result = await extractAndSaveImages(
        failingEnv,
        "page-gc-fail",
        content,
      );
      expect(result[0].url).toBe("/images/page-gc-fail/b1.png");
    });
  });

  describe("saveSiteImage", () => {
    it("should save base64 site logo with custom key and metadata", async () => {
      const base64Svg =
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PC9zdmc+";

      const url = await saveSiteImage(env, "logo.svg", base64Svg);

      expect(url).toBe("/images/site/logo.svg");

      const imageKey = "img:site:logo.svg";
      const stored = env.EZ_CONTENT._getRaw(imageKey);
      expect(stored).toBeDefined();
      expect(stored.metadata.contentType).toBe("image/svg+xml");
    });

    it("should handle site image GC error gracefully if KV list fails", async () => {
      const failingEnv = {
        EZ_CONTENT: {
          get: async () => null,
          list: async () => ({ keys: [{ name: "img:site:og-image.png" }] }),
          put: async () => {},
          delete: async () => {
            throw new Error("KV Delete Fail");
          },
        },
      } as any;

      const base64Png =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

      const url = await saveSiteImage(failingEnv, "og-image", base64Png);
      expect(url).toBe("/images/site/og-image.webp");
    });
  });

  it("should return unchanged URL if string is not base64", async () => {
    const httpUrl = "https://example.com/logo.png";
    const result = await saveSiteImage(env, "logo.png", httpUrl);
    expect(result).toBe(httpUrl);

    // Verify nothing was saved to KV
    const list = await env.EZ_CONTENT.list({ prefix: "img:site:" });
    expect(list.keys).toHaveLength(0);
  });

  it("should return empty string if input URL is empty", async () => {
    expect(await saveSiteImage(env, "logo.png", "")).toBe("");
  });
});

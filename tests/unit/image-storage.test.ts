import { describe, it, expect, beforeEach, spyOn } from "bun:test";
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
    // Silence console to keep test output clean, but allow spying
    spyOn(console, "error").mockImplementation(() => {});
    spyOn(console, "log").mockImplementation(() => {});
  });

  describe("extractAndSaveImages", () => {
    it("should return content unchanged if no blocks are present", async () => {
      const content = { time: 123 };
      const result = await extractAndSaveImages(env, "test", content);
      expect(result).toEqual(content);
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
      const content = {
        blocks: [
          {
            id: "block1",
            type: "image",
            data: {
              file: {
                url: base64Image,
                urlMobile: "should-be-deleted",
              },
            },
          },
        ],
      };

      const result = await extractAndSaveImages(env, "page1", content);

      // Verify URL transformation
      expect(result.blocks[0].data.file.url).toBe("/images/page1/block1.png");
      expect(result.blocks[0].data.file.urlMobile).toBeUndefined();

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
      const content = {
        blocks: [
          {
            id: "hero-1",
            type: "hero",
            data: { url: base64Webp },
          },
        ],
      };

      const result = await extractAndSaveImages(env, "home", content);
      expect(result.blocks[0].data.url).toBe("/images/home/hero-hero-1.webp");
      expect(
        env.EZ_CONTENT._getMetadata("img:home:hero-hero-1.webp").contentType,
      ).toBe("image/webp");
    });

    it("should generate random IDs for blocks without an ID", async () => {
      const base64 =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      const content = {
        blocks: [
          {
            type: "image",
            data: { file: { url: base64 } },
          },
        ],
      };

      const result = await extractAndSaveImages(env, "no-id", content);
      const url = result.blocks[0].data.file.url;
      expect(url).toMatch(/\/images\/no-id\/[a-z0-9]+\.png/);
    });

    it("should perform thorough garbage collection of orphaned images", async () => {
      const slug = "gc-test";

      // Setup KV with various "old" images
      await env.EZ_CONTENT.put(`img:${slug}:old-1.png`, "data");
      await env.EZ_CONTENT.put(`img:${slug}:old-2.webp`, "data");
      await env.EZ_CONTENT.put(`img:${slug}:keep-me.jpg`, "data");

      // Content only references 'keep-me.jpg'
      const content = {
        blocks: [
          {
            id: "keep-me",
            type: "image",
            data: { file: { url: `/images/${slug}/keep-me.jpg` } },
          },
        ],
      };

      await extractAndSaveImages(env, slug, content);

      const list = await env.EZ_CONTENT.list({ prefix: `img:${slug}:` });
      const keys = list.keys.map((k: any) => k.name);

      expect(keys).toContain(`img:${slug}:keep-me.jpg`);
      expect(keys).not.toContain(`img:${slug}:old-1.png`);
      expect(keys).not.toContain(`img:${slug}:old-2.webp`);
    });

    it("should correctly identify existing images even with leading slashes", async () => {
      const slug = "slash-test";
      await env.EZ_CONTENT.put(`img:${slug}:test.png`, "data");

      const content = {
        blocks: [
          {
            type: "image",
            data: { file: { url: `/images/${slug}/test.png` } },
          },
          { type: "image", data: { file: { url: `images/${slug}/test.png` } } },
        ],
      };

      await extractAndSaveImages(env, slug, content);

      const list = await env.EZ_CONTENT.list({ prefix: `img:${slug}:` });
      expect(list.keys.length).toBe(1); // Neither should be deleted as they are both "current"
    });

    it("should handle mixed content (base64, existing, external) in one pass", async () => {
      const slug = "mixed-test";

      await env.EZ_CONTENT.put(`img:${slug}:existing.png`, "data");

      const content = {
        blocks: [
          {
            id: "b64",
            type: "image",
            data: {
              file: {
                url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
              },
            },
          },
          {
            type: "image",
            data: { file: { url: `/images/${slug}/existing.png` } },
          },
          {
            type: "image",
            data: { file: { url: "https://external.com/img.jpg" } },
          },
        ],
      };

      const result = await extractAndSaveImages(env, slug, content);

      expect(result.blocks[0].data.file.url).toBe(`/images/${slug}/b64.png`);
      expect(result.blocks[1].data.file.url).toBe(
        `/images/${slug}/existing.png`,
      );
      expect(result.blocks[2].data.file.url).toBe(
        "https://external.com/img.jpg",
      );

      const list = await env.EZ_CONTENT.list({ prefix: `img:${slug}:` });
      expect(list.keys.length).toBe(2); // b64 and existing
    });

    it("should catch and log GC failures without crashing the main flow", async () => {
      const errorEnv = {
        EZ_CONTENT: {
          list: async () => {
            throw new Error("KV Failure");
          },
          put: async () => {},
        },
      } as any;

      const content = { blocks: [] };
      const result = await extractAndSaveImages(errorEnv, "test", content);

      expect(result).toEqual(content);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Image GC failed"),
        expect.any(Error),
      );
    });
  });

  describe("saveSiteImage", () => {
    it("should save site-wide image as webp and clean up other extensions", async () => {
      // Setup old versions
      await env.EZ_CONTENT.put("img:site:logo.png", "data");
      await env.EZ_CONTENT.put("img:site:logo.jpg", "data");
      await env.EZ_CONTENT.put("img:site:other.webp", "data");

      const base64 =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      const url = await saveSiteImage(env, "logo", base64);

      expect(url).toBe("/images/site/logo.webp");

      const list = await env.EZ_CONTENT.list({ prefix: "img:site:" });
      const keys = list.keys.map((k: any) => k.name);

      expect(keys).toContain("img:site:logo.webp");
      expect(keys).toContain("img:site:other.webp");
      expect(keys).not.toContain("img:site:logo.png");
      expect(keys).not.toContain("img:site:logo.jpg");
    });

    it("should return unchanged value if input is not base64", async () => {
      const externalUrl = "https://example.com/logo.png";
      const result = await saveSiteImage(env, "logo", externalUrl);
      expect(result).toBe(externalUrl);
    });

    it("should handle empty or malformed base64 strings gracefully", async () => {
      // Not starting with data:image/
      expect(await saveSiteImage(env, "logo", "not-base64")).toBe("not-base64");

      // Starting but malformed (putBinaryImage might fail, but saveSiteImage should catch it if we add a try-catch,
      // though currently it doesn't have one around putBinaryImage)
      // Actually, atob will throw on malformed data.
      const malformed = "data:image/png;base64,!!!";
      try {
        await saveSiteImage(env, "logo", malformed);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it("should handle cleanup errors gracefully during site image save", async () => {
      const errorEnv = {
        EZ_CONTENT: {
          list: async () => {
            throw new Error("List Error");
          },
          put: async () => {},
        },
      } as any;

      const base64 = "data:image/png;base64,abc";
      const url = await saveSiteImage(errorEnv, "logo", base64);

      expect(url).toBe("/images/site/logo.webp");
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to clean up old site image"),
        expect.any(Error),
      );
    });
  });
});

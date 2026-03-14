import { describe, it, expect, beforeEach } from "bun:test";
import {
  getTheme,
  saveTheme,
  getSite,
  saveSite,
  getNav,
  saveNav,
  getFooter,
  saveFooter,
  getPage,
  savePage,
  publishPage,
  unpublishPage,
  deletePage,
  listPages,
  getOnboardingStatus,
  setOnboardingStatus,
  getInitializedStatus,
  setInitializedStatus,
  getGlobalConfig,
  clearCache,
  KEYS,
  isInternalKey,
  listAllProjectKeys,
  exportAllData,
  importAllData,
  arrayBufferToBase64,
} from "@core/kv";
import {
  createDefaultTheme,
  createDefaultSite,
  createDefaultNav,
  createDefaultFooter,
  createDefaultPage,
} from "@core/factory";
import { KV_PREFIX } from "@core/constants";

// Improved Mock Cloudflare Env object with an in-memory KV
const createMockEnv = () => {
  const store = new Map<string, any>();
  const metadataStore = new Map<string, any>();

  return {
    EZ_CONTENT: {
      get: async (key: string, options?: { type: "json" | "arrayBuffer" }) => {
        const val = store.get(key);
        if (val === undefined) return null;

        if (options?.type === "json") {
          try {
            return typeof val === "string" ? JSON.parse(val) : val;
          } catch (e) {
            return val;
          }
        }
        return val;
      },
      getWithMetadata: async (
        key: string,
        _type: "json" | "text" | "arrayBuffer",
      ) => {
        const val = store.get(key);
        const metadata = metadataStore.get(key);
        return { value: val || null, metadata: metadata || null };
      },
      put: async (key: string, value: any, options?: any) => {
        store.set(key, value);
        if (options?.metadata) {
          metadataStore.set(key, options.metadata);
        }
      },
      delete: async (key: string) => {
        store.delete(key);
        metadataStore.delete(key);
      },
      list: async (options?: { prefix?: string; cursor?: string }) => {
        let keys = Array.from(store.keys());
        if (options?.prefix) {
          keys = keys.filter((k) => k.startsWith(options.prefix!));
        }

        // Simple mock pagination if cursor is provided
        const pageSize = 5;
        const startIdx = options?.cursor ? parseInt(options.cursor) : 0;
        const pageKeys = keys.slice(startIdx, startIdx + pageSize);
        const nextCursor =
          startIdx + pageSize < keys.length
            ? (startIdx + pageSize).toString()
            : undefined;

        return {
          keys: pageKeys.map((k) => ({ name: k })),
          list_complete: !nextCursor,
          cursor: nextCursor,
        };
      },
    },
  } as unknown as Env;
};

describe("KV Core Data Utilities", () => {
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
    clearCache(); // Ensure fresh start for each test
  });

  describe("Mock Helper Coverage", () => {
    it("should cover mock get/put/delete branches", async () => {
      await env.EZ_CONTENT.put("raw", "val");
      expect(await env.EZ_CONTENT.get("raw")).toBe("val");

      await env.EZ_CONTENT.put("json", JSON.stringify({ a: 1 }));
      const parsed = (await env.EZ_CONTENT.get("json", { type: "json" })) as {
        a: number;
      };
      expect(parsed.a).toBe(1);

      await env.EZ_CONTENT.put("bad", "{ invalid }");
      const bad = (await env.EZ_CONTENT.get("bad", { type: "json" })) as string;
      expect(bad).toBe("{ invalid }");

      await env.EZ_CONTENT.delete("raw");
      expect(await env.EZ_CONTENT.get("raw")).toBeNull();
    });
  });

  describe("Theme Management", () => {
    it("should save and retrieve theme with caching", async () => {
      const theme = createDefaultTheme();
      await saveTheme(env, theme);

      // First call fetches from KV
      const retrieved = await getTheme(env);
      expect(retrieved).toEqual(theme);

      // Modify KV directly with VALID schema object to verify cache
      const modifiedTheme = { ...theme, updatedAt: "2026-01-01T00:00:00Z" };
      await env.EZ_CONTENT.put(KEYS.THEME, JSON.stringify(modifiedTheme));

      const cached = await getTheme(env);
      expect(cached).toEqual(theme); // Should still be the cached version

      // Force refresh
      const refreshed = await getTheme(env, true);
      expect(refreshed.updatedAt).toBe("2026-01-01T00:00:00Z");
    });
  });

  describe("Site Configuration", () => {
    it("should save and retrieve site config with caching", async () => {
      const site = createDefaultSite();
      await saveSite(env, site);

      const retrieved = await getSite(env);
      expect(retrieved).toEqual(site);

      // Modify KV directly with VALID schema object
      const modifiedSite = { ...site, title: "Modified Title" };
      await env.EZ_CONTENT.put(KEYS.SITE, JSON.stringify(modifiedSite));

      const cached = await getSite(env);
      expect(cached).toEqual(site);

      const refreshed = await getSite(env, true);
      expect(refreshed.title).toBe("Modified Title");
    });
  });

  describe("Navigation & Footer", () => {
    it("should return defaults if not found", async () => {
      const nav = await getNav(env);
      expect(nav.items).toEqual([{ label: "HOME", path: "/" }]);

      const footer = await getFooter(env);
      expect(footer.links).toEqual([
        { label: "Terms", path: "/terms" },
        { label: "Privacy", path: "/privacy" },
      ]);
    });

    it("should save and retrieve custom nav with caching", async () => {
      const nav = createDefaultNav();
      nav.items.push({ label: "Test", path: "/test" });
      await saveNav(env, nav);

      expect(await getNav(env)).toEqual(nav);
    });

    it("should save and retrieve custom footer with caching", async () => {
      const footer = createDefaultFooter();
      footer.links.push({ label: "Test", path: "/test" });
      await saveFooter(env, footer);

      expect(await getFooter(env)).toEqual(footer);
    });
  });

  describe("System Status", () => {
    it("should return false by default for onboarding", async () => {
      expect(await getOnboardingStatus(env)).toBe(false);
    });

    it("should save and retrieve true status for onboarding", async () => {
      await setOnboardingStatus(env, true);
      expect(await getOnboardingStatus(env)).toBe(true);
    });

    it("should handle false status for onboarding", async () => {
      await setOnboardingStatus(env, false);
      expect(await getOnboardingStatus(env)).toBe(false);
    });

    it("should return false by default for initialization", async () => {
      expect(await getInitializedStatus(env)).toBe(false);
    });

    it("should save and retrieve true status for initialization", async () => {
      await setInitializedStatus(env, true);
      expect(await getInitializedStatus(env)).toBe(true);
    });
  });

  describe("Global Config Helper", () => {
    it("should fetch all configs in parallel", async () => {
      const site = createDefaultSite();
      const theme = createDefaultTheme();
      await saveSite(env, site);
      await saveTheme(env, theme);

      const config = await getGlobalConfig(env);
      expect(config.site).toEqual(site);
      expect(config.theme).toEqual(theme);
      expect(config.seo).toEqual(site.seo);
      expect(config.nav).toBeDefined();
      expect(config.footer).toBeDefined();
    });
  });

  describe("Page Management Lifecycle", () => {
    it("should handle full page lifecycle: save -> list -> publish -> unpublish -> delete", async () => {
      const slug = "test-page";
      const page = createDefaultPage("Test Page", slug);

      // 1. Save as draft
      await savePage(env, page, "draft");
      const drafts = await listPages(env, "draft");
      expect(drafts).toContain(slug);
      expect(await getPage(env, slug, "draft")).toEqual(page);

      // 2. Publish
      const publishResult = await publishPage(env, slug);
      expect(publishResult).toBe(true);

      const livePages = await listPages(env, "live");
      expect(livePages).toContain(slug);
      expect(await listPages(env, "draft")).not.toContain(slug);

      const livePage = await getPage(env, slug, "live");
      expect(livePage?.status).toBe("published");
      expect(livePage?.metadata.publishedAt).toBeDefined();

      // 3. Unpublish
      const unpublishResult = await unpublishPage(env, slug);
      expect(unpublishResult).toBe(true);
      expect(await listPages(env, "live")).not.toContain(slug);
      expect(await listPages(env, "draft")).toContain(slug);

      // 4. Delete
      await deletePage(env, slug);
      expect(await listPages(env, "draft")).not.toContain(slug);
      expect(await getPage(env, slug, "draft")).toBeNull();
    });

    it("should delete associated images when a page is deleted", async () => {
      const slug = "image-page";
      await env.EZ_CONTENT.put(`img:${slug}:1.webp`, "data");
      await env.EZ_CONTENT.put(`img:${slug}:2.webp`, "data");
      await env.EZ_CONTENT.put(`img:other:3.webp`, "data");

      await deletePage(env, slug);

      const images = await env.EZ_CONTENT.list({ prefix: `img:${slug}:` });
      expect(images.keys.length).toBe(0);

      const otherImages = await env.EZ_CONTENT.list({ prefix: `img:other:` });
      expect(otherImages.keys.length).toBe(1);
    });

    it("should return false when publishing/unpublishing non-existent page", async () => {
      expect(await publishPage(env, "missing")).toBe(false);
      expect(await unpublishPage(env, "missing")).toBe(false);
    });
  });

  describe("Backup & Restore", () => {
    it("isInternalKey should correctly identify internal keys", () => {
      expect(isInternalKey(KV_PREFIX.SESSION + "abc")).toBe(true);
      expect(isInternalKey(KV_PREFIX.RATE_LIMIT + "127.0.0.1")).toBe(true);
      expect(isInternalKey("system:initialized")).toBe(true);
      expect(isInternalKey("page:live:index")).toBe(false);
    });

    it("listAllProjectKeys should exclude internal keys and handle pagination", async () => {
      // 1. Add some keys
      await env.EZ_CONTENT.put("config:theme", "{}");
      await env.EZ_CONTENT.put("config:site", "{}");
      await env.EZ_CONTENT.put("page:live:index", "{}");
      await env.EZ_CONTENT.put(KV_PREFIX.SESSION + "abc", "1"); // Should be excluded
      await env.EZ_CONTENT.put(KV_PREFIX.RATE_LIMIT + "127.0.0.1", "1"); // Should be excluded

      // Add more to force pagination (mock page size is 5)
      for (let i = 0; i < 10; i++) {
        await env.EZ_CONTENT.put(`extra:${i}`, "{}");
      }

      const keys = await listAllProjectKeys(env);
      expect(keys).toContain("config:theme");
      expect(keys).toContain("config:site");
      expect(keys).toContain("page:live:index");
      expect(keys).not.toContain(KV_PREFIX.SESSION + "abc");
      expect(keys).not.toContain(KV_PREFIX.RATE_LIMIT + "127.0.0.1");
      expect(keys.length).toBe(13); // 3 original + 10 extra
    });

    it("exportAllData should return non-internal data and handle images", async () => {
      const themeData = { primary: "blue" };
      await env.EZ_CONTENT.put("config:theme", JSON.stringify(themeData));

      // Mock an image
      const imageBuffer = new TextEncoder().encode("fake-image").buffer;
      await env.EZ_CONTENT.put("img:test:pic.webp", imageBuffer, {
        metadata: { contentType: "image/webp" },
      });

      const exportData = await exportAllData(env);
      expect(exportData["config:theme"]).toEqual(themeData);
      expect(exportData["img:test:pic.webp"]).toContain(
        "data:image/webp;base64,",
      );
    });

    it("importAllData should clear old data and import new data including images", async () => {
      // 1. Setup initial data
      await env.EZ_CONTENT.put("old:key", "{}");
      await env.EZ_CONTENT.put("system:initialized", "true"); // Should NOT be cleared

      // 2. Data to import
      const imageData = "data:image/png;base64,ZmFrZS1pbWFnZQ=="; // "fake-image" in base64
      const newData = {
        "config:theme": {
          schemaVersion: "1.0.0",
          updatedAt: new Date().toISOString(),
          values: { primary_hue: 200 },
        },
        "img:new:pic.png": imageData,
      };

      const count = await importAllData(env, newData);
      expect(count).toBe(2);

      // 3. Verify state
      expect(await env.EZ_CONTENT.get("old:key")).toBeNull();
      expect(await env.EZ_CONTENT.get("system:initialized")).toBe("true");

      const importedTheme = (await env.EZ_CONTENT.get("config:theme", {
        type: "json",
      })) as any;
      expect(importedTheme.values.primary_hue).toBe(200);

      const { value, metadata } = (await env.EZ_CONTENT.getWithMetadata(
        "img:new:pic.png",
        "arrayBuffer",
      )) as any;
      expect(value).toBeDefined();
      expect(metadata.contentType).toBe("image/png");
    });

    it("arrayBufferToBase64 should convert buffer to base64", () => {
      const buffer = new TextEncoder().encode("hello").buffer;
      const b64 = arrayBufferToBase64(buffer);
      expect(b64).toBe(btoa("hello"));
    });
  });

  describe("System Defaults", () => {
    it("ensureSystemDefaults should populate missing configs", async () => {
      const {
        ensureSystemDefaults,
        getTheme,
        getSite,
        getNav,
        getFooter,
        getInitializedStatus,
      } = await import("@core/kv");

      expect(await getInitializedStatus(env)).toBe(false);

      await ensureSystemDefaults(env);

      expect(await getInitializedStatus(env)).toBe(true);
      expect(await getTheme(env)).toBeDefined();
      expect(await getSite(env)).toBeDefined();
      expect(await getNav(env)).toBeDefined();
      expect(await getFooter(env)).toBeDefined();

      // Ensure it doesn't run again if already initialized
      await env.EZ_CONTENT.delete(KEYS.THEME);
      await ensureSystemDefaults(env);
      expect(await env.EZ_CONTENT.get(KEYS.THEME)).toBeNull();
    });
  });
});

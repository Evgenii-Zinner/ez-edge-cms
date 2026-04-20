import { describe, it, expect, beforeEach, spyOn } from "bun:test";
import {
  getTheme,
  saveTheme,
  getSite,
  saveSite,
  getNav,
  saveNav,
  getFooter,
  getPage,
  savePage,
  publishPage,
  unpublishPage,
  deletePage,
  listPages,
  getInitializedStatus,
  getGlobalConfig,
  clearCache,
  KEYS,
  isInternalKey,
  listAllProjectKeys,
  exportAllData,
  importAllData,
  arrayBufferToBase64,
  ensureSystemDefaults,
} from "@core/kv";
import {
  createDefaultTheme,
  createDefaultSite,
  createDefaultNav,
  createDefaultPage,
} from "@core/factory";
import { KV_PREFIX } from "@core/constants";

/**
 * World-Class Mock for Cloudflare Workers KV.
 * Simulates metadata, various return types (json, arrayBuffer, text),
 * and basic pagination for the list operation.
 */
const createMockEnv = () => {
  const store = new Map<string, { value: any; metadata?: any }>();

  return {
    EZ_CONTENT: {
      get: async (
        key: string,
        options?: { type: "json" | "arrayBuffer" | "text" | "stream" },
      ) => {
        const entry = store.get(key);
        if (!entry) return null;

        const val = entry.value;

        if (options?.type === "json") {
          if (
            typeof val === "object" &&
            !(val instanceof ArrayBuffer) &&
            !(val instanceof Uint8Array)
          ) {
            return val;
          }
          try {
            return JSON.parse(val.toString());
          } catch {
            return val;
          }
        }

        if (options?.type === "arrayBuffer") {
          if (val instanceof ArrayBuffer) return val;
          if (val instanceof Uint8Array) return val.buffer;
          return new TextEncoder().encode(val.toString()).buffer;
        }

        return val;
      },
      getWithMetadata: async (key: string, type?: string) => {
        const entry = store.get(key);
        if (!entry) return { value: null, metadata: null };

        // Use the mock's own get logic for the value
        const value = await (env.EZ_CONTENT as any).get(key, { type });
        return { value, metadata: entry.metadata || null };
      },
      put: async (key: string, value: any, options?: { metadata?: any }) => {
        store.set(key, { value, metadata: options?.metadata });
      },
      delete: async (key: string) => {
        store.delete(key);
      },
      list: async (options?: {
        prefix?: string;
        cursor?: string;
        limit?: number;
      }) => {
        let keys = Array.from(store.keys()).sort();
        if (options?.prefix) {
          keys = keys.filter((k) => k.startsWith(options.prefix!));
        }

        const pageSize = options?.limit || 5;
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
  } as any;
};

let env: any;

describe("KV Core Data Utilities", () => {
  beforeEach(() => {
    env = createMockEnv();
    clearCache();
    // Silence console for cleaner output while allowing error verification if needed
    spyOn(console, "error").mockImplementation(() => {});
    spyOn(console, "log").mockImplementation(() => {});
  });

  describe("Theme & Site Caching Architecture", () => {
    it("should serve theme from isolate-level cache after first KV fetch", async () => {
      const theme = createDefaultTheme();
      await saveTheme(env, theme);

      // 1. Initial Fetch
      const first = await getTheme(env);
      expect(first).toEqual(theme);

      // 2. Poison KV with VALID schema object to verify cache usage
      const poisonedTheme = {
        ...theme,
        values: { ...theme.values, primary_hue: 200 },
      };
      await env.EZ_CONTENT.put(KEYS.THEME, JSON.stringify(poisonedTheme));

      const cached = await getTheme(env);
      expect(cached).toEqual(theme); // Still the original theme
      expect(cached.values.primary_hue).not.toBe(200);

      // 3. Force Refresh should bypass cache
      const refreshed = await getTheme(env, true);
      expect(refreshed.values.primary_hue).toBe(200);
    });

    it("should handle cache eviction for site configuration", async () => {
      const site = createDefaultSite();
      await saveSite(env, site);

      expect(await getSite(env)).toEqual(site);

      // Manual cache clear (simulating isolate reboot or update)
      clearCache();

      const newSite = { ...site, title: "Rebooted" };
      await env.EZ_CONTENT.put(KEYS.SITE, JSON.stringify(newSite));

      expect((await getSite(env)).title).toBe("Rebooted");
    });
  });

  describe("Navigation & Footer Persistence", () => {
    it("should fall back to hardcoded factory defaults when KV is empty", async () => {
      const nav = await getNav(env);
      const footer = await getFooter(env);

      expect(nav.items).toContainEqual({ label: "HOME", path: "/" });
      expect(footer.links).toContainEqual({ label: "Terms", path: "/terms" });
    });

    it("should persist and retrieve complex navigation structures", async () => {
      const customNav = createDefaultNav();
      customNav.items.push({ label: "BLOG", path: "/blog" });
      await saveNav(env, customNav);

      const retrieved = await getNav(env, true);
      expect(retrieved.items.length).toBe(2);
      expect(retrieved.items[1].label).toBe("BLOG");
    });
  });

  describe("Page Lifecycle & Integrity", () => {
    it("should perform atomicity-simulated publication from draft to live", async () => {
      const slug = "meaningful-test";
      const page = createDefaultPage("Unit Test", slug);

      await savePage(env, page, "draft");
      expect(await listPages(env, "draft")).toContain(slug);

      const success = await publishPage(env, slug);
      expect(success).toBe(true);

      const live = await getPage(env, slug, "live");
      expect(live?.status).toBe("published");
      expect(live?.metadata.publishedAt).toBeDefined();

      // Localized date check (meaningful coverage)
      const date = new Date(live!.metadata.publishedAt!);
      expect(date.getFullYear()).toBeGreaterThanOrEqual(2024);

      // Draft should be cleaned up
      expect(await listPages(env, "draft")).not.toContain(slug);
    });

    it("should unpublish a live page, reverting it to draft state", async () => {
      const slug = "unpublish-test";
      await savePage(env, createDefaultPage("Live", slug), "live");

      const success = await unpublishPage(env, slug);
      expect(success).toBe(true);

      expect(await listPages(env, "live")).not.toContain(slug);
      expect(await listPages(env, "draft")).toContain(slug);
      expect((await getPage(env, slug, "draft"))?.status).toBe("draft");
    });

    it("should cascade-delete all page-specific images upon page deletion", async () => {
      const slug = "cleanup-page";
      await env.EZ_CONTENT.put(`img:${slug}:header.png`, "bin");
      await env.EZ_CONTENT.put(`img:${slug}:footer.webp`, "bin");
      await env.EZ_CONTENT.put(`img:other:logo.png`, "bin");

      await deletePage(env, slug);

      const list = await env.EZ_CONTENT.list({ prefix: `img:${slug}:` });
      expect(list.keys.length).toBe(0);

      const other = await env.EZ_CONTENT.list({ prefix: `img:other:` });
      expect(other.keys.length).toBe(1);
    });
  });

  describe("Backup, Restore & Migration", () => {
    it("should correctly distinguish internal system keys from project data", () => {
      expect(isInternalKey("system:onboarding_complete")).toBe(true);
      expect(isInternalKey(KV_PREFIX.SESSION + "token")).toBe(true);
      expect(isInternalKey("page:draft:about")).toBe(false);
      expect(isInternalKey("config:site")).toBe(false);
    });

    it("should correctly list all project keys with pagination", async () => {
      // Add more than 5 items to trigger mock pagination (pageSize = 5 in createMockEnv)
      for (let i = 0; i < 12; i++) {
        await env.EZ_CONTENT.put(`project:key:${i}`, "value");
      }
      // Add some internal keys that should be filtered out
      await env.EZ_CONTENT.put("system:test", "internal");
      await env.EZ_CONTENT.put(KV_PREFIX.SESSION + "abc", "internal");

      const keys = await listAllProjectKeys(env);
      expect(keys.length).toBe(12);
      expect(keys).toContain("project:key:0");
      expect(keys).toContain("project:key:11");
      expect(keys).not.toContain("system:test");
    });

    it("should convert ArrayBuffer to Base64 string correctly", () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer; // "Hello"
      const base64 = arrayBufferToBase64(buffer);
      expect(base64).toBe("SGVsbG8=");
    });

    it("should export binary images as Base64 Data URIs", async () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer; // "Hello"
      await env.EZ_CONTENT.put("img:test:pic.png", buffer, {
        metadata: { contentType: "image/png" },
      });

      const exportData = await exportAllData(env);
      expect(exportData["img:test:pic.png"]).toBe(
        "data:image/png;base64,SGVsbG8=",
      );
    });

    it("should perform a full 'nuclear' restore (clearing old data except internals)", async () => {
      // 1. Setup stale data
      await env.EZ_CONTENT.put("old:page", "{}");
      await env.EZ_CONTENT.put("system:admin_user", "preserve");

      // 2. Import new set with VALID data (so it doesn't fall back to defaults)
      const validSite = createDefaultSite();
      validSite.title = "New Site";
      const payload = {
        "config:site": validSite,
        "img:logo.png": "data:image/png;base64,SGVsbG8=",
      };

      const importedCount = await importAllData(env, payload);
      expect(importedCount).toBe(2);

      // 3. Verify cleanup and injection
      expect(await env.EZ_CONTENT.get("old:page")).toBeNull();
      expect(await env.EZ_CONTENT.get("system:admin_user")).toBe("preserve");
      expect((await getSite(env, true)).title).toBe("New Site");

      const { value, metadata } = await env.EZ_CONTENT.getWithMetadata(
        "img:logo.png",
        "arrayBuffer",
      );
      expect(value).toBeInstanceOf(ArrayBuffer);
      expect(metadata.contentType).toBe("image/png");
    });
  });

  describe("System Bootstrapping", () => {
    it("ensureSystemDefaults should only populate if the system is uninitialized", async () => {
      // Initial state
      expect(await getInitializedStatus(env)).toBe(false);

      await ensureSystemDefaults(env);
      expect(await getInitializedStatus(env)).toBe(true);

      const theme = await getTheme(env);
      expect(theme.schemaVersion).toBeDefined();

      // Tamper with KV
      await env.EZ_CONTENT.delete(KEYS.THEME);

      // Run again - should NOT re-populate because initialized flag is true
      await ensureSystemDefaults(env);
      const missing = await env.EZ_CONTENT.get(KEYS.THEME);
      expect(missing).toBeNull();
    });
  });

  describe("Edge Case & Error Handling", () => {
    it("getGlobalConfig should handle partially missing data by returning defaults", async () => {
      // Empty KV
      const config = await getGlobalConfig(env);
      expect(config.site).toBeDefined();
      expect(config.theme).toBeDefined();
      expect(config.site.title).toBe("My Awesome Website");
    });

    it("listPages should return an empty array if no indexes exist", async () => {
      const pages = await listPages(env, "live");
      expect(pages).toBeInstanceOf(Array);
      expect(pages.length).toBe(0);
    });
  });
});

import { describe, it, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
import filesAdmin from "@routes/admin/files/index";
import { injectGlobalConfig, GlobalConfigVariables } from "@core/middleware";
import { saveTheme, saveSite, saveNav, saveFooter, clearCache } from "@core/kv";
import {
  createDefaultTheme,
  createDefaultSite,
  createDefaultNav,
  createDefaultFooter,
} from "@core/factory";

/**
 * Mock Environment Factory
 */
const createMockEnv = () => {
  const store = new Map<string, string>();
  return {
    EZ_CONTENT: {
      get: async (key: string, options?: { type: "json" | "text" }) => {
        const val = store.get(key);
        if (val === undefined) return null;
        if (options?.type === "json") return JSON.parse(val);
        return val;
      },
      put: async (key: string, value: string) => {
        store.set(key, value);
      },
    },
  } as unknown as Env;
};

describe("Admin Files Route", () => {
  let env: Env;
  let app: Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>;

  beforeEach(async () => {
    env = createMockEnv();
    clearCache();

    // Setup basic site data required by middleware
    await saveTheme(env, createDefaultTheme());
    await saveSite(env, {
      ...createDefaultSite(),
      txtFiles: {
        robots: "User-agent: *\nAllow: /",
        llms: "Custom LLM Info",
        humans: "Custom Human Info",
        ads: "google.com, pub-123, DIRECT",
      },
    });
    await saveNav(env, createDefaultNav());
    await saveFooter(env, createDefaultFooter());

    app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();
    app.use("*", injectGlobalConfig());
    app.route("/admin/files", filesAdmin);
  });

  describe("GET /admin/files", () => {
    it("should render the text files manager with existing content", async () => {
      const res = await app.request("/admin/files", {}, env);
      expect(res.status).toBe(200);
      const html = await res.text();

      expect(html).toContain("Text Files Manager");
      expect(html).toContain("User-agent: *\nAllow: /"); // Check textarea values
      expect(html).toContain("Custom LLM Info");
      expect(html).toContain("Custom Human Info");
      expect(html).toContain("google.com, pub-123, DIRECT");
    });

    it("should handle missing txtFiles in site config", async () => {
      const site = createDefaultSite();
      delete (site as any).txtFiles;
      await saveSite(env, site);
      clearCache();

      const res = await app.request("/admin/files", {}, env);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("Text Files Manager");
    });
  });

  describe("POST /admin/files/save", () => {
    it("should update text files in KV", async () => {
      const formData = new FormData();
      formData.append("txtFiles.robots", "User-agent: Googlebot\nDisallow: /");
      formData.append("txtFiles.llms", "Updated LLM Content");

      const res = await app.request(
        "/admin/files/save",
        {
          method: "POST",
          body: formData,
        },
        env,
      );

      expect(res.status).toBe(200);
      const toast = await res.text();
      expect(toast).toContain("TEXT FILES UPDATED");

      // Verify KV state directly
      const siteRes = await app.request("/admin/files", {}, env);
      const html = await siteRes.text();
      expect(html).toContain("User-agent: Googlebot\nDisallow: /");
      expect(html).toContain("Updated LLM Content");
    });
  });

  describe("POST /admin/files/reset", () => {
    it("should reset files to factory defaults and redirect", async () => {
      const res = await app.request(
        "/admin/files/reset",
        {
          method: "POST",
        },
        env,
      );

      expect(res.status).toBe(200);
      expect(res.headers.get("HX-Redirect")).toBe("/admin/files");

      const body = await res.text();
      expect(body).toContain("Files reset to defaults");
    });
  });
});

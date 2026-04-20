import { describe, it, expect, beforeEach, spyOn } from "bun:test";
import { Hono } from "hono";
import {
  injectGlobalConfig,
  GlobalConfigVariables,
} from "../../src/core/middleware";
import { injectUnoCSS } from "../../src/core/unocss-middleware";
import {
  saveTheme,
  saveSite,
  saveNav,
  saveFooter,
  clearCache,
} from "../../src/core/kv";
import {
  createDefaultTheme,
  createDefaultSite,
  createDefaultNav,
  createDefaultFooter,
} from "../../src/core/factory";

/**
 * Enhanced Mock Cloudflare Env object for middleware testing.
 */
const createMockEnv = () => {
  const store = new Map<string, any>();
  return {
    EZ_CONTENT: {
      get: async (key: string, options?: { type: "json" }) => {
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
      put: async (key: string, value: any) => {
        store.set(key, value);
      },
      delete: async (key: string) => {
        store.delete(key);
      },
    },
  } as any;
};

describe("Middlewares", () => {
  let env: any;

  beforeEach(() => {
    env = createMockEnv();
    clearCache();
    // Silence console for clean output
    spyOn(console, "error").mockImplementation(() => {});
    spyOn(console, "log").mockImplementation(() => {});
  });

  describe("injectGlobalConfig", () => {
    it("should inject all core configurations and SEO into the context on GET", async () => {
      // Initialize KV with defaults
      await saveTheme(env, createDefaultTheme());
      await saveSite(env, createDefaultSite());
      await saveNav(env, createDefaultNav());
      await saveFooter(env, createDefaultFooter());

      const app = new Hono<{
        Bindings: Env;
        Variables: GlobalConfigVariables;
      }>();
      app.use("*", injectGlobalConfig());
      app.get("/test", (c) => {
        const theme = c.get("theme");
        const site = c.get("site");
        const seo = c.get("seo");
        const nav = c.get("nav");
        const footer = c.get("footer");
        
        return c.json({ 
          hasTheme: !!theme, 
          hasSite: !!site, 
          hasSeo: !!seo,
          hasNav: !!nav,
          hasFooter: !!footer,
          seoMatches: seo === site.seo
        });
      });

      const res = await app.request("/test", {}, env);
      const data = await res.json() as any;

      expect(data.hasTheme).toBe(true);
      expect(data.hasSite).toBe(true);
      expect(data.hasSeo).toBe(true);
      expect(data.hasNav).toBe(true);
      expect(data.hasFooter).toBe(true);
      expect(data.seoMatches).toBe(true);
    });

    it("should skip injection for static assets and API routes", async () => {
      const app = new Hono<{
        Bindings: Env;
        Variables: GlobalConfigVariables;
      }>();
      app.use("*", injectGlobalConfig());
      
      const checkInjection = (c: any) => c.json({ hasTheme: !!c.get("theme") });
      app.get("/static/style.css", checkInjection);
      app.get("/api/v1/health", checkInjection);

      const resStatic = await app.request("/static/style.css", {}, env);
      const resApi = await app.request("/api/v1/health", {}, env);

      expect((await resStatic.json() as any).hasTheme).toBe(false);
      expect((await resApi.json() as any).hasTheme).toBe(false);
    });

    it("should skip injection for non-GET public requests", async () => {
      const app = new Hono<{
        Bindings: Env;
        Variables: GlobalConfigVariables;
      }>();
      app.use("*", injectGlobalConfig());
      app.post("/contact", (c) => c.json({ hasTheme: !!c.get("theme") }));

      const res = await app.request("/contact", { method: "POST" }, env);
      expect((await res.json() as any).hasTheme).toBe(false);
    });

    it("should ALWAYS inject for Admin mutations (POST/PUT/DELETE) for UI consistency", async () => {
      await saveTheme(env, createDefaultTheme());
      await saveSite(env, createDefaultSite());

      const app = new Hono<{
        Bindings: Env;
        Variables: GlobalConfigVariables;
      }>();
      app.use("*", injectGlobalConfig());
      app.post("/admin/pages/save/index", (c) => c.json({ hasTheme: !!c.get("theme") }));

      const res = await app.request("/admin/pages/save/index", { method: "POST" }, env);
      expect((await res.json() as any).hasTheme).toBe(true);
    });

    it("should fall back to defaults if KV is empty during injection", async () => {
      const app = new Hono<{
        Bindings: Env;
        Variables: GlobalConfigVariables;
      }>();
      app.use("*", injectGlobalConfig());
      app.get("/test", (c) => c.json({ siteTitle: c.get("site").title }));

      const res = await app.request("/test", {}, env);
      const data = await res.json() as any;
      // Should return factory default title if KV is empty
      expect(data.siteTitle).toBe("My Awesome Website");
    });
  });

  describe("injectUnoCSS", () => {
    it("should inject style tags into outgoing HTML responses", async () => {
      const app = new Hono();
      app.use("*", injectUnoCSS());
      app.get("/test", (c) => c.html(`<html><head></head><body><div class="p-4 text-red">Test</div></body></html>`));

      const res = await app.request("/test");
      const html = await res.text();

      expect(html).toContain('<style id="ez-unocss">');
      expect(html).toContain(".p-4");
      expect(html).toContain(".text-red");
    });

    it("should handle HTMX fragments by appending style tags instead of head injection", async () => {
      const app = new Hono();
      app.use("*", injectUnoCSS());
      app.get("/fragment", (c) => {
        c.header("Content-Type", "text/html");
        return c.body(`<div class="m-2">HTMX Fragment</div>`);
      });

      const res = await app.request("/fragment", {
        headers: { "HX-Request": "true" }
      });
      const html = await res.text();

      expect(html).toContain('<style id="ez-unocss">');
      expect(html).toContain(".m-2");
      // Fragments shouldn't have <html> or <head> added by the middleware
      expect(html).not.toContain("<html>");
    });

    it("should inject editor-specific classes if isEditor flag is set", async () => {
      const app = new Hono();
      app.use("*", injectUnoCSS());
      app.get("/editor", (c) => {
        c.set("isEditor" as any, true);
        return c.html(`<div class="editor-shell">Editor</div>`);
      });

      const res = await app.request("/editor");
      const html = await res.text();
      
      // Verification logic: renderWithUno handles the isEditor flag
      expect(html).toContain('<style id="ez-unocss">');
    });

    it("should preserve original response headers except Content-Length", async () => {
      const app = new Hono();
      app.use("*", injectUnoCSS());
      app.get("/headers", (c) => {
        c.header("X-Custom", "preserved");
        return c.html("<div>Test</div>");
      });

      const res = await app.request("/headers");
      expect(res.headers.get("X-Custom")).toBe("preserved");
      expect(res.headers.get("Content-Type")).toContain("text/html");
      // Content-Length should be deleted because the body size changed
      expect(res.headers.get("Content-Length")).toBeNull();
    });

    it("should skip UnoCSS processing for non-HTML Content-Types", async () => {
      const app = new Hono();
      app.use("*", injectUnoCSS());
      app.get("/json", (c) => c.json({ status: "ok" }));

      const res = await app.request("/json");
      const text = await res.text();
      expect(text).toBe('{"status":"ok"}');
      expect(text).not.toContain("<style");
    });
  });
});

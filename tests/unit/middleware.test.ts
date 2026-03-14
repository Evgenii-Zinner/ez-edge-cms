import { describe, it, expect } from "bun:test";
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
 * Standardized Mock Cloudflare Env object for middleware testing.
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
  } as unknown as Env;
};

describe("Middlewares", () => {
  describe("injectGlobalConfig", () => {
    it("should inject configurations into the context", async () => {
      const env = createMockEnv();
      clearCache();

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
        return c.json({ themeExists: !!theme, siteExists: !!site });
      });

      const res = await app.request("/test", {}, env);
      const data = (await res.json()) as {
        themeExists: boolean;
        siteExists: boolean;
      };

      expect(data.themeExists).toBe(true);
      expect(data.siteExists).toBe(true);
    });

    it("should skip injection for static assets", async () => {
      const env = createMockEnv();
      const app = new Hono<{
        Bindings: Env;
        Variables: GlobalConfigVariables;
      }>();
      app.use("*", injectGlobalConfig());
      app.get("/static/test.css", (c) => {
        const theme = c.get("theme");
        return c.json({ themeExists: !!theme });
      });

      const res = await app.request("/static/test.css", {}, env);
      const data = (await res.json()) as { themeExists: boolean };
      expect(data.themeExists).toBe(false);
    });

    it("should skip injection for non-GET requests", async () => {
      const env = createMockEnv();
      const app = new Hono<{
        Bindings: Env;
        Variables: GlobalConfigVariables;
      }>();
      app.use("*", injectGlobalConfig());
      app.post("/test", (c) => {
        const theme = c.get("theme");
        return c.json({ themeExists: !!theme });
      });

      const res = await app.request("/test", { method: "POST" }, env);
      const data = (await res.json()) as { themeExists: boolean };
      expect(data.themeExists).toBe(false);
    });

    it("should handle raw (non-json) KV access in mock helper", async () => {
      const env = createMockEnv();
      await env.EZ_CONTENT.put("raw_key", "raw_value");
      const val = await env.EZ_CONTENT.get("raw_key");
      expect(val).toBe("raw_value");

      // Cover JSON parsing branches
      await env.EZ_CONTENT.put("json_key", JSON.stringify({ a: 1 }));
      const parsed = (await env.EZ_CONTENT.get("json_key", {
        type: "json",
      })) as { a: number };
      expect(parsed.a).toBe(1);

      // Cover JSON error branch
      await env.EZ_CONTENT.put("bad_json", "{ invalid }");
      const bad = (await env.EZ_CONTENT.get("bad_json", {
        type: "json",
      })) as string;
      expect(bad).toBe("{ invalid }");

      await env.EZ_CONTENT.delete("raw_key");
      const deleted = await env.EZ_CONTENT.get("raw_key");
      expect(deleted).toBeNull();

      const missing = await env.EZ_CONTENT.get("missing");
      expect(missing).toBeNull();
    });
  });

  describe("injectUnoCSS", () => {
    it("should inject UnoCSS into HTML responses", async () => {
      const env = createMockEnv();
      const app = new Hono<{ Bindings: Env }>();

      app.use("*", injectUnoCSS());
      app.get("/html", (c) => {
        return c.html(
          `<html><head><!-- CSS_INJECTION_POINT --></head><body><div class="p-10">Test</div></body></html>`,
        );
      });

      const res = await app.request("/html", {}, env);
      const html = await res.text();

      expect(html).toContain('<style id="ez-unocss">');
      expect(html).toContain(".p-10");
    });

    it("should not inject UnoCSS into non-HTML responses", async () => {
      const env = createMockEnv();
      const app = new Hono<{ Bindings: Env }>();

      app.use("*", injectUnoCSS());
      app.get("/json", (c) => {
        return c.json({ data: "no html" });
      });

      const res = await app.request("/json", {}, env);
      const json = await res.text();

      expect(json).not.toContain('<style id="ez-unocss">');
      expect(json).toBe('{"data":"no html"}');
    });
  });
});

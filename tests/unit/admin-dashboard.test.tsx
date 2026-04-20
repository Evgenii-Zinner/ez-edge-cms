import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import dashboard from "@routes/admin/dashboard";
import { GlobalConfigVariables } from "@core/middleware";
import { createDefaultTheme, createDefaultSite } from "@core/factory";
import { cache } from "@core/kv/base";

/**
 * Tests for the Administrative Dashboard.
 */
describe("Admin Dashboard Routes", () => {
  const setupApp = () => {
    const app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();
    app.use("*", async (c, next) => {
      const site = createDefaultSite();
      c.set("theme", createDefaultTheme());
      c.set("site", site);
      c.set("seo", site.seo);
      await next();
    });
    app.route("/admin", dashboard);
    return app;
  };

  const mockEnv = (overrides: any = {}) =>
    ({
      EZ_CONTENT: {
        get: async () => null,
        put: async () => {},
        delete: async () => {},
        ...overrides,
      },
    }) as any;

  it("GET / should render the dashboard with accurate stats for live and draft pages", async () => {
    const app = setupApp();
    const res = await app.request(
      "http://localhost/admin",
      { method: "GET" },
      mockEnv({
        get: async (key: string) => {
          if (key === "list:pages:live") return ["page1", "page2"];
          if (key === "list:pages:draft") return ["draft1", "draft2", "draft3"];
          return null;
        },
      }),
    );

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("DASHBOARD");
    expect(html).toContain("Live Pages: 2");
    expect(html).toContain("Drafts: 3");
  });

  it("POST /clear-cache should purge isolate-level cache and return success", async () => {
    const app = setupApp();

    // Pre-populate cache to verify it gets cleared
    cache.theme = createDefaultTheme();
    expect(cache.theme).not.toBeNull();

    const res = await app.request(
      "http://localhost/admin/clear-cache",
      { method: "POST" },
      mockEnv(),
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toContain("CACHE PURGED");
    expect(cache.theme).toBeNull();
  });

  it("GET /check-update should show update notice when a newer version exists on GitHub", async () => {
    const app = setupApp();
    const originalFetch = global.fetch;

    // Mock GitHub API to return a version significantly higher than current
    global.fetch = async () =>
      new Response(JSON.stringify([{ name: "v99.0.0" }]), { status: 200 });

    const res = await app.request(
      "http://localhost/admin/check-update",
      { method: "GET" },
      mockEnv(),
    );

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("NEW VERSION AVAILABLE: 99.0.0");
    expect(html).toContain("HOW TO UPDATE");

    global.fetch = originalFetch;
  });

  it("GET /check-update should return empty response when versions are identical", async () => {
    const app = setupApp();
    const originalFetch = global.fetch;
    const { APP_VERSION } = await import("@core/constants");

    global.fetch = async () =>
      new Response(JSON.stringify([{ name: `v${APP_VERSION}` }]), {
        status: 200,
      });

    const res = await app.request(
      "http://localhost/admin/check-update",
      { method: "GET" },
      mockEnv(),
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("");
    global.fetch = originalFetch;
  });

  it("GET /check-update should handle various failure scenarios gracefully", async () => {
    const app = setupApp();
    const originalFetch = global.fetch;
    const originalConsoleError = console.error;
    console.error = () => {}; // Silence console error for expected failures

    // 1. HTTP Error (e.g., 500 Internal Server Error)
    global.fetch = async () => new Response("Error", { status: 500 });
    let res = await app.request("http://localhost/admin/check-update", { method: "GET" }, mockEnv());
    expect(await res.text()).toBe("");

    // 2. Empty or invalid JSON response
    global.fetch = async () => new Response("[]", { status: 200 });
    res = await app.request("http://localhost/admin/check-update", { method: "GET" }, mockEnv());
    expect(await res.text()).toBe("");

    // 3. Network-level exception (e.g., DNS failure)
    global.fetch = async () => { throw new Error("DNS Lookup Failed"); };
    res = await app.request("http://localhost/admin/check-update", { method: "GET" }, mockEnv());
    expect(await res.text()).toBe("");

    global.fetch = originalFetch;
    console.error = originalConsoleError;
  });
});

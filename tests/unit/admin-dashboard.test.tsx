import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import dashboard from "@routes/admin/dashboard";
import { GlobalConfigVariables } from "@core/middleware";
import { createDefaultTheme, createDefaultSite } from "@core/factory";

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

  it("GET / should render the dashboard with stats", async () => {
    const app = setupApp();
    const res = await app.request(
      "http://localhost/admin",
      { method: "GET" },
      mockEnv({
        get: async (key: string) => {
          if (key.includes("list:pages")) return ["item1", "item2"];
          return null;
        },
      }),
    );

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("DASHBOARD");
    expect(html).toContain("Live Pages");
    expect(html).toContain("2");
  });

  it("POST /clear-cache should return success message", async () => {
    const app = setupApp();
    const res = await app.request(
      "http://localhost/admin/clear-cache",
      { method: "POST" },
      mockEnv(),
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toContain("CACHE PURGED");
  });

  it("GET /check-update should handle update check", async () => {
    const app = setupApp();
    const res = await app.request(
      "http://localhost/admin/check-update",
      { method: "GET" },
      mockEnv(),
    );

    expect(res.status).toBe(200);
  });
});

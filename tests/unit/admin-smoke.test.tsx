import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import admin from "@routes/admin/index";
import { GlobalConfigVariables } from "@core/middleware";
import {
  createDefaultTheme,
  createDefaultSite,
  createDefaultNav,
  createDefaultFooter,
} from "@core/factory";

/**
 * Smoke Tests for the Global Administrative Router.
 * These tests ensure that the main admin entry point and all its mounted sub-routes
 * are correctly exported, imported, and can be initialized without runtime errors.
 */
describe("Admin Router Smoke Tests", () => {
  const setupApp = () => {
    const app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();
    app.use("*", async (c, next) => {
      const site = createDefaultSite();
      c.set("theme", createDefaultTheme());
      c.set("site", site);
      c.set("nav", createDefaultNav());
      c.set("footer", createDefaultFooter());
      c.set("seo", site.seo);
      await next();
    });
    app.route("/admin", admin);
    return app;
  };

  /**
   * Verifies that the primary admin entry point loads correctly.
   * This is a critical test for catching module-level ReferenceErrors.
   */
  it("should initialize the admin app without crashing", () => {
    const app = setupApp();
    expect(app).toBeDefined();
  });

  /**
   * Tests the accessibility of primary administrative routes.
   * Note: These requests will hit the security middleware (session checks),
   * so we expect redirects to /admin/setup or /admin/login.
   */
  const routes = [
    "/admin",
    "/admin/pages",
    "/admin/theme",
    "/admin/site",
    "/admin/navigation",
    "/admin/files",
  ];

  routes.forEach((route) => {
    it(`should handle request to ${route} (auth redirect check)`, async () => {
      const app = setupApp();
      const res = await app.request(
        `http://localhost${route}`,
        { method: "GET" },
        {
          EZ_CONTENT: {
            get: async () => null,
          },
        } as any,
      );

      // We expect a redirect (302) because no session is provided in this smoke test.
      // If there was a ReferenceError in any sub-route, this would return 500 or crash.
      expect([302, 303]).toContain(res.status);
      expect(res.headers.get("Location")).toMatch(/\/admin\/(setup|login)/);
    });
  });

  /**
   * Verifies that public auth routes are accessible without a session.
   */
  it("should render the setup page when no admin exists", async () => {
    const app = setupApp();
    const res = await app.request(
      "http://localhost/admin/setup",
      { method: "GET" },
      {
        EZ_CONTENT: {
          get: async (key: string) => (key === "auth:admin" ? null : null),
        },
      } as any,
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toContain("INITIAL SETUP");
  });
});

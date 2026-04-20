import { describe, it, expect, beforeAll, spyOn } from "bun:test";
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
  // Silence console during tests to keep output clean
  beforeAll(() => {
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
    spyOn(console, "warn").mockImplementation(() => {});
  });

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
  it("should redirect to setup if no admin exists", async () => {
    const app = setupApp();
    const res = await app.request(
      "http://localhost/admin/pages",
      {
        method: "GET",
        headers: {
          Host: "localhost",
        },
      },
      {
        EZ_CONTENT: {
          get: async (key: string) =>
            key === "system:admin_user" ? null : null,
        },
      } as any,
    );

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/admin/setup");
  });

  it("should return 403 on Origin/Host mismatch", async () => {
    const app = setupApp();
    const res = await app.request(
      "http://localhost/admin/setup",
      {
        method: "GET",
        headers: {
          Origin: "http://attacker.com",
          Host: "victim.com",
        },
      },
      {
        EZ_CONTENT: {
          get: async () => null,
        },
      } as any,
    );

    expect(res.status).toBe(403);
    expect(await res.text()).toContain(
      "Security Violation: Unauthorized Origin",
    );
  });

  it("should handle missing Host header gracefully", async () => {
    const app = setupApp();
    const res = await app.request(
      "http://localhost/admin/setup",
      {
        method: "GET",
        headers: {
          Origin: "http://localhost",
          // Host is missing
        },
      },
      {
        EZ_CONTENT: {
          get: async () => null,
        },
      } as any,
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toContain("INITIAL SETUP");
  });

  it("should handle Bearer token authorization", async () => {
    const app = setupApp();
    const res = await app.request(
      "http://localhost/admin",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-token",
        },
      },
      {
        EZ_CONTENT: {
          get: async (key: string) => {
            if (key === "system:admin_user") return { username: "admin" };
            if (key === "auth:session:valid-token") return "1";
            if (key === "system:onboarding_complete") return true;
            return null;
          },
        },
      } as any,
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toContain("DASHBOARD");
  });

  it("should redirect to login if session token is missing", async () => {
    const app = setupApp();
    const res = await app.request(
      "http://localhost/admin/pages", // Use a sub-path to avoid any root matching confusion
      {
        method: "GET",
        headers: {
          Host: "localhost",
        },
      },
      {
        EZ_CONTENT: {
          get: async (key: string) => {
            if (key === "system:admin_user") return { username: "admin" };
            return null;
          },
        },
      } as any,
    );

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/admin/login");
  });

  it("should redirect to login if session token is invalid", async () => {
    const app = setupApp();
    const res = await app.request(
      "http://localhost/admin",
      {
        method: "GET",
        headers: {
          Cookie: "ez_session=invalid-token",
        },
      },
      {
        EZ_CONTENT: {
          get: async (key: string) => {
            if (key === "system:admin_user") return { username: "admin" };
            if (key === "auth:session:invalid-token") return null;
            return null;
          },
        },
      } as any,
    );

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/admin/login");
  });

  it("should redirect to onboarding if incomplete", async () => {
    const app = setupApp();
    const res = await app.request(
      "http://localhost/admin",
      {
        method: "GET",
        headers: {
          Cookie: "ez_session=valid-token",
        },
      },
      {
        EZ_CONTENT: {
          get: async (key: string) => {
            if (key === "system:admin_user") return { username: "admin" };
            if (key === "auth:session:valid-token") return "1";
            if (key === "system:onboarding_complete") return null;
            return null;
          },
        },
      } as any,
    );

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/admin/onboarding");
  });

  /**
   * Security Posture: Headers Verification
   * Ensures that all administrative responses carry the required strict security headers.
   */
  it("should include strict security headers in responses", async () => {
    const app = setupApp();
    const res = await app.request(
      "http://localhost/admin/setup",
      { method: "GET" },
      {
        EZ_CONTENT: {
          get: async () => null,
        },
      } as any,
    );

    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(res.headers.get("Content-Security-Policy")).toContain(
      "default-src 'self'",
    );
  });

  /**
   * Security Posture: CSRF Protection
   * Verifies that mutations (POST/PUT/DELETE) are protected by the CSRF middleware.
   */
  it("should enforce CSRF protection on mutations", async () => {
    const app = setupApp();
    const res = await app.request(
      "http://localhost/admin/clear-cache",
      {
        method: "POST",
        headers: {
          Cookie: "ez_session=valid-token",
        },
      },
      {
        EZ_CONTENT: {
          get: async (key: string) => {
            if (key === "system:admin_user") return { username: "admin" };
            if (key === "auth:session:valid-token") return "1";
            if (key === "system:onboarding_complete") return true;
            return null;
          },
        },
      } as any,
    );

    // Hono CSRF middleware returns 403 Forbidden if the required headers (like X-Requested-With) are missing.
    expect(res.status).toBe(403);
    expect(await res.text()).toBe("Forbidden");
  });

  it("should allow mutation when CSRF headers are present", async () => {
    const app = setupApp();
    const res = await app.request(
      "http://localhost/admin/clear-cache",
      {
        method: "POST",
        headers: {
          Cookie: "ez_session=valid-token",
          Origin: "http://localhost",
        },
      },
      {
        EZ_CONTENT: {
          get: async (key: string) => {
            if (key === "system:admin_user") return { username: "admin" };
            if (key === "auth:session:valid-token") return "1";
            if (key === "system:onboarding_complete") return true;
            return null;
          },
        },
      } as any,
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toContain("CACHE PURGED");
  });
});

import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import onboarding from "@routes/admin/onboarding";
import { GlobalConfigVariables } from "@core/middleware";
import { createDefaultTheme, createDefaultSite } from "@core/factory";

/**
 * Tests for the Guided Onboarding Flow.
 */
describe("Admin Onboarding Routes", () => {
  const setupApp = () => {
    const app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();
    app.use("*", async (c, next) => {
      const site = createDefaultSite();
      c.set("theme", createDefaultTheme());
      c.set("site", site);
      c.set("seo", site.seo);
      await next();
    });
    app.route("/admin/onboarding", onboarding);
    return app;
  };

  const mockEnv = (overrides: any = {}) => {
    const store = new Map<string, any>();
    if (overrides.initialData) {
      for (const [k, v] of Object.entries(overrides.initialData)) {
        store.set(k, v);
      }
    }

    return {
      EZ_CONTENT: {
        get: async (key: string) => {
          if (overrides.get) {
            const res = await overrides.get(key);
            if (res !== undefined) return res;
          }
          return store.get(key) || null;
        },
        put: async (key: string, val: any) => {
          if (overrides.put) await overrides.put(key, val);
          const finalVal = typeof val === "string" ? JSON.parse(val) : val;
          store.set(key, finalVal);
        },
        delete: async (key: string) => {
          store.delete(key);
        },
        list: async () => ({ keys: [], list_complete: true }),
      },
    } as any;
  };

  it("GET / should render the multi-step onboarding UI", async () => {
    const app = setupApp();
    const res = await app.request(
      "http://localhost/admin/onboarding",
      { method: "GET" },
      mockEnv(),
    );

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("ONBOARDING");
    // Site defaults in factory.ts include "My Awesome Website"
    expect(html).toContain("My Awesome Website");
  });

  it("POST /complete should initialize system and redirect to admin", async () => {
    const app = setupApp();
    const formData = new FormData();
    formData.append("title", "My New CMS");
    formData.append("author", "Evgenii");
    formData.append("adminEmail", "evgenii@test.com");

    let savedKeys: string[] = [];
    const res = await app.request(
      "http://localhost/admin/onboarding/complete",
      {
        method: "POST",
        body: formData,
      },
      mockEnv({
        put: async (key: string) => {
          savedKeys.push(key);
        },
      }),
    );

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/admin");

    // Check that core system keys were initialized
    expect(savedKeys).toContain("config:site");
    expect(savedKeys).toContain("system:onboarding_complete");
    expect(savedKeys).toContain("system:initialized");
  });

  it("POST /complete should fail if required fields are missing", async () => {
    const app = setupApp();
    const res = await app.request(
      "http://localhost/admin/onboarding/complete",
      {
        method: "POST",
        body: new FormData(),
      },
      mockEnv(),
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Setup Error");
  });
});

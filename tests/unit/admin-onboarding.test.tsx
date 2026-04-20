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
          const finalVal = typeof val === "string" ? JSON.parse(val) : val;
          if (overrides.put) await overrides.put(key, finalVal);
          store.set(key, finalVal);
        },
        delete: async (key: string) => {
          store.delete(key);
        },
        list: async () => ({ keys: [], list_complete: true }),
      },
    } as any;
  };

  it("GET / should render the multi-step onboarding UI with correct form attributes", async () => {
    const app = setupApp();
    const res = await app.request(
      "http://localhost/admin/onboarding",
      { method: "GET" },
      mockEnv(),
    );

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("ONBOARDING");
    expect(html).toContain('action="/admin/onboarding/complete"');
    expect(html).toContain('method="post"');
    expect(html).toContain('name="title"');
    expect(html).toContain("autofocus");
  });

  it("POST /complete should initialize site identity and generate legal pages", async () => {
    const app = setupApp();
    const formData = new FormData();
    formData.append("title", "Quantum Portal");
    formData.append("author", "Dr. Flux");
    formData.append("adminEmail", "flux@quantum.io");
    formData.append("tagline", "The Future is Now");
    formData.append("seo.identity.type", "Person");

    const savedData: Record<string, any> = {};
    const res = await app.request(
      "http://localhost/admin/onboarding/complete",
      {
        method: "POST",
        body: formData,
      },
      mockEnv({
        put: async (key: string, val: any) => {
          savedData[key] = val;
        },
      }),
    );

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/admin");

    // 1. Verify Site Config Update
    const site = savedData["config:site"];
    expect(site.title).toBe("Quantum Portal");
    expect(site.author).toBe("Dr. Flux");
    expect(site.adminEmail).toBe("flux@quantum.io");
    expect(site.tagline).toBe("The Future is Now");
    expect(site.seo.identity.type).toBe("Person");
    expect(site.seo.identity.name).toBe("Dr. Flux");

    // 2. Verify Legal Pages Generation (Live Mode)
    expect(savedData["page:live:terms"]).toBeDefined();
    expect(savedData["page:live:terms"].title).toBe("Terms of Service");
    expect(savedData["page:live:privacy"]).toBeDefined();
    expect(savedData["page:live:privacy"].title).toBe("Privacy Policy");

    // 3. Verify System Initialization
    expect(savedData["system:onboarding_complete"]).toBe(true);
    expect(savedData["system:initialized"]).toBe(true);

    // 4. Verify ensureSystemDefaults side-effects (Default Nav/Theme/Footer/Index)
    expect(savedData["config:nav"]).toBeDefined();
    expect(savedData["config:theme"]).toBeDefined();
    expect(savedData["config:footer"]).toBeDefined();
    expect(savedData["page:live:index"]).toBeDefined();
  });

  it("POST /complete should fail and display specific Zod validation errors", async () => {
    const app = setupApp();
    const formData = new FormData();
    formData.append("title", "Test");
    formData.append("author", "Author");
    formData.append("adminEmail", "not-an-email");

    const res = await app.request(
      "http://localhost/admin/onboarding/complete",
      {
        method: "POST",
        body: formData,
      },
      mockEnv(),
    );

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Setup Error");
    expect(html).toContain("Invalid email");
  });

  it("POST /complete should handle missing required fields gracefully", async () => {
    const app = setupApp();
    const formData = new FormData();
    // Missing title, author, and email

    const res = await app.request(
      "http://localhost/admin/onboarding/complete",
      {
        method: "POST",
        body: formData,
      },
      mockEnv(),
    );

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Setup Error");
    expect(html).toContain("Required");
  });
});

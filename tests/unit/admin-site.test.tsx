import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import siteAdmin from "@routes/admin/site";
import { GlobalConfigVariables } from "@core/middleware";
import { createDefaultTheme, createDefaultSite } from "@core/factory";

/**
 * Tests for Administrative Site Settings and Maintenance.
 */
describe("Admin Site Routes", () => {
  const setupApp = () => {
    const app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();
    app.use("*", async (c, next) => {
      const site = createDefaultSite();
      c.set("theme", createDefaultTheme());
      c.set("site", site);
      c.set("seo", site.seo);
      await next();
    });
    app.route("/admin/site", siteAdmin);
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
        get: async (key: string, options?: any) => {
          if (overrides.get) {
            const res = await overrides.get(key, options);
            if (res !== undefined) return res;
          }
          const val = store.get(key);
          if (val === undefined) return null;
          if (options?.type === "json" && typeof val === "string") {
            try {
              return JSON.parse(val);
            } catch (e) {
              return val;
            }
          }
          return val;
        },
        put: async (key: string, val: any) => {
          if (overrides.put) await overrides.put(key, val);
          const finalVal = typeof val === "string" ? JSON.parse(val) : val;
          store.set(key, finalVal);
        },
        delete: async (key: string) => {
          store.delete(key);
        },
        list: async (opts: any) => {
          if (overrides.list) return await overrides.list(opts);
          const keys = Array.from(store.keys()).map((k) => ({ name: k }));
          return { keys, list_complete: true };
        },
      },
    } as any;
  };

  describe("GET /admin/site", () => {
    it("should render the site settings interface", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/site",
        { method: "GET" },
        mockEnv(),
      );

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("Site Settings");
      expect(html).toContain("Basic Information");
      expect(html).toContain("Branding");
    });
  });

  describe("GET /admin/site/identity-fields", () => {
    it("should render identity fields for Person", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/site/identity-fields?seo.identity.type=Person",
        { method: "GET" },
        mockEnv(),
      );

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("Person Name");
    });

    it("should render identity fields for LocalBusiness", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/site/identity-fields?seo.identity.type=LocalBusiness",
        { method: "GET" },
        mockEnv(),
      );

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("Business Name");
    });
  });

  describe("POST /admin/site/save", () => {
    it("should save site settings successfully", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("title", "New Site Title");
      formData.append("adminEmail", "admin@test.com");
      formData.append("showStatus", "true");

      let savedSite: any = null;
      const res = await app.request(
        "http://localhost/admin/site/save",
        {
          method: "POST",
          body: formData,
        },
        mockEnv({
          put: async (key: string, val: string) => {
            if (key === "config:site")
              savedSite = typeof val === "string" ? JSON.parse(val) : val;
          },
        }),
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toContain("SETTINGS SAVED");
      expect(savedSite.title).toBe("New Site Title");
      expect(savedSite.showStatus).toBe(true);
    });
  });

  describe("Maintenance Operations", () => {
    it("GET /backup should return JSON backup", async () => {
      const app = setupApp();
      // Use the robust mockEnv instead of a custom one
      const env = mockEnv({
        initialData: {
          "config:site": JSON.stringify({ title: "Backup Title" }),
        },
      });

      const res = await app.request(
        "http://localhost/admin/site/backup",
        { method: "GET" },
        env,
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data["config:site"]).toBeDefined();
      expect(data["config:site"].title).toBe("Backup Title");
    });

    it("POST /restore should import backup and redirect", async () => {
      const app = setupApp();
      const backupData = JSON.stringify({
        "config:site": { title: "Restored" },
      });
      const blob = new Blob([backupData], { type: "application/json" });
      const file = new File([blob], "backup.json");

      const formData = new FormData();
      formData.append("backup", file);

      let imported = false;
      const res = await app.request(
        "http://localhost/admin/site/restore",
        {
          method: "POST",
          body: formData,
        },
        mockEnv({
          put: async (key: string) => {
            if (key === "config:site") imported = true;
          },
        }),
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toContain("Successfully imported");
      expect(imported).toBe(true);
    });
  });
});

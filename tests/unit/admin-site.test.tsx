import { describe, it, expect, spyOn, mock, afterEach } from "bun:test";
import { Hono } from "hono";
import siteAdmin from "@routes/admin/site";
import { GlobalConfigVariables } from "@core/middleware";
import { createDefaultTheme, createDefaultSite } from "@core/factory";
import { getSite, clearCache } from "@core/kv/config";

/**
 * Tests for Administrative Site Settings and Maintenance.
 */
describe("Admin Site Routes", () => {
  afterEach(() => {
    clearCache();
    mock.restore();
  });

  /**
   * setupApp: This helper actually reads from the environment
   * (mock KV), just like the real production middleware does.
   */
  const setupApp = () => {
    const app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();
    app.use("*", async (c, next) => {
      // 1. Try to get the site from KV (the mock)
      const site = await getSite(c.env);
      // 2. Fallback to defaults IF KV is totally empty
      const finalSite = site || createDefaultSite();

      c.set("theme", createDefaultTheme());
      c.set("site", finalSite);
      c.set("seo", finalSite.seo);
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

          if (options?.type === "json") {
            return typeof val === "string" ? JSON.parse(val) : val;
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
      expect(html).toContain("SEO - Social Profiles");
      expect(html).toContain("Backup & Restore");
      expect(html).toContain("DOMAIN.COM");
    });

    it("should handle missing baseUrl in OG preview", async () => {
      const site = { ...createDefaultSite(), baseUrl: "" };
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/site",
        { method: "GET" },
        mockEnv({
          initialData: { "config:site": site },
        }),
      );
      const html = await res.text();
      expect(html).toContain("DOMAIN.COM");
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
      expect(html).toContain("Address");
      expect(html).toContain("Phone");
    });

    it("should render identity fields for Organization", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/site/identity-fields?seo.identity.type=Organization",
        { method: "GET" },
        mockEnv(),
      );

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("Organization Name");
    });

    it("should handle missing identity in c.var.site gracefully", async () => {
      const site = createDefaultSite();
      delete (site.seo as any).identity;

      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/site/identity-fields?seo.identity.type=Person",
        { method: "GET" },
        mockEnv({
          initialData: { "config:site": site },
        }),
      );
      expect(res.status).toBe(200);
      expect(await res.text()).toContain("Person Name");
    });

    it("should preserve existing form values in HTMX dynamic swap", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/site/identity-fields?seo.identity.type=Person&seo.identity.name=John%20Doe",
        { method: "GET" },
        mockEnv(),
      );

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('value="John Doe"');
      expect(html).toContain('name="seo.identity.name"');
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

    it("should handle social links zip mapping correctly", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("title", "Site with Links");
      formData.append("adminEmail", "admin@test.com");
      formData.append("link_platform[]", "Twitter");
      formData.append("link_url[]", "https://twitter.com/test");
      formData.append("link_platform[]", "GitHub");
      formData.append("link_url[]", "https://github.com/test");

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
      expect(savedSite.seo.identity.links).toHaveLength(2);
      expect(savedSite.seo.identity.links[0]).toEqual({
        platform: "Twitter",
        url: "https://twitter.com/test",
      });
      expect(savedSite.seo.identity.links[1]).toEqual({
        platform: "GitHub",
        url: "https://github.com/test",
      });
    });

    it("should handle image upload separately in POST /save", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append(
        "ogImageBase64",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      );

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
      expect(savedSite.ogImage).toContain("/images/");
    });

    it("should return error on validation failure in POST /save", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("adminEmail", "invalid-email");

      const spy = spyOn(console, "error").mockImplementation(() => {});

      const res = await app.request(
        "http://localhost/admin/site/save",
        {
          method: "POST",
          body: formData,
        },
        mockEnv(),
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toContain("SAVE FAILED");
      spy.mockRestore();
    });
  });

  describe("Maintenance Operations", () => {
    it("GET /backup should handle errors gracefully", async () => {
      const app = setupApp();
      const spy = spyOn(console, "error").mockImplementation(() => {});

      const res = await app.request(
        "http://localhost/admin/site/backup",
        { method: "GET" },
        mockEnv({
          list: async () => {
            throw new Error("KV Error");
          },
        }),
      );

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "KV Error" });
      spy.mockRestore();
    });

    it("GET /backup should return JSON backup", async () => {
      const app = setupApp();
      const env = mockEnv({
        initialData: {
          "config:site": JSON.stringify({
            ...createDefaultSite(),
            title: "Backup Title",
          }),
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

    it("POST /restore should fail if no file provided", async () => {
      const app = setupApp();
      const spy = spyOn(console, "error").mockImplementation(() => {});

      const res = await app.request(
        "http://localhost/admin/site/restore",
        { method: "POST" },
        mockEnv(),
      );

      expect(res.status).toBe(400);
      expect(await res.text()).toContain(
        "RESTORE FAILED: No backup file provided",
      );
      spy.mockRestore();
    });

    it("POST /restore should fail if JSON is invalid", async () => {
      const app = setupApp();
      const blob = new Blob(["invalid-json"], { type: "application/json" });
      const file = new File([blob], "backup.json");
      const formData = new FormData();
      formData.append("backup", file);

      const spy = spyOn(console, "error").mockImplementation(() => {});

      const res = await app.request(
        "http://localhost/admin/site/restore",
        {
          method: "POST",
          body: formData,
        },
        mockEnv(),
      );

      expect(res.status).toBe(500);
      expect(await res.text()).toContain("RESTORE FAILED");
      spy.mockRestore();
    });
  });

  describe("Components Coverage", () => {
    it("should handle missing logoSvg in BrandingCard and omit data URIs", async () => {
      // Create a site specifically WITHOUT a logo
      const siteWithoutLogo = createDefaultSite();
      siteWithoutLogo.logoSvg = "";

      const app = setupApp();
      const env = mockEnv({
        initialData: {
          "config:site": siteWithoutLogo,
        },
      });

      const res = await app.request(
        "http://localhost/admin/site",
        { method: "GET" },
        env,
      );
      const html = await res.text();
      expect(html).toContain("Logo (Raw SVG)");
      // Proof that the logic works: no image data string is rendered in src or href
      expect(html).not.toContain('src="data:image/svg+xml');
      expect(html).not.toContain('href="data:image/svg+xml');
    });

    it("should render BackupRestoreCard via app request", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/site",
        { method: "GET" },
        mockEnv(),
      );
      const html = await res.text();
      expect(html).toContain("Backup &amp; Restore");
      expect(html).toContain("START BACKUP");
    });
  });
});

import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import pagesAdmin from "@routes/admin/pages";
import { GlobalConfigVariables } from "@core/middleware";
import {
  createDefaultTheme,
  createDefaultSite,
  createDefaultPage,
} from "@core/factory";

/**
 * Tests for Administrative Page Management.
 */
describe("Admin Pages Routes", () => {
  const setupApp = () => {
    const app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();
    app.use("*", async (c, next) => {
      const site = createDefaultSite();
      c.set("theme", createDefaultTheme());
      c.set("site", site);
      c.set("seo", site.seo);
      await next();
    });
    app.route("/admin/pages", pagesAdmin);
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
            const res = await overrides.get(key);
            if (res !== undefined) return res;
          }
          if (key.startsWith("list:pages")) return store.get(key) || [];
          return store.get(key) || null;
        },
        put: async (key: string, val: any) => {
          if (overrides.put) await overrides.put(key, val);
          const finalVal = typeof val === "string" ? JSON.parse(val) : val;
          store.set(key, finalVal);
        },
        delete: async (key: string) => {
          if (overrides.delete) await overrides.delete(key);
          store.delete(key);
        },
        list: async () => ({ keys: [], list_complete: true }),
      },
    } as any;
  };

  describe("GET /admin/pages", () => {
    it("should render the page list interface", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/pages",
        { method: "GET" },
        mockEnv({
          initialData: {
            "list:pages:live": ["index"],
            "list:pages:draft": ["draft-page"],
          },
        }),
      );

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("Page Manager");
      expect(html).toContain("index");
      expect(html).toContain("draft-page");
    });
  });

  describe("GET /admin/pages/edit/:slug", () => {
    it("should render the page editor", async () => {
      const app = setupApp();
      const page = createDefaultPage("Test Page", "test");

      const res = await app.request(
        "http://localhost/admin/pages/edit/test",
        { method: "GET" },
        mockEnv({
          initialData: { "page:draft:test": page },
        }),
      );

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("Edit Page: Test Page");
      expect(html).toContain("editorjs-container");
    });

    it("should return 404 for non-existent page", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/pages/edit/missing",
        { method: "GET" },
        mockEnv(),
      );

      expect(res.status).toBe(404);
    });
  });

  describe("POST /admin/pages/create", () => {
    it("should create new draft and redirect", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("title", "New Page");
      formData.append("path", "articles");

      let created = false;
      const res = await app.request(
        "http://localhost/admin/pages/create",
        {
          method: "POST",
          body: formData,
        },
        mockEnv({
          get: async (key: string) => {
            // Ensure it thinks no page exists
            return null;
          },
          put: async (key: string) => {
            if (key === "page:draft:articles/new-page") created = true;
          },
        }),
      );

      // In this router, we return 200 with HX-Redirect header
      expect(res.status).toBe(200);
      expect(res.headers.get("HX-Redirect")).toContain(
        "/admin/pages/edit/articles%2Fnew-page",
      );
      expect(created).toBe(true);
    });
  });

  describe("POST /admin/pages/save/:slug", () => {
    it("should update page content", async () => {
      const app = setupApp();
      const page = createDefaultPage("Old Title", "test");

      const formData = new FormData();
      formData.append("title", "Updated Title");
      formData.append(
        "content",
        JSON.stringify({
          time: 123,
          blocks: [],
          version: "2.31.3",
        }),
      );

      let savedData: any = null;
      const res = await app.request(
        "http://localhost/admin/pages/save/test",
        {
          method: "POST",
          body: formData,
        },
        mockEnv({
          initialData: { "page:draft:test": page },
          put: async (key: string, val: any) => {
            if (key === "page:draft:test")
              savedData = typeof val === "string" ? JSON.parse(val) : val;
          },
        }),
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toContain("PAGE SAVED");
      expect(savedData.title).toBe("Updated Title");
    });
  });

  describe("Lifecycle Mutations", () => {
    it("POST /publish/:slug should publish draft to live", async () => {
      const app = setupApp();
      const page = createDefaultPage("Publish Me", "test");

      let published = false;
      const res = await app.request(
        "http://localhost/admin/pages/publish/test",
        {
          method: "POST",
        },
        mockEnv({
          initialData: { "page:draft:test": page },
          put: async (key: string) => {
            if (key === "page:live:test") published = true;
          },
        }),
      );

      expect(res.status).toBe(200);
      expect(published).toBe(true);
    });

    it("POST /delete/:slug should remove page", async () => {
      const app = setupApp();
      let deleted = false;
      const res = await app.request(
        "http://localhost/admin/pages/delete/test",
        {
          method: "POST",
        },
        mockEnv({
          initialData: {
            "list:pages:live": ["test"],
            "list:pages:draft": ["test"],
            "page:draft:test": createDefaultPage("test", "test"),
          },
          delete: async (key: string) => {
            if (key === "page:draft:test") deleted = true;
          },
        }),
      );

      expect(res.status).toBe(200);
      expect(deleted).toBe(true);
    });
  });
});

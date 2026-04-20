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
        get: async (key: string, _options?: any) => {
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
            "list:pages:live": ["index", "nested/slug"],
            "list:pages:draft": ["draft-page"],
          },
        }),
      );

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("Page Manager");
      expect(html).toContain("index");
      expect(html).toContain("draft-page");
      expect(html).toContain("nested/");
      expect(html).toContain("slug");
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

    it("should disable save button for protected pages", async () => {
      const app = setupApp();
      const page = createDefaultPage("Home", "index");
      const res = await app.request(
        "http://localhost/admin/pages/edit/index",
        { method: "GET" },
        mockEnv({
          initialData: { "page:draft:index": page },
        }),
      );
      expect(await res.text()).toContain("disabled");
    });

    it("should render formatted timestamps from page metadata", async () => {
      const app = setupApp();
      const page = createDefaultPage("Test Page", "test");
      const updatedAt = "2024-04-20T10:00:00.000Z";
      page.metadata.updatedAt = updatedAt;

      const res = await app.request(
        "http://localhost/admin/pages/edit/test",
        { method: "GET" },
        mockEnv({
          initialData: { "page:draft:test": page },
        }),
      );

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("SAVED:");
      // Simple verify: date constructor turns 2024-04-20 into localized string containing year
      expect(html).toContain("2024");
    });

    it("should return 500 on unexpected errors", async () => {
      const app = setupApp();
      const originalConsoleError = console.error;
      console.error = () => {};

      const res = await app.request(
        "http://localhost/admin/pages/edit/error",
        { method: "GET" },
        mockEnv({
          get: async () => {
            throw new Error("Database Failure");
          },
        }),
      );
      expect(res.status).toBe(500);
      expect(await res.text()).toContain("500 EDITOR ERROR");

      console.error = originalConsoleError;
    });
  });

  describe("POST /admin/pages/create", () => {
    it("should create new draft and redirect with correct path encoding", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("title", "New Page");
      formData.append("path", "articles");

      let savedData: any = null;
      const res = await app.request(
        "http://localhost/admin/pages/create",
        {
          method: "POST",
          body: formData,
        },
        mockEnv({
          get: async () => null,
          put: async (key: string, val: any) => {
            if (key === "page:draft:articles/new-page") {
              savedData = typeof val === "string" ? JSON.parse(val) : val;
            }
          },
        }),
      );

      expect(res.status).toBe(200);
      expect(res.headers.get("HX-Redirect")).toBe(
        "/admin/pages/edit/articles%2Fnew-page",
      );
      expect(savedData.title).toBe("New Page");
      expect(savedData.slug).toBe("articles/new-page");
      expect(savedData.status).toBe("draft");
    });

    it("should fail if page already exists", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("title", "Existing Page");
      const originalConsoleError = console.error;
      console.error = () => {};

      const res = await app.request(
        "http://localhost/admin/pages/create",
        {
          method: "POST",
          body: formData,
        },
        mockEnv({
          initialData: { "page:draft:existing-page": { title: "Existing" } },
        }),
      );

      expect(res.status).toBe(400);
      expect(await res.text()).toContain(
        'Page "/existing-page" already exists.',
      );
      console.error = originalConsoleError;
    });

    it("should return error if title is missing", async () => {
      const app = setupApp();
      const formData = new FormData();
      const originalConsoleError = console.error;
      console.error = () => {};

      const res = await app.request("http://localhost/admin/pages/create", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(400);
      expect(await res.text()).toBe("Title is required");
      console.error = originalConsoleError;
    });
  });

  describe("POST /admin/pages/save/:slug", () => {
    it("should handle missing page error", async () => {
      const app = setupApp();
      const originalConsoleError = console.error;
      console.error = () => {};

      const res = await app.request(
        "http://localhost/admin/pages/save/non-existent",
        { method: "POST" },
        mockEnv(),
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toContain("SAVE FAILED: Page not found");
      console.error = originalConsoleError;
    });

    it("should handle invalid JSON content and fall back to existing content", async () => {
      const app = setupApp();
      const page = createDefaultPage("Test", "test");
      const formData = new FormData();
      formData.append("content", "invalid-json");
      const originalConsoleError = console.error;
      console.error = () => {};

      const res = await app.request(
        "http://localhost/admin/pages/save/test",
        {
          method: "POST",
          body: formData,
        },
        mockEnv({
          initialData: { "page:draft:test": page },
        }),
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toContain("PAGE SAVED");
      console.error = originalConsoleError;
    });

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

    it("POST /publish/:slug should handle title update during publish", async () => {
      const app = setupApp();
      const page = createDefaultPage("Old Title", "test");
      const formData = new FormData();
      formData.append("title", "New Title");

      let savedTitle = "";
      const res = await app.request(
        "http://localhost/admin/pages/publish/test",
        {
          method: "POST",
          body: formData,
        },
        mockEnv({
          initialData: { "page:draft:test": page },
          put: async (key: string, val: any) => {
            if (key === "page:draft:test") {
              const data = typeof val === "string" ? JSON.parse(val) : val;
              savedTitle = data.title;
            }
          },
        }),
      );

      expect(res.status).toBe(200);
      expect(savedTitle).toBe("New Title");
    });

    it("should handle publication failure", async () => {
      const app = setupApp();
      const originalConsoleError = console.error;
      console.error = () => {};

      const res = await app.request(
        "http://localhost/admin/pages/publish/missing",
        { method: "POST" },
        mockEnv(),
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toContain("PUBLISH FAILED: Publication failed");
      console.error = originalConsoleError;
    });

    it("POST /unpublish/:slug should revert live page to draft", async () => {
      const app = setupApp();
      const page = createDefaultPage("Unpublish Me", "test");

      let unpublished = false;
      const res = await app.request(
        "http://localhost/admin/pages/unpublish/test",
        { method: "POST" },
        mockEnv({
          initialData: {
            "page:live:test": page,
            "list:pages:live": ["test"],
            "list:pages:draft": [],
          },
          delete: async (key: string) => {
            if (key === "page:live:test") unpublished = true;
          },
        }),
      );

      expect(res.status).toBe(200);
      expect(unpublished).toBe(true);
      expect(await res.text()).toContain("test"); // PageRow should render
    });

    it("POST /unpublish/:slug should handle failure", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/pages/unpublish/missing",
        { method: "POST" },
        mockEnv(),
      );

      expect(res.status).toBe(500);
      expect(await res.text()).toBe("Unpublish failed");
    });

    it("POST /delete/:slug should prevent deleting protected pages", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/pages/delete/index",
        { method: "POST" },
        mockEnv(),
      );

      expect(res.status).toBe(400);
      expect(await res.text()).toContain("Cannot delete protected page");
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

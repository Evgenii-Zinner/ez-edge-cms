import { describe, it, expect, beforeEach, spyOn } from "bun:test";
import app from "../../src/index";
import { PageListEntry } from "../../src/core/schema";
import { clearCache } from "../../src/core/kv/config";
import { createDefaultSite, createDefaultPage } from "../../src/core/factory";

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
        return store.get(key) || null;
      },
      getWithMetadata: async (key: string, _options?: any) => {
        if (overrides.getWithMetadata) {
          const res = await overrides.getWithMetadata(key);
          if (res !== undefined) return res;
        }
        const val = store.get(key) || null;
        return {
          value: val,
          metadata: overrides.metadata?.[key] || { contentType: "image/webp" },
        };
      },
      put: async (key: string, val: any) => {
        if (overrides.put) await overrides.put(key, val);
        store.set(key, val);
      },
      delete: async (key: string) => {
        store.delete(key);
      },
      list: async (options?: any) => {
        if (overrides.list) return overrides.list(options);
        return { keys: [], list_complete: true };
      },
    },
  } as any;
};

describe("Public Routes & Archive Explorer", () => {
  beforeEach(() => {
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
    clearCache();
  });

  describe("Archive Pagination", () => {
    it("should render the first page of archive explorer (max 12 items)", async () => {
      // Create 15 dummy items for a category
      const subPages: PageListEntry[] = Array.from({ length: 15 }, (_, i) => ({
        slug: `blog/post-${i + 1}`,
        title: `Post ${i + 1}`,
        createdAt: new Date().toISOString(),
      }));

      const res = await app.request(
        "http://localhost/blog",
        { method: "GET" },
        mockEnv({
          initialData: {
            "system:admin_user": { username: "admin" }, // To pass system checks
            "system:onboarding_complete": true,
            "list:pages:live": { items: subPages, version: "2.0.0" },
          },
        }),
      );

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("ARCHIVE EXPLORER");
      expect(html).toContain("15 ENTRIES FOUND");
      expect(html).toContain("PAGE 1 OF 2");
      expect(html).toContain("NEXT SECTOR");

      // Verify that exactly 12 items are rendered on the first page
      const postMatches = html.match(/>Post \d+</g);
      expect(postMatches?.length).toBe(12);
    });

    it("should render the second page when query parameter ?page=2 is provided", async () => {
      const subPages: PageListEntry[] = Array.from({ length: 15 }, (_, i) => ({
        slug: `blog/post-${i + 1}`,
        title: `Post ${i + 1}`,
        createdAt: new Date().toISOString(),
      }));

      const res = await app.request(
        "http://localhost/blog?page=2",
        { method: "GET" },
        mockEnv({
          initialData: {
            "system:admin_user": { username: "admin" },
            "system:onboarding_complete": true,
            "list:pages:live": { items: subPages, version: "2.0.0" },
          },
        }),
      );

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("PAGE 2 OF 2");
      expect(html).toContain("PREVIOUS SECTOR");
      expect(html).not.toContain("NEXT SECTOR");

      const postMatches = html.match(/>Post \d+</g);
      expect(postMatches?.length).toBe(3);
    });

    it("should show empty sector message if no subpages exist", async () => {
      const res = await app.request(
        "http://localhost/empty-sector",
        { method: "GET" },
        mockEnv({
          initialData: {
            "system:admin_user": { username: "admin" },
            "system:onboarding_complete": true,
            "list:pages:live": { items: [], version: "2.0.0" },
          },
        }),
      );

      expect(res.status).toBe(404); // Because it falls back to 404 if no subpages and not a nav item
    });

    it("should show empty sector message if navigation path exists but has no subpages", async () => {
      const res = await app.request(
        "http://localhost/empty-nav-sector",
        { method: "GET" },
        mockEnv({
          initialData: {
            "system:admin_user": { username: "admin" },
            "system:onboarding_complete": true,
            "config:nav": {
              schemaVersion: "2.0.0",
              items: [
                { label: "HOME", path: "/" },
                { label: "EMPTY", path: "/empty-nav-sector" },
              ],
            },
            "list:pages:live": { items: [], version: "2.0.0" },
          },
        }),
      );

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("SECTOR IS CURRENTLY EMPTY");
    });
  });

  describe("LLMS Metadata Route", () => {
    it("should generate llms-full.txt from index metadata without loading full pages", async () => {
      const pages: PageListEntry[] = [
        { slug: "index", title: "Home", createdAt: "2024-01-01T00:00:00Z" },
        {
          slug: "about",
          title: "About Us",
          description: "About page",
          createdAt: "2024-01-02T00:00:00Z",
        },
      ];

      const res = await app.request(
        "http://localhost/llms-full.txt",
        { method: "GET" },
        mockEnv({
          initialData: {
            "system:admin_user": { username: "admin" },
            "system:onboarding_complete": true,
            "config:site": {
              title: "Test Site",
              tagline: "A test",
              adminEmail: "test@test.com",
            },
            "list:pages:live": { items: pages, version: "2.0.0" },
          },
        }),
      );

      expect(res.status).toBe(200);
      const text = await res.text();

      expect(text).toContain("Site Content Overview: Test Site");
      expect(text).toContain("A test");
      expect(text).toContain("PAGE: Home");
      expect(text).toContain("Path: /");
      expect(text).toContain("PAGE: About Us");
      expect(text).toContain("Path: /about");
      expect(text).toContain("Description: About page");
    });
  });

  describe("Static Assets, Redirects and Well-Known Routes", () => {
    it("GET /images/* - should deliver image body with appropriate headers if it exists", async () => {
      const buffer = new Uint8Array([1, 2, 3]).buffer;
      const res = await app.request(
        "http://localhost/images/pages/logo.png",
        { method: "GET" },
        mockEnv({
          initialData: {
            "img:pages:logo.png": buffer,
          },
          metadata: {
            "img:pages:logo.png": { contentType: "image/png" },
          },
        }),
      );

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("image/png");
      expect(res.headers.get("Cache-Control")).toBe(
        "public, max-age=31536000, immutable",
      );
      const body = await res.arrayBuffer();
      expect(body.byteLength).toBe(3);
    });

    it("GET /images/* - should return 404 if image path has no filename", async () => {
      const res = await app.request(
        "http://localhost/images/no-filename",
        { method: "GET" },
        mockEnv(),
      );
      expect(res.status).toBe(404);
    });

    it("GET /images/* - should return 404 if image does not exist", async () => {
      const res = await app.request(
        "http://localhost/images/pages/missing.png",
        { method: "GET" },
        mockEnv(),
      );
      expect(res.status).toBe(404);
    });

    it("GET / - should redirect to setup and ensure defaults when both admin user and system status are absent", async () => {
      let ensuredDefaults = false;
      const res = await app.request(
        "http://localhost/",
        { method: "GET" },
        mockEnv({
          get: async (key: string) => {
            if (key === "system:admin_user") return null;
            if (key === "system:onboarding_complete") return false;
            return null;
          },
          put: async (key: string) => {
            if (key === "system:initialized") ensuredDefaults = true;
          },
        }),
      );

      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/admin/setup");
      expect(ensuredDefaults).toBe(true);
    });

    it("GET / - should redirect to setup without ensuring defaults when admin is missing but system is initialized", async () => {
      let ensuredDefaults = false;
      const res = await app.request(
        "http://localhost/",
        { method: "GET" },
        mockEnv({
          get: async (key: string) => {
            if (key === "system:admin_user") return null;
            if (key === "system:onboarding_complete") return true;
            return null;
          },
          put: async (key: string) => {
            if (key === "system:onboarding_complete") ensuredDefaults = true;
          },
        }),
      );

      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/admin/setup");
      expect(ensuredDefaults).toBe(false);
    });

    it("GET / - should call next and render home page when admin exists", async () => {
      const res = await app.request(
        "http://localhost/",
        { method: "GET" },
        mockEnv({
          initialData: {
            "system:admin_user": { username: "admin" },
            "system:onboarding_complete": true,
            "page:live:index": {
              ...createDefaultPage("Home", "index"),
              content: [],
            },
          },
        }),
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toContain("Home");
    });

    it("GET /sitemap.xml - should generate valid sitemap xml", async () => {
      const pages = [
        { slug: "index", title: "Home", createdAt: "2024-01-01" },
        { slug: "about", title: "About", createdAt: "2024-01-02" },
      ];

      const res = await app.request(
        "http://localhost/sitemap.xml",
        { method: "GET" },
        mockEnv({
          initialData: {
            "list:pages:live": { items: pages, version: "2.0.0" },
          },
        }),
      );

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/xml");
      const xml = await res.text();
      expect(xml).toContain("<loc>http://localhost</loc>");
      expect(xml).toContain("<loc>http://localhost/about</loc>");
    });

    it("GET /llms.txt - should return llms.txt content", async () => {
      const res = await app.request(
        "http://localhost/llms.txt",
        { method: "GET" },
        mockEnv({
          initialData: {
            "config:site": {
              ...createDefaultSite(),
              txtFiles: {
                llms: "llms-content",
              },
            },
          },
        }),
      );
      expect(res.status).toBe(200);
      expect(await res.text()).toBe("llms-content");
    });

    it("GET /humans.txt - should return humans.txt content", async () => {
      const res = await app.request(
        "http://localhost/humans.txt",
        { method: "GET" },
        mockEnv({
          initialData: {
            "config:site": {
              ...createDefaultSite(),
              txtFiles: {
                humans: "humans-content",
              },
            },
          },
        }),
      );
      expect(res.status).toBe(200);
      expect(await res.text()).toBe("humans-content");
    });

    it("GET /ads.txt - should return ads.txt content", async () => {
      const res = await app.request(
        "http://localhost/ads.txt",
        { method: "GET" },
        mockEnv({
          initialData: {
            "config:site": {
              ...createDefaultSite(),
              txtFiles: {
                ads: "ads-content",
              },
            },
          },
        }),
      );
      expect(res.status).toBe(200);
      expect(await res.text()).toBe("ads-content");
    });

    it("GET /robots.txt - should return robots txt file", async () => {
      const res = await app.request(
        "http://localhost/robots.txt",
        { method: "GET" },
        mockEnv({
          initialData: {
            "config:site": {
              ...createDefaultSite(),
              txtFiles: {
                robots: "User-agent: *\nDisallow: /",
              },
            },
          },
        }),
      );

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain("User-agent: *");
      expect(text).toContain("Sitemap: http://localhost/sitemap.xml");
    });

    it("GET /security.txt - should return security policy", async () => {
      const res = await app.request(
        "http://localhost/security.txt",
        { method: "GET" },
        mockEnv({
          initialData: {
            "config:site": {
              ...createDefaultSite(),
              adminEmail: "security@test.com",
              txtFiles: {
                ...createDefaultSite().txtFiles,
                security: "Contact: mailto:security@test.com",
              },
            },
          },
        }),
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toContain("mailto:security@test.com");
    });

    it("GET /.well-known/security.txt - should return security policy", async () => {
      const res = await app.request(
        "http://localhost/.well-known/security.txt",
        { method: "GET" },
        mockEnv({
          initialData: {
            "config:site": {
              ...createDefaultSite(),
              adminEmail: "security@test.com",
              txtFiles: {
                ...createDefaultSite().txtFiles,
                security: "Contact: mailto:security@test.com",
              },
            },
          },
        }),
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toContain("mailto:security@test.com");
    });

    it("GET /.well-known/mta-sts.txt - should return configuration", async () => {
      const res = await app.request(
        "http://localhost/.well-known/mta-sts.txt",
        { method: "GET" },
        mockEnv({
          initialData: {
            "config:site": {
              ...createDefaultSite(),
              txtFiles: {
                ...createDefaultSite().txtFiles,
                mtaSts: "version: STSv1",
              },
            },
          },
        }),
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("version: STSv1");
    });

    it("GET /.well-known/traffic-advice - should return traffic advice JSON", async () => {
      const res = await app.request(
        "http://localhost/.well-known/traffic-advice",
        { method: "GET" },
        mockEnv(),
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/json");
      expect(await res.text()).toContain("prefetch-proxy");
    });

    it("GET /.well-known/change-password - should redirect to admin", async () => {
      const res = await app.request(
        "http://localhost/.well-known/change-password",
        { method: "GET" },
        mockEnv(),
      );
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/admin");
    });
  });

  describe("Universal Page Content Resolution", () => {
    it("should render page using Editor.js renderer", async () => {
      const page = {
        ...createDefaultPage("EditorJS Page", "editorjs"),
        content: {
          time: 1234,
          blocks: [
            {
              type: "paragraph",
              data: { text: "EditorJS paragraph" },
            },
          ],
        },
      };

      const res = await app.request(
        "http://localhost/editorjs",
        { method: "GET" },
        mockEnv({
          initialData: {
            "system:admin_user": { username: "admin" },
            "system:onboarding_complete": true,
            "page:live:editorjs": page,
          },
        }),
      );

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("EditorJS Page");
      expect(html).toContain("EditorJS paragraph");
    });

    it("should render page using PortableText renderer", async () => {
      const page = {
        ...createDefaultPage("PortableText Page", "portabletext"),
        content: [
          {
            _type: "block",
            children: [{ _type: "span", text: "PortableText paragraph" }],
          },
        ],
      };

      const res = await app.request(
        "http://localhost/portabletext",
        { method: "GET" },
        mockEnv({
          initialData: {
            "system:admin_user": { username: "admin" },
            "system:onboarding_complete": true,
            "page:live:portabletext": page,
          },
        }),
      );

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("PortableText Page");
      expect(html).toContain("PortableText paragraph");
    });
  });
});

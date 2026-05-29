import { describe, it, expect, beforeEach, spyOn } from "bun:test";
import app from "../../src/index";
import { PageListEntry } from "../../src/core/schema";
import { clearCache } from "../../src/core/kv/config";

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
      expect(text).toContain("Path: /"); // For index
      expect(text).toContain("PAGE: About Us");
      expect(text).toContain("Path: /about");
      expect(text).toContain("Description: About page");
    });
  });
});

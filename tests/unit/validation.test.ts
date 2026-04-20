import { describe, expect, it, beforeEach, spyOn } from "bun:test";
import { z } from "zod";
import { validateForm, RequestWithBody } from "@utils/validation";

describe("Validation Utility (validateForm)", () => {
  const testSchema = z.object({
    username: z.string().min(3),
    count: z.number().int().positive(),
    isActive: z.boolean(),
    rating: z.number().min(0).max(5),
    tags: z.array(z.string()).default([]),
    seo: z.object({
      title: z.string().optional(),
      identity: z.object({
        type: z.enum(["Person", "Organization"]),
        links: z.array(z.object({
          platform: z.string(),
          url: z.string()
        })).optional()
      }).optional()
    }).optional()
  });

  beforeEach(() => {
    // Silence console for clean output
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
  });

  /**
   * Helper to create a mock request with body.
   */
  const mockReq = (body: any): RequestWithBody => ({
    parseBody: async () => body
  });

  describe("Basic Parsing & Normalization", () => {
    it("should parse standard form fields and handle basic type coercion", async () => {
      const body = { 
        username: "admin", 
        count: "10", 
        isActive: "true", 
        rating: "4.5" 
      };
      
      const result = await validateForm(mockReq(body), testSchema, {
        coerce: { count: "number", isActive: "boolean", rating: "number" }
      });

      expect(result.username).toBe("admin");
      expect(result.count).toBe(10);
      expect(result.isActive).toBe(true);
      expect(result.rating).toBe(4.5);
    });

    it("should correctly handle 'on' as true for boolean checkboxes (Admin HUD standard)", async () => {
      const body = { username: "user", count: "1", isActive: "on", rating: "5" };
      const result = await validateForm(mockReq(body), testSchema, {
        coerce: { isActive: "boolean", count: "number", rating: "number" }
      });
      expect(result.isActive).toBe(true);
    });

    it("should handle HTMX-style array notation (key[])", async () => {
      const body = {
        username: "dev",
        count: "1",
        isActive: "true",
        rating: "1",
        "tags[]": ["react", "bun", "hono"]
      };

      const result = await validateForm(mockReq(body), testSchema, {
        coerce: { count: "number", isActive: "boolean", rating: "number" }
      });
      expect(result.tags).toEqual(["react", "bun", "hono"]);
    });

    it("should handle single items in HTMX-style arrays by wrapping them", async () => {
      const body = { username: "dev", count: "1", isActive: "true", rating: "1", "tags[]": "standalone" };
      const result = await validateForm(mockReq(body), testSchema, {
        coerce: { count: "number", isActive: "boolean", rating: "number" }
      });
      expect(result.tags).toEqual(["standalone"]);
    });
  });

  describe("Advanced Structuring & Mapping", () => {
    it("should expand dot-notation keys into deeply nested objects", async () => {
      const body = {
        username: "admin",
        count: "1",
        isActive: "true",
        rating: "5",
        "seo.title": "My Page",
        "seo.identity.type": "Organization"
      };

      const result = await validateForm(mockReq(body), testSchema, {
        coerce: { count: "number", isActive: "boolean", rating: "number" }
      });
      expect(result.seo?.title).toBe("My Page");
      expect(result.seo?.identity?.type).toBe("Organization");
    });

    it("should apply custom mapping transformations before validation", async () => {
      const schema = z.object({ slug: z.string() });
      const body = { slug: "  Title with Spaces  " };
      
      const result = await validateForm(mockReq(body), schema, {
        map: {
          slug: (v) => v.trim().toLowerCase().replace(/\s+/g, "-")
        }
      });
      
      expect(result.slug).toBe("title-with-spaces");
    });
  });

  describe("Zip-Mapping (Dynamic Lists)", () => {
    it("should merge parallel arrays into structured objects with dot-notation support", async () => {
      const body = {
        "plt[]": ["Twitter", "GitHub"],
        "uri[]": ["https://twitter.com/ez", "https://github.com/ez"]
      };

      const zip = {
        "seo.identity.links": { platform: "plt[]", url: "uri[]" }
      };

      const result = await validateForm(mockReq(body), testSchema, { 
        zip, 
        partial: true 
      });

      expect(result.seo?.identity?.links).toHaveLength(2);
      expect(result.seo?.identity?.links?.[1].platform).toBe("GitHub");
      expect(result.seo?.identity?.links?.[1].url).toBe("https://github.com/ez");
    });

    it("should filter out rows where all mapped fields are empty", async () => {
      const body = {
        "label[]": ["Home", "", "Contact"],
        "path[]": ["/", "", "/contact"]
      };
      
      const schema = z.object({
        items: z.array(z.object({ label: z.string(), path: z.string() }))
      });

      const result = await validateForm(mockReq(body), schema, {
        zip: { items: { label: "label[]", path: "path[]" } }
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[1].label).toBe("Contact");
    });

    it("should handle zip-mapping when some arrays are shorter than others", async () => {
       const body = {
         "labels[]": ["A", "B", "C"],
         "urls[]": ["/a", "/b"] // Missing index 2
       };
       const schema = z.object({
         links: z.array(z.object({ l: z.string(), u: z.string().optional() }))
       });

       const result = await validateForm(mockReq(body), schema, {
         zip: { links: { l: "labels[]", u: "urls[]" } }
       });

       expect(result.links).toHaveLength(3);
       expect(result.links[2].l).toBe("C");
       expect(result.links[2].u).toBeUndefined();
    });
  });

  describe("Validation Modes & Error Handling", () => {
    it("should strictly enforce Zod constraints during full validation", async () => {
      const body = { username: "ok", count: "invalid" };
      const call = () => validateForm(mockReq(body), testSchema, {
        coerce: { count: "number" }
      });
      
      // Zod throws on NaN if z.number() is expected
      expect(call()).rejects.toThrow();
    });

    it("should handle partial updates by making all schema fields optional recursively", async () => {
      const body = { username: "new_name" };
      
      // Normally this would fail because 'count', 'isActive' etc are required
      const result = await validateForm(mockReq(body), testSchema, { partial: true });
      
      expect(result.username).toBe("new_name");
      expect(result.count).toBeUndefined();
    });

    it("should throw error if required field is missing in non-partial mode", async () => {
      const body = { username: "valid" }; // missing isActive, count, rating
      const call = () => validateForm(mockReq(body), testSchema);
      expect(call()).rejects.toThrow();
    });
  });
});

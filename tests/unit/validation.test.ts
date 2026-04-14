import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { validateForm, RequestWithBody } from "@utils/validation";

describe("validateForm", () => {
  const testSchema = z.object({
    username: z.string(),
    count: z.number().optional(),
    isActive: z.boolean().optional(),
    rating: z.number().optional(),
    tags: z.array(z.string()).optional(),
    seo: z
      .object({
        title: z.string().optional(),
        identity: z
          .object({
            links: z
              .array(
                z.object({
                  platform: z.string(),
                  url: z.string(),
                }),
              )
              .optional(),
          })
          .optional(),
      })
      .optional(),
  });

  test("should parse standard form data correctly", async () => {
    const mockReq: RequestWithBody = {
      parseBody: async () => ({ username: "test_user", count: "42" }),
    };

    const result = await validateForm(mockReq, testSchema, {
      coerce: { count: "number" },
    });
    expect(result.username).toBe("test_user");
    expect(result.count).toBe(42);
  });

  test("should handle HTMX-style arrays (key[])", async () => {
    const mockReq: RequestWithBody = {
      parseBody: async () => ({
        username: "user1",
        "tags[]": ["tag1", "tag2"],
      }),
    };

    const result = await validateForm(mockReq, testSchema);
    expect(result.tags).toEqual(["tag1", "tag2"]);
  });

  test("should handle single item for HTMX-style arrays", async () => {
    const mockReq: RequestWithBody = {
      parseBody: async () => ({
        username: "user1",
        "tags[]": "tag1",
      }),
    };

    const result = await validateForm(mockReq, testSchema);
    expect(result.tags).toEqual(["tag1"]);
  });

  test("should throw ZodError on missing required data", async () => {
    const mockReq: RequestWithBody = {
      parseBody: async () => ({ count: "10" }),
    };

    const call = () => validateForm(mockReq, testSchema);
    expect(call()).rejects.toThrow();
  });

  test("should expand dot-notation keys into nested objects", async () => {
    const mockReq: RequestWithBody = {
      parseBody: async () => ({
        username: "user1",
        "seo.title": "My Page",
      }),
    };

    const result = await validateForm(mockReq, testSchema);
    expect(result.seo?.title).toBe("My Page");
  });

  test("should handle zip-mapping with dot-notation keys", async () => {
    const schema = z.object({
      seo: z.object({
        identity: z.object({
          links: z.array(
            z.object({
              platform: z.string(),
              url: z.string(),
            }),
          ),
        }),
      }),
    });

    const mockReq: RequestWithBody = {
      parseBody: async () => ({
        "link_platform[]": ["Twitter", "GitHub"],
        "link_url[]": ["https://twitter.com", "https://github.com"],
      }),
    };

    const zip = {
      "seo.identity.links": { platform: "link_platform[]", url: "link_url[]" },
    };

    const result = await validateForm(mockReq, schema, { zip, partial: true });
    expect(result).toMatchObject({
      seo: {
        identity: {
          links: [
            { platform: "Twitter", url: "https://twitter.com" },
            { platform: "GitHub", url: "https://github.com" },
          ],
        },
      },
    });
  });
  test("should handle coercion for booleans and numbers", async () => {
    const mockReq: RequestWithBody = {
      parseBody: async () => ({
        username: "coerce_user",
        count: "100",
        isActive: "true",
        rating: "4.5",
      }),
    };

    const result = await validateForm(mockReq, testSchema, {
      coerce: {
        isActive: "boolean",
        count: "number",
        rating: "number",
      },
    });
    expect(result.count).toBe(100);
    expect(result.isActive).toBe(true);
    expect(result.rating).toBe(4.5);

    // Test 'on' for boolean (checkboxes)
    const mockReq2: RequestWithBody = {
      parseBody: async () => ({
        username: "checkbox_user",
        count: "1",
        isActive: "on",
      }),
    };
    const result2 = await validateForm(mockReq2, testSchema, {
      coerce: { isActive: "boolean", count: "number" },
    });
    expect(result2.isActive).toBe(true);
  });

  test("should handle empty zip configuration gracefully", async () => {
    const schema = z.object({ test: z.string().optional() });
    const req: RequestWithBody = {
      parseBody: async () => ({ test: "val" }),
    };

    const result = await validateForm(req, schema, {
      zip: {
        empty: {},
      },
    });

    expect(result.test).toBe("val");
    expect(result).not.toHaveProperty("empty");
  });

  test("should filter out completely empty rows in zip-mapping", async () => {
    const schema = z.object({
      links: z.array(z.object({ label: z.string(), url: z.string() })),
    });
    const req: RequestWithBody = {
      parseBody: async () => ({
        "label[]": ["Home", "", "About"],
        "url[]": ["/", "", "/about"],
      }),
    };

    const result = await validateForm(req, schema, {
      zip: {
        links: {
          label: "label[]",
          url: "url[]",
        },
      },
    });

    expect(result.links).toHaveLength(2);
    expect(result.links[0].label).toBe("Home");
    expect(result.links[1].label).toBe("About");
  });

  test("should handle empty fields in zip-mapping gracefully", async () => {
    const schema = z.object({
      tags: z.array(z.object({ name: z.string() })),
    });

    const mockReq: RequestWithBody = {
      parseBody: async () => ({
        "tag_name[]": ["tag1", "", "tag3"],
      }),
    };

    const result = await validateForm(mockReq, schema, {
      zip: { tags: { name: "tag_name[]" } },
    });

    expect(result.tags).toEqual([{ name: "tag1" }, { name: "tag3" }]);
  });

  test("should handle zip-mapping with single item correctly", async () => {
    const schema = z.object({
      tags: z.array(z.object({ name: z.string() })),
    });

    const mockReq: RequestWithBody = {
      parseBody: async () => ({
        tag_name: "single_tag",
      }),
    };

    const result = await validateForm(mockReq, schema, {
      zip: { tags: { name: "tag_name" } },
    });

    expect(result.tags).toEqual([{ name: "single_tag" }]);
  });

  test("should skip zip-mapping if targetKey fields are not in body", async () => {
    const schema = z.object({
      tags: z.array(z.object({ name: z.string() })).optional(),
    });

    const mockReq: RequestWithBody = {
      parseBody: async () => ({}),
    };

    const result = await validateForm(mockReq, schema, {
      zip: { tags: { name: "missing_field" } },
    });

    expect(result.tags).toEqual([]);
  });

  test("should skip zip-mapping if configuration is empty", async () => {
    const schema = z.object({ test: z.string() });
    const mockReq: RequestWithBody = {
      parseBody: async () => ({ test: "val" }),
    };

    const result = await validateForm(mockReq, schema, {
      zip: {} as any,
    });
    expect(result.test).toBe("val");
  });

  test("should handle partial schema validation", async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const mockReq: RequestWithBody = {
      parseBody: async () => ({ name: "test" }),
    };

    const result = await validateForm(mockReq, schema, { partial: true });
    expect(result).toMatchObject({ name: "test" });
  });

  test("should handle field-level mapping/transformation", async () => {
    const schema = z.object({
      size: z.string(),
      speed: z.string(),
    });

    const mockReq: RequestWithBody = {
      parseBody: async () => ({
        size: "100",
        speed: "2",
      }),
    };

    const result = await validateForm(mockReq, schema, {
      map: {
        size: (v) => `${v}px`,
        speed: (v) => `${v}s`,
      },
    });

    expect(result.size).toBe("100px");
    expect(result.speed).toBe("2s");
  });
});

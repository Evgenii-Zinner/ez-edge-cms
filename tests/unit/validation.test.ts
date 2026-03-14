import { expect, test, describe } from "bun:test";
import { z } from "zod";
import { validateForm } from "../../src/utils/validation";

describe("validateForm", () => {
  const testSchema = z.object({
    username: z.string(),
    labels: z.array(z.string()).optional(),
    count: z.string().transform((v) => parseInt(v, 10)),
    isActive: z.boolean().optional(),
    rating: z.number().optional(),
  });

  test("should parse standard form data correctly", async () => {
    const mockReq = {
      parseBody: async () => ({
        username: "johndoe",
        count: "42",
      }),
    };

    const result = await validateForm(mockReq, testSchema);
    expect(result).toEqual({ username: "johndoe", count: 42 });
  });

  test("should handle HTMX-style arrays (key[])", async () => {
    const mockReq = {
      parseBody: async () => ({
        username: "janedoe",
        "labels[]": ["work", "private"],
        count: "10",
      }),
    };

    const result = await validateForm(mockReq, testSchema);
    expect(result).toEqual({
      username: "janedoe",
      labels: ["work", "private"],
      count: 10,
    });
  });

  test("should handle single item for HTMX-style arrays", async () => {
    const mockReq = {
      parseBody: async () => ({
        username: "janedoe",
        "labels[]": "work",
        count: "10",
      }),
    };

    const result = await validateForm(mockReq, testSchema);
    expect(result).toEqual({
      username: "janedoe",
      labels: ["work"],
      count: 10,
    });
  });

  test("should throw ZodError on missing required data", async () => {
    const mockReq = {
      parseBody: async () => ({
        // missing username
        count: "10",
      }),
    };

    expect(validateForm(mockReq, testSchema)).rejects.toThrow();
  });

  test("should expand dot-notation keys into nested objects", async () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        meta: z.object({
          age: z.string(),
        }),
      }),
      settings: z.object({
        theme: z.string(),
      }),
    });

    const mockReq = {
      parseBody: async () => ({
        "user.name": "John",
        "user.meta.age": "30",
        "settings.theme": "dark",
      }),
    };

    const result = await validateForm(mockReq, schema);
    expect(result).toEqual({
      user: {
        name: "John",
        meta: {
          age: "30",
        },
      },
      settings: {
        theme: "dark",
      },
    });
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

    const mockReq = {
      parseBody: async () => ({
        "link_platform[]": ["Twitter", "GitHub"],
        "link_url[]": ["https://twitter.com", "https://github.com"],
      }),
    };

    const zip = {
      "seo.identity.links": { platform: "link_platform[]", url: "link_url[]" },
    };

    const result = await validateForm(mockReq, schema, { zip, partial: true });
    expect(result).toEqual({
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
    const mockReq = {
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
        rating: "number",
      },
    });

    expect(result.isActive).toBe(true);
    expect(result.rating).toBe(4.5);

    // Test 'on' for boolean (checkboxes)
    const mockReq2 = {
      parseBody: async () => ({
        username: "checkbox_user",
        count: "1",
        isActive: "on",
      }),
    };
    const result2 = await validateForm(mockReq2, testSchema, {
      coerce: { isActive: "boolean" },
    });
    expect(result2.isActive).toBe(true);
  });

  test("should handle empty fields in zip-mapping gracefully", async () => {
    const schema = z.object({
      tags: z.array(z.object({ name: z.string() })),
    });

    const mockReq = {
      parseBody: async () => ({
        "tag_name[]": ["tag1", "", "tag3"],
      }),
    };

    const result = await validateForm(mockReq, schema, {
      zip: { tags: { name: "tag_name[]" } },
    });

    // It should skip the empty one if logic allows, or keep it if it hasData.
    // Our logic says if (val) hasData = true. "" is falsy.
    expect(result.tags).toEqual([{ name: "tag1" }, { name: "tag3" }]);
  });

  test("should handle zip-mapping with single item correctly", async () => {
    const schema = z.object({
      tags: z.array(z.object({ name: z.string() })),
    });

    const mockReq = {
      parseBody: async () => ({
        "tag_name[]": "tag1",
      }),
    };

    const result = await validateForm(mockReq, schema, {
      zip: { tags: { name: "tag_name[]" } },
    });

    expect(result.tags).toEqual([{ name: "tag1" }]);
  });

  test("should skip zip-mapping if targetKey fields are not in body", async () => {
    const schema = z.object({
      tags: z.array(z.object({ name: z.string() })).default([]),
    });

    const mockReq = {
      parseBody: async () => ({
        other: "data",
      }),
    };

    const result = await validateForm(mockReq, schema, {
      zip: { tags: { name: "missing[]" } },
    });

    expect(result.tags).toEqual([]);
  });

  test("should skip zip-mapping if configuration is empty", async () => {
    const schema = z.object({
      data: z.any(),
    });
    const mockReq = { parseBody: async () => ({ a: 1 }) };
    const result = await validateForm(mockReq, schema, { zip: { data: {} } });
    expect(result.data).toBeUndefined();
  });
});

import { describe, it, expect } from "bun:test";

/**
 * Logic from BaseLayout.tsx
 */
const normalizePath = (path: string): string => {
  if (!path) return "/";
  if (
    path.startsWith("/") ||
    path.startsWith("http") ||
    path.startsWith("mailto:") ||
    path.startsWith("tel:") ||
    path.startsWith("#")
  ) {
    return path;
  }
  return `/${path}`;
};

/**
 * Logic from navigation.tsx
 */
const normalizeSavePath = (path: string): string => {
  if (!path) return "/";
  const p = path.trim();
  if (
    p.startsWith("/") ||
    p.startsWith("http") ||
    p.startsWith("mailto:") ||
    p.startsWith("tel:") ||
    p.startsWith("#")
  ) {
    return p;
  }
  return `/${p}`;
};

describe("Navigation Logic Normalization", () => {
  describe("normalizePath (Display Fix)", () => {
    it("should prepend / to relative paths", () => {
      expect(normalizePath("articles")).toBe("/articles");
      expect(normalizePath("about/us")).toBe("/about/us");
    });

    it("should NOT prepend / to absolute paths", () => {
      expect(normalizePath("/articles")).toBe("/articles");
    });

    it("should NOT prepend / to external URLs", () => {
      expect(normalizePath("https://google.com")).toBe("https://google.com");
      expect(normalizePath("http://mysite.com")).toBe("http://mysite.com");
    });

    it("should NOT prepend / to special links", () => {
      expect(normalizePath("#top")).toBe("#top");
      expect(normalizePath("mailto:test@test.com")).toBe(
        "mailto:test@test.com",
      );
      expect(normalizePath("tel:+12345")).toBe("tel:+12345");
    });

    it("should return / for empty path", () => {
      expect(normalizePath("")).toBe("/");
    });
  });

  describe("normalizeSavePath (Data Fix)", () => {
    it("should prepend / and trim", () => {
      expect(normalizeSavePath("  articles  ")).toBe("/articles");
    });

    it("should handle already absolute paths correctly", () => {
      expect(normalizeSavePath(" /articles ")).toBe("/articles");
    });
  });
});

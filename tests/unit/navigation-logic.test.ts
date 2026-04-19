import { describe, it, expect } from "bun:test";
import { normalizePath } from "@utils/seo";

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

  describe("normalizePath (Data Fix)", () => {
    it("should prepend / and trim", () => {
      expect(normalizePath("  articles  ")).toBe("/articles");
    });

    it("should handle already absolute paths correctly", () => {
      expect(normalizePath(" /articles ")).toBe("/articles");
    });
  });
});

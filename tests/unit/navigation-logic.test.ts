import { describe, it, expect, beforeEach, spyOn } from "bun:test";
import { normalizePath } from "@utils/seo";

describe("Navigation Logic Normalization", () => {
  beforeEach(() => {
    // Silence console for clean output
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
  });

  describe("normalizePath (Input Handling)", () => {
    it("should return / for empty, null, or undefined input", () => {
      expect(normalizePath("")).toBe("/");
      expect(normalizePath(null as any)).toBe("/");
      expect(normalizePath(undefined as any)).toBe("/");
    });

    it("should trim whitespace from input before processing", () => {
      expect(normalizePath("  articles  ")).toBe("/articles");
      expect(normalizePath("\n /about \t")).toBe("/about");
    });
  });

  describe("normalizePath (Internal Paths)", () => {
    it("should prepend / to relative internal paths", () => {
      expect(normalizePath("articles")).toBe("/articles");
      expect(normalizePath("blog/post-1")).toBe("/blog/post-1");
      expect(normalizePath("deeply/nested/slug/structure")).toBe(
        "/deeply/nested/slug/structure",
      );
    });

    it("should NOT prepend / to already absolute internal paths", () => {
      expect(normalizePath("/")).toBe("/");
      expect(normalizePath("/articles")).toBe("/articles");
      expect(normalizePath("/complex/path/with-dashes")).toBe(
        "/complex/path/with-dashes",
      );
    });

    it("should handle internal paths with query parameters and fragments", () => {
      expect(normalizePath("search?q=test")).toBe("/search?q=test");
      expect(normalizePath("about#team")).toBe("/about#team");
      expect(normalizePath("/already-absolute?debug=true#top")).toBe(
        "/already-absolute?debug=true#top",
      );
    });
  });

  describe("normalizePath (External & Special Protocols)", () => {
    it("should NOT modify external HTTP/HTTPS URLs", () => {
      expect(normalizePath("https://google.com")).toBe("https://google.com");
      expect(normalizePath("http://mysite.com/page")).toBe(
        "http://mysite.com/page",
      );
      expect(normalizePath("https://sub.domain.tld/path?query=1#hash")).toBe(
        "https://sub.domain.tld/path?query=1#hash",
      );
    });

    it("should NOT modify mailto: and tel: protocols", () => {
      expect(normalizePath("mailto:admin@example.com")).toBe(
        "mailto:admin@example.com",
      );
      expect(normalizePath("tel:+1234567890")).toBe("tel:+1234567890");
    });

    it("should NOT modify pure anchor/fragment links", () => {
      expect(normalizePath("#top")).toBe("#top");
      expect(normalizePath("#section-1")).toBe("#section-1");
    });

    it("should handle protocol-relative URLs as absolute internal paths", () => {
      // Protocol-relative URLs start with / so they are returned as-is
      expect(normalizePath("//google.com")).toBe("//google.com");
    });
  });

  describe("normalizePath (Edge Cases)", () => {
    it("should handle single characters correctly", () => {
      expect(normalizePath("a")).toBe("/a");
      expect(normalizePath("/")).toBe("/");
      expect(normalizePath("#")).toBe("#");
    });

    it("should handle paths that happen to contain protocol names inside them", () => {
      expect(normalizePath("my-http-service")).toBe("/my-http-service");
      expect(normalizePath("call-tel-now")).toBe("/call-tel-now");
    });
  });
});

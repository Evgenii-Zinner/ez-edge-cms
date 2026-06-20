import { describe, expect, it } from "bun:test";
import {
  generateId,
  getTermsTemplate,
  getPrivacyTemplate,
} from "../../src/core/templates";

describe("ContentTemplates Utilities", () => {
  describe("generateId", () => {
    it("should generate a 10-character alphanumeric string", () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toHaveLength(10);
      expect(id2).toHaveLength(10);
      expect(id1).not.toBe(id2);
      expect(/^[a-z0-9]+$/.test(id1)).toBe(true);
    });
  });

  describe("getTermsTemplate", () => {
    it("should return terms blocks with correct site, author, and date injected", () => {
      const site = "My Test Site";
      const author = "Test Author Inc.";
      const date = "2026-06-21";
      const blocks = getTermsTemplate(site, author, date);

      expect(blocks.length).toBeGreaterThan(0);
      const contentStr = JSON.stringify(blocks);
      expect(contentStr).toContain(site);
      expect(contentStr).toContain(author);
      expect(contentStr).toContain(date);
    });
  });

  describe("getPrivacyTemplate", () => {
    it("should return privacy blocks with correct site, author, and date injected", () => {
      const site = "Privacy Site";
      const author = "Privacy Author Corp.";
      const date = "2026-06-22";
      const blocks = getPrivacyTemplate(site, author, date);

      expect(blocks.length).toBeGreaterThan(0);
      const contentStr = JSON.stringify(blocks);
      expect(contentStr).toContain(site);
      expect(contentStr).toContain(author);
      expect(contentStr).toContain(date);
    });
  });
});

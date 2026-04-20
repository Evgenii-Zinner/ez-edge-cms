import { describe, it, expect, beforeAll, spyOn } from "bun:test";
import {
  generateSalt,
  hashPassword,
  generateSessionToken,
} from "../../src/utils/crypto";

describe("Crypto Utilities", () => {
  // Silence console during tests to keep output clean
  beforeAll(() => {
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
    spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("generateSalt", () => {
    it("should generate a 32-character hexadecimal string", () => {
      const salt = generateSalt();
      expect(typeof salt).toBe("string");
      expect(salt.length).toBe(32);
      expect(/^[0-9a-f]+$/.test(salt)).toBe(true); // Ensure only lowercase hex
    });

    it("should generate highly unique values in a batch", () => {
      const salts = new Set();
      const count = 100;
      for (let i = 0; i < count; i++) {
        salts.add(generateSalt());
      }
      expect(salts.size).toBe(count);
    });
  });

  describe("generateSessionToken", () => {
    it("should generate a 64-character hexadecimal string", () => {
      const token = generateSessionToken();
      expect(typeof token).toBe("string");
      expect(token.length).toBe(64);
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it("should generate highly unique tokens in a batch", () => {
      const tokens = new Set();
      const count = 100;
      for (let i = 0; i < count; i++) {
        tokens.add(generateSessionToken());
      }
      expect(tokens.size).toBe(count);
    });
  });

  describe("hashPassword", () => {
    const password = "mySuperSecretPassword123!";
    const salt = "randomsalt123";

    it("should produce a consistent hash for the same password and salt", async () => {
      const hash1 = await hashPassword(password, salt);
      const hash2 = await hashPassword(password, salt);
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe("string");
      expect(hash1.length).toBe(64); // SHA-256 hex is 64 chars
      expect(/^[0-9a-f]+$/.test(hash1)).toBe(true);
    });

    it("should produce a different hash for different passwords", async () => {
      const hash1 = await hashPassword(password, salt);
      const hash2 = await hashPassword("differentPassword", salt);
      expect(hash1).not.toBe(hash2);
    });

    it("should produce a different hash for the same password with different salt", async () => {
      const hash1 = await hashPassword(password, salt);
      const hash2 = await hashPassword(password, "differentSalt");
      expect(hash1).not.toBe(hash2);
    });

    it("should handle empty inputs gracefully", async () => {
      const hash1 = await hashPassword("", "");
      const hash2 = await hashPassword("", "");
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
    });

    it("should handle special characters and non-ASCII inputs", async () => {
      const pass = "🔑密码!@#$%^&*()_+-=[]{}|;':\",./<>?~` 日本語 🚀";
      const salt = "👻🔥";
      const hash = await hashPassword(pass, salt);
      expect(hash.length).toBe(64);
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    });
  });
});

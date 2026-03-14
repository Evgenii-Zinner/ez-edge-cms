import { describe, it, expect } from "bun:test";
import {
  generateSalt,
  hashPassword,
  generateSessionToken,
} from "../../src/utils/crypto";

describe("Crypto Utilities", () => {
  describe("generateSalt", () => {
    it("should generate a 32-character hexadecimal string", () => {
      const salt = generateSalt();
      expect(typeof salt).toBe("string");
      expect(salt.length).toBe(32);
      expect(/^[0-9a-f]+$/i.test(salt)).toBe(true);
    });

    it("should generate unique values", () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toBe(salt2);
    });
  });

  describe("generateSessionToken", () => {
    it("should generate a 64-character hexadecimal string", () => {
      const token = generateSessionToken();
      expect(typeof token).toBe("string");
      expect(token.length).toBe(64);
      expect(/^[0-9a-f]+$/i.test(token)).toBe(true);
    });

    it("should generate unique tokens", () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();
      expect(token1).not.toBe(token2);
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
  });
});

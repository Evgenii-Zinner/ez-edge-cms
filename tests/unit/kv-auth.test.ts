import { describe, it, expect, beforeEach, spyOn } from "bun:test";
import {
  getAdminUser,
  saveAdminUser,
  createSession,
  getSession,
  deleteSession,
} from "../../src/core/kv/auth";
import { AdminUserSchema } from "@core/schema";

/**
 * Enhanced Mock Environment for Authentication Tests.
 * Tracks expiration and ensures JSON consistency for Cloudflare KV.
 */
const createMockEnv = () => {
  const store = new Map<string, { value: any; expiration?: number }>();
  return {
    EZ_CONTENT: {
      get: async (key: string, options?: { type: "json" }) => {
        const entry = store.get(key);
        if (!entry) return null;
        
        // Handle expiration (primitive mock)
        if (entry.expiration && entry.expiration < Date.now()) {
          store.delete(key);
          return null;
        }

        const val = entry.value;
        if (options?.type === "json") {
          return typeof val === "string" ? JSON.parse(val) : val;
        }
        return typeof val === "object" ? JSON.stringify(val) : val;
      },
      put: async (key: string, value: any, options?: { expirationTtl?: number }) => {
        const entry: { value: any; expiration?: number } = { value };
        if (options?.expirationTtl) {
          entry.expiration = Date.now() + options.expirationTtl * 1000;
        }
        store.set(key, entry);
      },
      delete: async (key: string) => {
        store.delete(key);
      },
      // Test-only helper to inspect the store
      _getEntry: (key: string) => store.get(key),
    },
  } as any;
};

describe("KV Authentication Utilities", () => {
  let env: any;

  beforeEach(() => {
    env = createMockEnv();
    // Silence console for clean output
    spyOn(console, "error").mockImplementation(() => {});
    spyOn(console, "log").mockImplementation(() => {});
  });

  describe("AdminUser Management", () => {
    it("should return null if no admin user exists in KV", async () => {
      const user = await getAdminUser(env);
      expect(user).toBeNull();
    });

    it("should successfully save and retrieve a valid admin user", async () => {
      const mockUser = {
        username: "admin_user",
        passwordHash: "hash_abc_123",
        salt: "salt_xyz_789",
      };

      // Verify schema before saving (meaningful coverage)
      const validated = AdminUserSchema.parse(mockUser);
      await saveAdminUser(env, validated);
      
      const retrieved = await getAdminUser(env);
      expect(retrieved).toEqual(mockUser);
      expect(retrieved?.username).toBe("admin_user");
    });

    it("should overwrite existing admin user on subsequent saves", async () => {
      const user1 = { username: "one", passwordHash: "h1", salt: "s1" };
      const user2 = { username: "two", passwordHash: "h2", salt: "s2" };

      await saveAdminUser(env, user1);
      await saveAdminUser(env, user2);

      const retrieved = await getAdminUser(env);
      expect(retrieved?.username).toBe("two");
    });
  });

  describe("Session Management", () => {
    it("should create a session with 24h expiration (86400s)", async () => {
      const token = "secure_session_token";
      await createSession(env, token);

      const entry = env.EZ_CONTENT._getEntry(`auth:session:${token}`);
      expect(entry).toBeDefined();
      expect(entry.value).toBe("1");
      
      // Verify TTL was applied (approximate check)
      const now = Date.now();
      const expectedExp = now + 86400 * 1000;
      expect(entry.expiration).toBeGreaterThan(expectedExp - 5000);
      expect(entry.expiration).toBeLessThan(expectedExp + 5000);
    });

    it("should verify active sessions return true", async () => {
      const token = "active_token";
      await createSession(env, token);
      
      const isValid = await getSession(env, token);
      expect(isValid).toBe(true);
    });

    it("should return false for non-existent session tokens", async () => {
      const isValid = await getSession(env, "unknown_token");
      expect(isValid).toBe(false);
    });

    it("should return false for expired sessions", async () => {
      const token = "expired_token";
      // Manually inject expired entry
      env.EZ_CONTENT.put(`auth:session:${token}`, "1", { expirationTtl: -10 });
      
      const isValid = await getSession(env, token);
      expect(isValid).toBe(false);
    });

    it("should successfully delete a session (logout)", async () => {
      const token = "logout_token";
      await createSession(env, token);
      expect(await getSession(env, token)).toBe(true);

      await deleteSession(env, token);
      expect(await getSession(env, token)).toBe(false);
      expect(env.EZ_CONTENT._getEntry(`auth:session:${token}`)).toBeUndefined();
    });

    it("should not throw when deleting a non-existent session", async () => {
      // Should handle gracefully
      await deleteSession(env, "nothing");
      expect(await getSession(env, "nothing")).toBe(false);
    });
  });
});

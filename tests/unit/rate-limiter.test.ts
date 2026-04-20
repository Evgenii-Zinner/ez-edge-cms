import { describe, it, expect, beforeEach, spyOn } from "bun:test";
import { checkRateLimit } from "../../src/utils/rate-limiter";

/**
 * Enhanced Mock Environment for Rate Limiter Tests.
 * Correctly handles expirationTtl to simulate window-based limiting.
 */
const createMockEnv = () => {
  const store = new Map<string, { value: string; expiration?: number }>();
  return {
    EZ_CONTENT: {
      get: async (key: string) => {
        const entry = store.get(key);
        if (!entry) return null;
        
        // Handle expiration (primitive mock)
        if (entry.expiration && entry.expiration < Date.now()) {
          store.delete(key);
          return null;
        }
        return entry.value;
      },
      put: async (key: string, value: any, options?: { expirationTtl?: number }) => {
        const entry: { value: string; expiration?: number } = { value: value.toString() };
        if (options?.expirationTtl) {
          entry.expiration = Date.now() + options.expirationTtl * 1000;
        }
        store.set(key, entry);
      },
      // Test-only helper to inspect the raw store state
      _getEntry: (key: string) => store.get(key),
    },
  } as any;
};

describe("RateLimiter Utility", () => {
  let env: any;

  beforeEach(() => {
    env = createMockEnv();
    // Silence console for clean output
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
  });

  describe("checkRateLimit (Core Logic)", () => {
    it("should allow requests within the limit and return accurate remaining count", async () => {
      const ip = "127.0.0.1";
      const action = "test-action";
      const limit = 5;

      // First request (1/5)
      let result = await checkRateLimit(env, ip, action, limit);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);

      // Fifth request (5/5)
      for (let i = 0; i < 3; i++) await checkRateLimit(env, ip, action, limit);
      result = await checkRateLimit(env, ip, action, limit);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(0);

      // Sixth request (Blocked)
      result = await checkRateLimit(env, ip, action, limit);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should track different IPs and actions independently using unique KV keys", async () => {
      const limit = 1;
      
      // Different IPs
      const resIp1 = await checkRateLimit(env, "1.1.1.1", "login", limit);
      const resIp2 = await checkRateLimit(env, "2.2.2.2", "login", limit);
      expect(resIp1.success).toBe(true);
      expect(resIp2.success).toBe(true);

      // Different Actions for same IP
      const resAction1 = await checkRateLimit(env, "3.3.3.3", "login", limit);
      const resAction2 = await checkRateLimit(env, "3.3.3.3", "setup", limit);
      expect(resAction1.success).toBe(true);
      expect(resAction2.success).toBe(true);
    });

    it("should handle default limit (5) and window (60s) parameters", async () => {
      const ip = "4.4.4.4";
      const action = "default-check";
      
      // Fire 5 requests (default limit)
      for (let i = 0; i < 5; i++) {
        const res = await checkRateLimit(env, ip, action);
        expect(res.success).toBe(true);
      }
      
      // 6th should be blocked by default
      const blocked = await checkRateLimit(env, ip, action);
      expect(blocked.success).toBe(false);

      // Verify default expiration was applied to KV
      const entry = env.EZ_CONTENT._getEntry(`limit:${action}:${ip}`);
      expect(entry).toBeDefined();
      const now = Date.now();
      expect(entry.expiration).toBeGreaterThan(now + 55 * 1000); // Should be roughly now + 60s
    });
  });

  describe("Window & Expiration Logic", () => {
    it("should allow new requests after the sliding window expires", async () => {
      const ip = "5.5.5.5";
      const action = "expire-test";
      const limit = 1;
      const window = 1; // 1 second window

      // 1. Initial request (consumed)
      await checkRateLimit(env, ip, action, limit, window);
      
      // 2. Second request (blocked)
      let result = await checkRateLimit(env, ip, action, limit, window);
      expect(result.success).toBe(false);

      // 3. Manually simulate time passing beyond the window
      // Our mock Env handles expiration checking during 'get'
      const entry = env.EZ_CONTENT._getEntry(`limit:${action}:${ip}`);
      if (entry) entry.expiration = Date.now() - 1000; // Force it to be in the past

      // 4. Request after expiration (should be allowed again)
      result = await checkRateLimit(env, ip, action, limit, window);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it("should handle malformed or non-numeric counts in KV by defaulting to 0", async () => {
       const ip = "6.6.6.6";
       const action = "malformed-test";
       
       // Manually poison KV with non-numeric data
       await env.EZ_CONTENT.put(`limit:${action}:${ip}`, "not-a-number");
       
       // Should recover and allow request as if count was 0
       const result = await checkRateLimit(env, ip, action, 5);
       expect(result.success).toBe(true);
       expect(result.remaining).toBe(4);
    });
  });
});

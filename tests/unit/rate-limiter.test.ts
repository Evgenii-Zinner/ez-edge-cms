import { describe, it, expect, beforeEach } from "bun:test";
import { checkRateLimit } from "../../src/utils/rate-limiter";

const createMockEnv = () => {
  const store = new Map<string, any>();
  return {
    EZ_CONTENT: {
      get: async (key: string) => store.get(key),
      put: async (key: string, value: any) => store.set(key, value),
    },
  } as unknown as Env;
};

describe("RateLimiter Utility", () => {
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
  });

  it("should allow requests within the limit", async () => {
    const ip = "127.0.0.1";
    const action = "test";
    const limit = 3;

    let result = await checkRateLimit(env, ip, action, limit);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);

    result = await checkRateLimit(env, ip, action, limit);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(1);

    result = await checkRateLimit(env, ip, action, limit);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("should block requests exceeding the limit", async () => {
    const ip = "192.168.1.1";
    const action = "login";
    const limit = 2;

    await checkRateLimit(env, ip, action, limit);
    await checkRateLimit(env, ip, action, limit);

    const result = await checkRateLimit(env, ip, action, limit);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should track different IPs independently", async () => {
    const action = "setup";
    const limit = 1;

    const res1 = await checkRateLimit(env, "1.1.1.1", action, limit);
    const res2 = await checkRateLimit(env, "2.2.2.2", action, limit);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
  });

  it("should track different actions independently", async () => {
    const ip = "1.2.3.4";
    const limit = 1;

    const res1 = await checkRateLimit(env, ip, "action1", limit);
    const res2 = await checkRateLimit(env, ip, "action2", limit);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
  });
});

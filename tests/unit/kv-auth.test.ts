import { describe, it, expect } from "bun:test";
import {
  getAdminUser,
  saveAdminUser,
  createSession,
  getSession,
  deleteSession,
} from "../../src/core/kv";

// Mock Cloudflare Env object with an in-memory KV
const createMockEnv = () => {
  const store = new Map<string, string>();
  return {
    EZ_CONTENT: {
      get: async (key: string, _options?: { type: "json" }) => {
        const val = store.get(key);
        if (!val) return null;
        if (_options?.type === "json") return JSON.parse(val);
        return val;
      },
      put: async (
        key: string,
        value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
        _options?: any,
      ) => {
        store.set(key, value.toString());
      },
      delete: async (key: string) => {
        store.delete(key);
      },
    },
  } as unknown as Env;
};

describe("KV Authentication Utilities", () => {
  describe("AdminUser Management", () => {
    it("should return null if no admin user exists", async () => {
      const env = createMockEnv();
      const user = await getAdminUser(env);
      expect(user).toBeNull();
    });

    it("should successfully save and retrieve an admin user with salt", async () => {
      const env = createMockEnv();
      const mockUser = {
        username: "master_admin",
        passwordHash: "dummyHash123",
        salt: "funnySecretSalt456",
      };

      await saveAdminUser(env, mockUser);
      const retrievedUser = await getAdminUser(env);

      expect(retrievedUser).not.toBeNull();
      expect(retrievedUser?.username).toBe("master_admin");
      expect(retrievedUser?.passwordHash).toBe("dummyHash123");
      expect(retrievedUser?.salt).toBe("funnySecretSalt456");
    });
  });

  describe("Session Management", () => {
    it("should create and retrieve a session", async () => {
      const env = createMockEnv();
      const token = "mockToken789";

      expect(await getSession(env, token)).toBe(false);

      await createSession(env, token);
      expect(await getSession(env, token)).toBe(true);
    });

    it("should delete a session", async () => {
      const env = createMockEnv();
      const token = "tokenToDelete";

      await createSession(env, token);
      expect(await getSession(env, token)).toBe(true);

      await deleteSession(env, token);
      expect(await getSession(env, token)).toBe(false);
    });
  });
});

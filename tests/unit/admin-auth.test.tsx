import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import auth from "@routes/admin/auth";
import { GlobalConfigVariables } from "@core/middleware";
import { createDefaultTheme, createDefaultSite } from "@core/factory";
import { generateSalt, hashPassword } from "@utils/crypto";

/**
 * Tests for Administrative Authentication and Session Management.
 */
describe("Admin Auth Routes", () => {
  const setupApp = () => {
    const app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();
    app.use("*", async (c, next) => {
      const site = createDefaultSite();
      c.set("theme", createDefaultTheme());
      c.set("site", site);
      c.set("seo", site.seo);
      await next();
    });
    app.route("/admin", auth);
    return app;
  };

  const mockEnv = (overrides: any = {}) => {
    const store = new Map<string, any>();

    if (overrides.initialData) {
      for (const [k, v] of Object.entries(overrides.initialData)) {
        store.set(k, v);
      }
    }

    return {
      EZ_CONTENT: {
        get: async (key: string, options?: any) => {
          if (overrides.get) {
            const result = await overrides.get(key);
            if (result !== undefined) return result;
          }
          if (key.includes("rate_limit")) return null;
          return store.get(key) || null;
        },
        put: async (key: string, val: any) => {
          if (overrides.put) await overrides.put(key, val);
          const finalVal = typeof val === "string" ? JSON.parse(val) : val;
          store.set(key, finalVal);
        },
        delete: async (key: string) => {
          if (overrides.delete) await overrides.delete(key);
          store.delete(key);
        },
        list: async () => ({ keys: [], list_complete: true }),
      },
    } as any;
  };

  describe("GET /admin/setup", () => {
    it("should render setup form if no admin exists", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/setup",
        {
          method: "GET",
          headers: { "CF-Connecting-IP": "127.0.0.1" },
        },
        mockEnv(),
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toContain("INITIAL SETUP");
    });

    it("should redirect to login if admin already exists", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/setup",
        {
          method: "GET",
          headers: { "CF-Connecting-IP": "127.0.0.1" },
        },
        mockEnv({
          initialData: { "system:admin_user": { username: "admin" } },
        }),
      );

      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/admin/login");
    });
  });

  describe("POST /admin/setup", () => {
    it("should create admin and redirect to onboarding", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("username", "admin");
      formData.append("password", "password123");
      formData.append("repeatPassword", "password123");

      let savedData: any = null;
      const res = await app.request(
        "http://localhost/admin/setup",
        {
          method: "POST",
          body: formData,
          headers: { "CF-Connecting-IP": "127.0.0.1" },
        },
        mockEnv({
          put: async (key: string, val: string) => {
            if (key === "system:admin_user") {
              savedData = typeof val === "string" ? JSON.parse(val) : val;
            }
          },
        }),
      );

      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/admin/onboarding");
      expect(savedData.username).toBe("admin");
    });

    it("should return error if passwords mismatch", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("username", "admin");
      formData.append("password", "password123");
      formData.append("repeatPassword", "different");

      const res = await app.request(
        "http://localhost/admin/setup",
        {
          method: "POST",
          body: formData,
          headers: {
            "HX-Request": "true",
            "CF-Connecting-IP": "127.0.0.1",
          },
        },
        mockEnv(),
      );

      expect(await res.text()).toContain("Passwords do not match");
    });
  });

  describe("POST /admin/login", () => {
    it("should authenticate and create session", async () => {
      const app = setupApp();
      const salt = generateSalt();
      const passwordHash = await hashPassword("password123", salt);

      const formData = new FormData();
      formData.append("username", "admin");
      formData.append("password", "password123");

      let sessionCreated = false;
      const res = await app.request(
        "http://localhost/admin/login",
        {
          method: "POST",
          body: formData,
          headers: { "CF-Connecting-IP": "127.0.0.1" },
        },
        mockEnv({
          initialData: {
            "system:admin_user": { username: "admin", passwordHash, salt },
          },
          put: async (key: string) => {
            if (key.startsWith("auth:session:")) sessionCreated = true;
          },
        }),
      );

      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/admin");
      expect(sessionCreated).toBe(true);
    });

    it("should fail with invalid credentials", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("username", "admin");
      formData.append("password", "wrong-pass");

      const res = await app.request(
        "http://localhost/admin/login",
        {
          method: "POST",
          body: formData,
          headers: {
            "HX-Request": "true",
            "CF-Connecting-IP": "127.0.0.1",
          },
        },
        mockEnv({
          initialData: {
            "system:admin_user": {
              username: "admin",
              passwordHash: "real-hash",
              salt: "real-salt",
            },
          },
        }),
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toContain("Invalid credentials");
    });
  });

  describe("GET /admin/logout", () => {
    it("should clear session and redirect", async () => {
      const app = setupApp();
      let sessionDeleted = false;

      const res = await app.request(
        "http://localhost/admin/logout",
        {
          method: "GET",
          headers: { Cookie: "ez_session=test-token" },
        },
        mockEnv({
          delete: async () => {
            sessionDeleted = true;
          },
        }),
      );

      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/admin/login");
      expect(sessionDeleted).toBe(true);
    });
  });
});

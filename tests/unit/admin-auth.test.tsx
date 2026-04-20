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
          if (key.startsWith("limit:")) {
            if (overrides.rateLimit !== undefined) {
              const countStr = overrides.rateLimit
                ? overrides.rateLimit.count.toString()
                : null;
              if (options?.type === "json")
                return countStr ? JSON.parse(countStr) : null;
              return countStr;
            }
            return null;
          }
          if (overrides.get) {
            const result = await overrides.get(key);
            if (result !== undefined) return result;
          }
          const val = store.get(key) || null;
          if (options?.type === "json" || typeof val === "object") return val;
          return val ? JSON.stringify(val) : null;
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
      expect(res.headers.get("Set-Cookie")).toContain("ez_session=");
      expect(res.headers.get("Set-Cookie")).toContain("HttpOnly");
    });

    it("should fail if rate limited", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/setup",
        {
          method: "POST",
          headers: { "CF-Connecting-IP": "127.0.0.1" },
        },
        mockEnv({
          rateLimit: { count: 10, lastReset: Date.now() },
        }),
      );
      expect(res.status).toBe(429);
      expect(await res.text()).toContain("Too many setup attempts");
    });

    it("should handle missing IP header on setup and fall back to 'unknown'", async () => {
      const app = setupApp();
      let limitKeyCreated = false;
      const res = await app.request(
        "http://localhost/admin/setup",
        {
          method: "POST",
          headers: {
            // No CF-Connecting-IP
          },
        },
        mockEnv({
          put: async (key: string) => {
            if (key.includes(":setup:unknown")) limitKeyCreated = true;
          },
        }),
      );
      // It should proceed past rate limit (using 'unknown') and redirect because of missing body (validation error)
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/admin/setup?error=invalid");
      expect(limitKeyCreated).toBe(true);
    });

    it("should redirect if admin already exists", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/setup",
        {
          method: "POST",
          headers: { "CF-Connecting-IP": "127.0.0.1" },
        },
        mockEnv({
          initialData: { "system:admin_user": { username: "admin" } },
        }),
      );
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/admin/login");
    });

    it("should return error if credentials invalid without HX-Request", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("username", "admin");
      formData.append("password", "short");

      const res = await app.request(
        "http://localhost/admin/setup",
        {
          method: "POST",
          body: formData,
          headers: { "CF-Connecting-IP": "127.0.0.1" },
        },
        mockEnv(),
      );

      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/admin/setup?error=invalid");
    });

    it("should return error if credentials invalid with HX-Request", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("username", "admin");
      formData.append("password", "short");

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

      expect(await res.text()).toContain("Invalid credentials");
    });

    it("should return error if passwords mismatch without HX-Request", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("username", "admin");
      formData.append("password", "password123");
      formData.append("repeatPassword", "mismatch");

      const res = await app.request(
        "http://localhost/admin/setup",
        {
          method: "POST",
          body: formData,
          headers: { "CF-Connecting-IP": "127.0.0.1" },
        },
        mockEnv(),
      );

      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/admin/setup?error=mismatch");
    });

    it("should handle HX-Request success redirect", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("username", "admin");
      formData.append("password", "password123");
      formData.append("repeatPassword", "password123");

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

      expect(res.status).toBe(204);
      expect(res.headers.get("HX-Redirect")).toBe("/admin/onboarding");
    });

    it("should redirect to /admin if onboarding is complete", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("username", "admin");
      formData.append("password", "password123");
      formData.append("repeatPassword", "password123");

      const res = await app.request(
        "http://localhost/admin/setup",
        {
          method: "POST",
          body: formData,
          headers: { "CF-Connecting-IP": "127.0.0.1" },
        },
        mockEnv({
          initialData: { "system:onboarding_complete": true },
        }),
      );

      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/admin");
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

  describe("GET /admin/login", () => {
    it("should redirect to /admin/setup if no admin exists", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/login",
        {
          method: "GET",
          headers: { "CF-Connecting-IP": "127.0.0.1" },
        },
        mockEnv(),
      );
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/admin/setup");
    });

    it("should render login form if admin exists", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/login",
        {
          method: "GET",
          headers: { "CF-Connecting-IP": "127.0.0.1" },
        },
        mockEnv({
          initialData: { "system:admin_user": { username: "admin" } },
        }),
      );
      expect(res.status).toBe(200);
      expect(await res.text()).toContain("SYSTEM LOGIN");
    });

    it("should render login form with error if error query param exists", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/login?error=1",
        {
          method: "GET",
          headers: { "CF-Connecting-IP": "127.0.0.1" },
        },
        mockEnv({
          initialData: { "system:admin_user": { username: "admin" } },
        }),
      );
      expect(res.status).toBe(200);
      expect(await res.text()).toContain("Invalid credentials");
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
      expect(res.headers.get("Set-Cookie")).toContain("ez_session=");
      expect(res.headers.get("Set-Cookie")).toContain("HttpOnly");
      expect(res.headers.get("Set-Cookie")).toContain("Secure");
    });

    it("should handle HX-Request success redirect", async () => {
      const app = setupApp();
      const salt = generateSalt();
      const passwordHash = await hashPassword("password123", salt);

      const formData = new FormData();
      formData.append("username", "admin");
      formData.append("password", "password123");

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
            "system:admin_user": { username: "admin", passwordHash, salt },
          },
        }),
      );

      expect(res.status).toBe(204);
      expect(res.headers.get("HX-Redirect")).toBe("/admin");
    });

    it("should fail if rate limited without HX-Request", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/login",
        {
          method: "POST",
          headers: { "CF-Connecting-IP": "127.0.0.1" },
        },
        mockEnv({
          rateLimit: { count: 10, lastReset: Date.now() },
        }),
      );
      expect(res.status).toBe(429);
      expect(await res.text()).toContain("Too many login attempts");
    });

    it("should fail if rate limited with HX-Request", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/login",
        {
          method: "POST",
          headers: {
            "HX-Request": "true",
            "CF-Connecting-IP": "127.0.0.1",
          },
        },
        mockEnv({
          rateLimit: { count: 10, lastReset: Date.now() },
        }),
      );
      expect(res.status).toBe(200);
      expect(await res.text()).toContain("Too many failed attempts");
    });

    it("should redirect to setup if no admin exists on POST /login", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/login",
        {
          method: "POST",
          headers: { "CF-Connecting-IP": "127.0.0.1" },
        },
        mockEnv(),
      );
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/admin/setup");
    });

    it("should return error if credentials missing without HX-Request", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("username", "admin");

      const res = await app.request(
        "http://localhost/admin/login",
        {
          method: "POST",
          body: formData,
          headers: { "CF-Connecting-IP": "127.0.0.1" },
        },
        mockEnv({
          initialData: { "system:admin_user": { username: "admin" } },
        }),
      );

      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/admin/login?error=1");
    });

    it("should return error if credentials missing with HX-Request", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("username", "admin");

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
          initialData: { "system:admin_user": { username: "admin" } },
        }),
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toContain("Invalid credentials");
    });

    it("should return error if username invalid with HX-Request", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("username", "wrong");
      formData.append("password", "pass");

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
          initialData: { "system:admin_user": { username: "admin" } },
        }),
      );

      expect(await res.text()).toContain("Invalid credentials");
    });

    it("should return error if username invalid without HX-Request", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("username", "wrong");
      formData.append("password", "pass");

      const res = await app.request(
        "http://localhost/admin/login",
        {
          method: "POST",
          body: formData,
          headers: { "CF-Connecting-IP": "127.0.0.1" },
        },
        mockEnv({
          initialData: { "system:admin_user": { username: "admin" } },
        }),
      );

      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/admin/login?error=1");
    });

    it("should return error if password invalid without HX-Request", async () => {
      const app = setupApp();
      const salt = generateSalt();
      const passwordHash = await hashPassword("real", salt);

      const formData = new FormData();
      formData.append("username", "admin");
      formData.append("password", "wrong");

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
        }),
      );

      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/admin/login?error=1");
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

    it("should redirect on logout even if no session cookie exists", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/logout",
        {
          method: "GET",
          headers: {}, // No cookie
        },
        mockEnv(),
      );

      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/admin/login");
    });
  });
});

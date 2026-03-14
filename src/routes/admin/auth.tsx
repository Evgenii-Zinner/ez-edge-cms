/** @jsxImportSource hono/jsx */
/**
 * @module AdminAuth
 * @description Administrative authentication and session management.
 * Handles initial admin setup, secure login (password hashing with salt),
 * and session lifecycle (creation, verification, and destruction).
 */

import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { AdminLayout } from "@layouts/AdminLayout";
import {
  getAdminUser,
  saveAdminUser,
  createSession,
  deleteSession,
  getOnboardingStatus,
} from "@core/kv";
import { GlobalConfigVariables } from "@core/middleware";
import {
  generateSalt,
  hashPassword,
  generateSessionToken,
} from "@utils/crypto";
import { checkRateLimit } from "@utils/rate-limiter";
import { SetupForm, LoginForm } from "@routes/admin/auth-components";

/**
 * @description The Administrative Authentication router.
 * Handles setup, login, and logout flows.
 *
 * @param c - Hono context
 * @returns Hono router instance
 */
const auth = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();

/**
 * GET /admin/setup
 * Renders the one-time initial setup page.
 * Redirects to login if an administrator already exists.
 *
 * @param c - Hono context.
 * @returns An HTML response containing the Setup interface.
 */
auth.get("/setup", async (c) => {
  const adminExists = await getAdminUser(c.env);
  if (adminExists) {
    return c.redirect("/admin/login");
  }

  const { theme, site, seo } = c.var;

  return c.html(
    <AdminLayout
      title="CMS Setup"
      theme={theme}
      site={site}
      seo={seo}
      hideSidebar={true}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div class="admin-card" style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            INITIAL SETUP
          </h1>
          <p style={{ color: "var(--theme-text-dim)", marginBottom: "2rem" }}>
            Create the master administrator account.
          </p>

          <SetupForm />
        </div>
      </div>
    </AdminLayout>,
  );
});

/**
 * POST /admin/setup
 * Processes the creation of the master administrator.
 * Generates a unique salt and hashes the provided password.
 *
 * @param c - Hono context.
 * @returns A redirect response or an HTMX form partial on error.
 */
auth.post("/setup", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") || "unknown";
  const rateLimit = await checkRateLimit(c.env, ip, "setup", 3, 600);

  if (!rateLimit.success) {
    return c.text("Too many setup attempts. Please try again later.", 429);
  }

  const adminExists = await getAdminUser(c.env);
  if (adminExists) {
    return c.redirect("/admin/login");
  }

  const body = await c.req.parseBody();
  const username = body.username as string;
  const password = body.password as string;
  const repeatPassword = body.repeatPassword as string;

  // Basic validation for username and password strength
  if (!username || !password || password.length < 8) {
    if (c.req.header("HX-Request")) {
      return c.html(
        <SetupForm
          username={username}
          error="Invalid credentials. Password must be at least 8 characters."
        />,
      );
    }
    return c.redirect("/admin/setup?error=invalid");
  }

  // Ensure password confirmation matches
  if (password !== repeatPassword) {
    if (c.req.header("HX-Request")) {
      return c.html(
        <SetupForm username={username} error="Passwords do not match." />,
      );
    }
    return c.redirect("/admin/setup?error=mismatch");
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);

  await saveAdminUser(c.env, {
    username,
    passwordHash,
    salt,
  });

  // Automatically authenticate and create a session for the new user
  const token = generateSessionToken();
  await createSession(c.env, token);
  setCookie(c, "ez_session", token, {
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "Strict",
    maxAge: 86400,
  });

  // Determine redirection based on onboarding status
  const isComplete = await getOnboardingStatus(c.env);
  const redirectPath = isComplete ? "/admin" : "/admin/onboarding";

  if (c.req.header("HX-Request")) {
    c.header("HX-Redirect", redirectPath);
    return c.body(null, 204);
  }
  return c.redirect(redirectPath);
});

/**
 * GET /admin/login
 * Renders the secure login page.
 *
 * @param c - Hono context.
 * @returns An HTML response containing the Login interface.
 */
auth.get("/login", async (c) => {
  const adminExists = await getAdminUser(c.env);
  if (!adminExists) {
    return c.redirect("/admin/setup");
  }

  const { theme, site, seo } = c.var;
  const error = c.req.query("error");

  return c.html(
    <AdminLayout
      title="Admin Login"
      theme={theme}
      site={site}
      seo={seo}
      hideSidebar={true}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div class="admin-card" style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            SYSTEM LOGIN
          </h1>
          <p style={{ color: "var(--theme-text-dim)", marginBottom: "2rem" }}>
            Authenticate to access the HUD.
          </p>

          <LoginForm
            error={error ? "Invalid credentials. Please try again." : undefined}
          />
        </div>
      </div>
    </AdminLayout>,
  );
});

/**
 * POST /admin/login
 * Validates credentials and initializes an administrative session.
 * Employs salt-based hashing to verify the provided password.
 *
 * @param c - Hono context.
 * @returns A redirect response or an HTMX form partial on error.
 */
auth.post("/login", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") || "unknown";
  const rateLimit = await checkRateLimit(c.env, ip, "login", 5, 300);

  if (!rateLimit.success) {
    if (c.req.header("HX-Request")) {
      return c.html(
        <LoginForm error="Too many failed attempts. Please wait 5 minutes." />,
      );
    }
    return c.text("Too many login attempts. Please try again later.", 429);
  }

  const admin = await getAdminUser(c.env);
  if (!admin) {
    return c.redirect("/admin/setup");
  }

  const body = await c.req.parseBody();
  const username = body.username as string;
  const password = body.password as string;

  if (!username || !password) {
    if (c.req.header("HX-Request")) {
      return c.html(
        <LoginForm
          username={username}
          error="Invalid credentials. Please try again."
        />,
      );
    }
    return c.redirect("/admin/login?error=1");
  }

  // Username validation
  if (username !== admin.username) {
    if (c.req.header("HX-Request")) {
      return c.html(
        <LoginForm
          username={username}
          error="Invalid credentials. Please try again."
        />,
      );
    }
    return c.redirect("/admin/login?error=1");
  }

  // Password verification using the stored salt
  const testHash = await hashPassword(password, admin.salt);
  if (testHash !== admin.passwordHash) {
    if (c.req.header("HX-Request")) {
      return c.html(
        <LoginForm
          username={username}
          error="Invalid credentials. Please try again."
        />,
      );
    }
    return c.redirect("/admin/login?error=1");
  }

  // Session initialization
  const token = generateSessionToken();
  await createSession(c.env, token);
  setCookie(c, "ez_session", token, {
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "Strict",
    maxAge: 86400,
  });

  if (c.req.header("HX-Request")) {
    c.header("HX-Redirect", "/admin");
    return c.body(null, 204);
  }
  return c.redirect("/admin");
});

/**
 * GET /admin/logout
 * Terminates the current session and clears the session cookie.
 *
 * @param c - Hono context.
 * @returns A redirect response to the login page.
 */
auth.get("/logout", async (c) => {
  const token = getCookie(c, "ez_session");
  if (token) {
    await Promise.all([
      deleteSession(c.env, token),
      deleteCookie(c, "ez_session", { path: "/" }),
    ]);
  }
  return c.redirect("/admin/login");
});

export default auth;

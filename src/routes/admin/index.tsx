/** @jsxImportSource hono/jsx */
/**
 * @module AdminMain
 * @description The primary entry point for the Administrative HUD.
 * Orchestrates all administrative sub-routes and enforces strict
 * authentication and onboarding state checks via a global middleware layer.
 */

import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { csrf } from "hono/csrf";
import { GlobalConfigVariables } from "@core/middleware";
import { getAdminUser, getSession, getOnboardingStatus } from "@core/kv";
import dashboard from "@routes/admin/dashboard";
import theme from "@routes/admin/theme/index";
import pages from "@routes/admin/pages/index";
import site from "@routes/admin/site/index";
import files from "@routes/admin/files/index";
import navigation from "@routes/admin/navigation";
import auth from "@routes/admin/auth";
import onboarding from "@routes/admin/onboarding";

/**
 * @description The primary Administrative HUD router.
 * Orchestrates security middleware and mounts all administrative sub-routes.
 *
 * @param c - Hono context (implicitly handled by Hono)
 * @returns Hono router instance
 */
const admin = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();

// Enable CSRF protection for all administrative routes
admin.use("*", csrf());

/**
 * Middleware: Admin Security Headers & Origin Validation
 * Enforces strict security policies for the Administrative HUD:
 * 1. Prevents clickjacking by denying framing (X-Frame-Options).
 * 2. Restricts content sniffing (X-Content-Type-Options).
 * 3. Implements a restrictive Content Security Policy (CSP).
 * 4. Validates that the Origin header matches the current Host to ensure
 *    requests only originate from the site's own domain.
 */
admin.use("*", async (c, next) => {
  const origin = c.req.header("Origin");
  const host = c.req.header("Host");

  // Validate Origin if present (prevents cross-origin administrative access)
  if (origin && host) {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      return c.text("Security Violation: Unauthorized Origin", 403);
    }
  }

  // Inject security headers
  c.header("X-Frame-Options", "DENY");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy: Allows self-origin assets, Google Fonts, HTMX and Editor.js plugins
  c.header(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "img-src 'self' data: blob:; " +
      "connect-src 'self';",
  );

  await next();
});

// Mount the authentication sub-app (handles /admin/login, /admin/setup, etc.)
admin.route("/", auth);

/**
 * Middleware: Admin Security & Lifecycle
 * Intercepts all administrative requests to ensure:
 * 1. The system is initialized with an admin user.
 * 2. The user has a valid, active session (via cookie or Bearer token).
 * 3. The user has completed the onboarding flow before accessing the dashboard.
 */
admin.use("*", async (c, next) => {
  const path = c.req.path;

  // Skip auth checks for setup/login/logout routes
  if (
    path === "/admin/setup" ||
    path === "/admin/login" ||
    path === "/admin/logout"
  ) {
    return await next();
  }

  // 1. Ensure an admin user exists (redirect to setup if not)
  const adminUser = await getAdminUser(c.env);
  if (!adminUser) {
    return c.redirect("/admin/setup");
  }

  // 2. Resolve the session token from cookies or Authorization header
  let token = getCookie(c, "ez_session");
  const authHeader = c.req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // 3. Verify session validity
  if (!token) {
    return c.redirect("/admin/login");
  }

  const isValidSession = await getSession(c.env, token);
  if (!isValidSession) {
    return c.redirect("/admin/login");
  }

  // 4. Enforce onboarding completion (redirect if not complete)
  if (!path.startsWith("/admin/onboarding")) {
    const isComplete = await getOnboardingStatus(c.env);
    if (!isComplete) {
      return c.redirect("/admin/onboarding");
    }
  }

  await next();
});

// Mount administrative sub-apps
admin.route("/", dashboard);
admin.route("/theme", theme);
admin.route("/pages", pages);
admin.route("/site", site);
admin.route("/files", files);
admin.route("/navigation", navigation);
admin.route("/onboarding", onboarding);

export default admin;

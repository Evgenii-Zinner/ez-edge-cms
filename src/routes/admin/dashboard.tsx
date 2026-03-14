/** @jsxImportSource hono/jsx */
/**
 * @module AdminDashboard
 * @description Administrative dashboard for system status and quick actions.
 * Provides a high-level overview of the CMS's content status (live vs. draft)
 * and access to primary management tools.
 */

import { Hono } from "hono";
import { AdminLayout } from "@layouts/AdminLayout";
import { listPages, clearCache } from "@core/kv";
import { GlobalConfigVariables } from "@core/middleware";
import { APP_VERSION } from "@core/constants";

/**
 * Hono sub-app for the administrative dashboard.
 */
const admin = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();

/**
 * GET /admin
 * Renders the primary administrative dashboard.
 *
 * @param c - Hono context.
 * @returns A promise resolving to the rendered HTML dashboard.
 */
admin.get("/", async (c) => {
  const { theme, site, seo } = c.var;
  const livePages = await listPages(c.env, "live");
  const draftPages = await listPages(c.env, "draft");

  return c.html(
    <AdminLayout title="Dashboard" theme={theme} site={site} seo={seo}>
      <h1>Dashboard</h1>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="admin-card m-0">
          <h3>System Status</h3>
          <p>STATUS: ONLINE</p>
          <p>VERSION: {APP_VERSION}</p>
        </div>

        <div class="admin-card m-0">
          <h3>Content Overview</h3>
          <p>Live Pages: {livePages.length}</p>
          <p>Drafts: {draftPages.length}</p>
          <a
            href="/admin/pages"
            class="btn-primary"
            style={{ display: "inline-block", marginTop: "1rem" }}
          >
            MANAGE PAGES
          </a>
        </div>
      </div>

      <div class="admin-card mt-8">
        <h3>Quick Actions</h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <a href="/admin/theme" class="btn-primary">
            OPEN STYLER
          </a>
          <a href="/admin/site" class="btn-primary">
            SITE SETTINGS
          </a>
          <a href="/admin/navigation" class="btn-primary">
            EDIT NAVIGATION
          </a>
          <button class="btn-primary" hx-post="/admin/clear-cache">
            PURGE CACHE
          </button>
        </div>
      </div>
    </AdminLayout>,
  );
});

/**
 * POST /admin/clear-cache
 * Triggers a purge of the isolate-level in-memory cache.
 * Returns an HTMX partial to indicate success.
 *
 * @param c - Hono context.
 * @returns A promise resolving to an HTMX success message.
 */
admin.post("/clear-cache", async (c) => {
  clearCache();
  return c.html('<span style="color: #00ff00;">CACHE PURGED</span>');
});

export default admin;

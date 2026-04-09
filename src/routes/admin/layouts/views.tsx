/** @jsxImportSource hono/jsx */
/**
 * @module LayoutViews
 * @description GET route handlers for managing ELS Layout blueprints.
 * Provides the user interface for the Layout Manager and the JSON Pro Mode editor.
 */

import { Hono } from "hono";
import { AdminLayout } from "@layouts/AdminLayout";
import { listLayouts, getLayout } from "@core/kv";
import { GlobalConfigVariables } from "@core/middleware";
import { LayoutRow } from "@routes/admin/layouts/components";

/**
 * Hono sub-app for layout views.
 */
const views = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();

/**
 * GET /admin/layouts
 * Renders the primary Layout Manager interface.
 */
views.get("/", async (c) => {
  const { theme, site, seo } = c.var;
  const allLayouts = await listLayouts(c.env);
  
  return c.html(
    <AdminLayout title="Layout Manager" theme={theme} site={site} seo={seo}>
      <div class="flex justify-between items-center mb-8">
        <h1>Layout Manager</h1>
        <button 
          class="btn-primary"
          hx-post="/admin/layouts/repair-defaults"
          hx-swap="none"
          data-confirm="Re-initialize missing or corrupted default layouts?"
        >
          REPAIR DEFAULTS
        </button>
      </div>

      <div class="admin-card important-p-0">
        <table class="w-full border-collapse font-nav">
          <thead>
            <tr class="border-b border-b-solid border-[var(--theme-accent-glow)] text-left color-[var(--theme-accent)]">
              <th class="p-4">LAYOUT BLUEPRINT</th>
              <th class="p-4">ACTIONS</th>
            </tr>
          </thead>
          <tbody id="layouts-table-body">
            <tr class="border-b border-b-solid border-[var(--theme-accent-glow)] bg-[rgba(0,255,255,0.03)]">
              <td colSpan={2} class="p-0">
                <button
                  class="admin-action-btn"
                  onclick="document.getElementById('create-modal').classList.add('open')"
                >
                  <span class="text-1.5rem">+</span> CREATE NEW LAYOUT
                </button>
              </td>
            </tr>
            {allLayouts.map((slug) => (
              <LayoutRow slug={slug} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Creation Modal */}
      <div id="create-modal" class="modal-overlay">
        <div class="modal-content">
          <button
            class="modal-close"
            onclick="document.getElementById('create-modal').classList.remove('open')"
          >
            X
          </button>
          <h2 class="mt-0 text-1.2rem font-header">Create Layout</h2>
          <form hx-post="/admin/layouts/init">
            <label class="admin-label" htmlFor="inp-create-slug">
              Layout Slug (ID)
            </label>
            <input
              type="text"
              name="slug"
              id="inp-create-slug"
              placeholder="e.g. landing-page"
              class="admin-input"
              required
            />
            <p class="admin-helper-text">This unique name will identify the layout blueprint in the system.</p>
            <button class="btn-primary w-full mt-4 font-nav" type="submit">
              INITIALIZE BLUEPRINT
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
});

/**
 * GET /admin/layouts/:slug
 * Renders the "Pro Mode" JSON Editor for a specific layout blueprint.
 */
views.get("/:slug", async (c) => {
  const { theme, site, seo } = c.var;
  const slug = c.req.param("slug");
  const layout = await getLayout(c.env, slug);

  if (!layout) return c.redirect("/admin/layouts");

  return c.html(
    <AdminLayout 
      title={`Pro Mode: ${slug}`} 
      theme={theme} 
      site={site} 
      seo={seo}
    >
      <div class="flex justify-between items-center mb-8 border-b border-b-solid border-[var(--theme-accent-glow)] pb-4">
        <div>
          <h1 class="m-0">Pro Mode Editor: <span class="color-[var(--theme-primary)]">{slug}</span></h1>
          <div class="flex gap-8 mt-2 font-nav text-0.75rem color-[var(--theme-text-dim)]">
            <div id="save-status-container">
              SAVED:{" "}
              <span id="save-time" class="color-[var(--theme-text-main)]">
                UNKNOWN
              </span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <button 
            class="btn-primary"
            hx-post={`/admin/layouts/save/${encodeURIComponent(slug)}`}
            hx-include="#editor-form"
            hx-target="#save-time"
          >
            SAVE BLUEPRINT
          </button>
        </div>
      </div>

      <form id="editor-form">
        <div class="admin-card mt-8">
          <h3 class="mt-0 border-b border-b-solid border-[var(--theme-accent-glow)] pb-2 mb-4">
            Raw JSON Definition
          </h3>
          <p class="admin-helper-text mb-4">
            Directly modify the layout structure. Ensure valid JSON and adherence to the layout schema.
          </p>
          <textarea
            name="json"
            class="admin-input font-mono"
            rows={25}
            style={{
              fontFamily: "Fira Code, monospace",
              backgroundColor: "rgba(0,0,0,0.3)",
              color: "#00ffcc",
              lineHeight: "1.6"
            }}
          >
            {JSON.stringify(layout, null, 2)}
          </textarea>
        </div>
      </form>
    </AdminLayout>
  );
});

export default views;

/** @jsxImportSource hono/jsx */
/**
 * @module ShardViews
 * @description GET route handlers for managing Global Shards.
 * Provides the user interface for the Shard Manager and the JSON Pro Mode editor.
 */

import { Hono } from "hono";
import { AdminLayout } from "@layouts/AdminLayout";
import { listShards, getShard } from "@core/kv/shards";
import { GlobalConfigVariables } from "@core/middleware";
import { ShardRow } from "@routes/admin/shards/components";

/**
 * Hono sub-app for shard views.
 */
const views = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();

/**
 * GET /admin/shards
 * Renders the primary Shard Manager interface.
 */
views.get("/", async (c) => {
  const { theme, site, seo } = c.var;
  const allShards = await listShards(c.env);

  return c.html(
    <AdminLayout title="Global Shards" theme={theme} site={site} seo={seo}>
      <div class="flex justify-between items-center mb-8">
        <h1>Global Shards</h1>
        <button
          class="btn-primary"
          hx-post="/admin/shards/repair-defaults"
          hx-swap="none"
          data-confirm="Re-initialize missing or default global shards?"
        >
          REPAIR DEFAULTS
        </button>
      </div>

      <div class="admin-card important-p-0">
        <table class="w-full border-collapse font-nav">
          <thead>
            <tr class="border-b border-b-solid border-[var(--theme-accent-glow)] text-left color-[var(--theme-accent)]">
              <th class="p-4">SHARD ID</th>
              <th class="p-4">ACTIONS</th>
            </tr>
          </thead>
          <tbody id="shards-table-body">
            <tr class="border-b border-b-solid border-[var(--theme-accent-glow)] bg-[rgba(0,255,255,0.03)]">
              <td colSpan={2} class="p-0">
                <button
                  class="admin-action-btn"
                  onclick="document.getElementById('create-modal').classList.add('open')"
                >
                  <span class="text-1.5rem">+</span> CREATE NEW SHARD
                </button>
              </td>
            </tr>
            {allShards.map((id) => (
              <ShardRow id={id} />
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
          <h2 class="mt-0 text-1.2rem font-header">Create Global Shard</h2>
          <form hx-post="/admin/shards/init">
            <label class="admin-label" htmlFor="inp-create-id">
              Shard ID
            </label>
            <input
              type="text"
              name="id"
              id="inp-create-id"
              placeholder="e.g. site-footer"
              class="admin-input"
              required
            />
            <p class="admin-helper-text">
              This unique ID points to this specific UI component instance.
            </p>
            <button class="btn-primary w-full mt-4 font-nav" type="submit">
              INITIALIZE SHARD
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>,
  );
});

/**
 * GET /admin/shards/:id
 * Renders the "Pro Mode" JSON Editor for a specific global shard.
 */
views.get("/:id", async (c) => {
  const { theme, site, seo } = c.var;
  const id = c.req.param("id");
  const shard = await getShard(c.env, id);

  if (!shard) return c.redirect("/admin/shards");

  return c.html(
    <AdminLayout title={`Pro Mode: ${id}`} theme={theme} site={site} seo={seo}>
      <div class="flex justify-between items-center mb-8 border-b border-b-solid border-[var(--theme-accent-glow)] pb-4">
        <div>
          <h1 class="m-0">
            Pro Mode Editor:{" "}
            <span class="color-[var(--theme-primary)]">{id}</span>
          </h1>
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
            hx-post={`/admin/shards/save/${encodeURIComponent(id)}`}
            hx-include="#editor-form"
            hx-target="#save-time"
          >
            SAVE SHARD
          </button>
        </div>
      </div>

      <form id="editor-form" class="flex flex-col gap-8 w-full mt-8">
        {/* ROW 1: Structural Definition */}
        <div class="admin-card important-m-0">
          <div class="flex gap-4 items-center mb-6 border-b border-b-solid border-[var(--theme-accent-glow)] pb-4">
            <h3 class="m-0 flex-1">Structure Editor</h3>
            <label class="admin-label m-0">Model Component:</label>
            <input
              name="model"
              class="admin-input font-mono w-48 text-center important-my-0"
              value={shard.model}
              hx-trigger="keyup delay:500ms"
              hx-post="/admin/shards/preview"
              hx-target="#shard-preview"
              hx-include="#editor-form"
            />
          </div>

          <p class="admin-helper-text mb-4 mt-0">
            Define the raw JSON property structure mapped to the component model
            (Must match schema).
          </p>
          <textarea
            name="propsJson"
            class="admin-input font-mono w-full"
            rows={10}
            style={{
              fontFamily: "Fira Code, monospace",
              backgroundColor: "rgba(0,0,0,0.3)",
              color: "#00ffcc",
              lineHeight: "1.6",
            }}
            hx-trigger="keyup delay:500ms"
            hx-post="/admin/shards/preview"
            hx-target="#shard-preview"
            hx-include="#editor-form"
          >
            {JSON.stringify(shard.props || {}, null, 2)}
          </textarea>
        </div>

        {/* ROW 2: Styles & Preview */}
        <div class="flex flex-col lg:flex-row gap-8 w-full">
          {/* Col 1: CSS Editor */}
          <div class="admin-card flex-1 important-m-0 flex flex-col">
            <h3 class="mt-0 border-b border-b-solid border-[var(--theme-accent-glow)] pb-4 mb-4">
              Styles (CSS)
            </h3>
            <p class="admin-helper-text mb-4">
              Write pure CSS targeting this shard's block structure to achieve
              maximum edge-native design separation.
            </p>
            <textarea
              name="css"
              class="admin-input font-mono flex-1 w-full"
              rows={15}
              style={{
                fontFamily: "Fira Code, monospace",
                backgroundColor: "rgba(0,0,0,0.3)",
                color: "#ff88dd",
                lineHeight: "1.6",
              }}
              hx-trigger="keyup delay:500ms"
              hx-post="/admin/shards/preview"
              hx-target="#shard-preview"
              hx-include="#editor-form"
            >
              {shard.css || ""}
            </textarea>
          </div>

          {/* Col 2: Live Preview */}
          <div class="admin-card flex-1 important-m-0 flex flex-col">
            <div class="flex justify-between items-center border-b border-b-solid border-[var(--theme-accent-glow)] pb-4 mb-4">
              <h3 class="m-0">Live Preview</h3>
              <span class="text-0.75rem font-mono color-[var(--theme-accent)] animate-pulse shadow-[0_0_10px_var(--theme-accent)] px-2 py-1 rounded bg-[rgba(0,255,255,0.1)]">
                ● LIVE
              </span>
            </div>

            <div
              id="shard-preview"
              class="w-full flex-1 relative rounded-md border border-dashed border-[var(--theme-accent-glow)] overflow-hidden bg-[rgba(0,0,0,0.2)] pattern-dots pattern-black pattern-bg-transparent pattern-size-4 pattern-opacity-40"
              hx-post="/admin/shards/preview"
              hx-trigger="load"
              hx-include="#editor-form"
            >
              <div class="w-full h-full flex items-center justify-center color-[var(--theme-text-dim)] font-mono text-0.85rem">
                Initializing engine...
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>,
  );
});

export default views;

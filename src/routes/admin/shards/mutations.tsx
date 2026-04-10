/** @jsxImportSource hono/jsx */
import { Hono } from "hono";
import { saveShard, deleteShard, getShard } from "@core/kv/shards";
import { createDefaultShards } from "@core/factory";
import { toastResponse } from "@utils/admin-responses";
import { GlobalConfigVariables } from "@core/middleware";
import { renderELS } from "@utils/els-renderer";

const mutations = new Hono<{
  Bindings: Env;
  Variables: GlobalConfigVariables;
}>();

/**
 * POST /admin/shards/repair-defaults
 * Re-initializes standard shards (logo, hero, navigation, text, footer) if missing.
 */
mutations.post("/repair-defaults", async (c) => {
  let createdCount = 0;
  const defaultShards = createDefaultShards();

  for (const shard of defaultShards) {
    const existing = await getShard(c.env, shard.id);
    if (!existing) {
      await saveShard(c.env, shard.id, shard);
      createdCount++;
    }
  }

  if (createdCount > 0) {
    return toastResponse(
      c,
      `Repaired ${createdCount} global shard(s)`,
      "success",
    );
  }

  return toastResponse(c, "All default shards are already present.", "success");
});

/**
 * POST /admin/shards/init
 * Initializes a new shard structure.
 */
mutations.post("/init", async (c) => {
  const { id } = await c.req.parseBody();
  if (typeof id !== "string" || !id) {
    return toastResponse(c, "Invalid id", "error");
  }

  const normalizedId = id.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  await saveShard(c.env, normalizedId, {
    id: normalizedId,
    model: "Unknown",
    props: {},
    css: "",
  });

  return c.redirect(`/admin/shards/${normalizedId}`);
});

/**
 * POST /admin/shards/save/:id
 * Saves a global shard from the Dual Editors.
 */
mutations.post("/save/:id", async (c) => {
  const id = c.req.param("id");
  const { model, propsJson, css } = await c.req.parseBody();

  if (
    typeof model !== "string" ||
    typeof propsJson !== "string" ||
    typeof css !== "string"
  ) {
    return toastResponse(c, "Invalid payload fields", "error");
  }

  try {
    const props = JSON.parse(propsJson);
    const data = { id, model, props, css };
    await saveShard(c.env, id, data);
    const now = new Date().toLocaleString();
    const extra = `<span id="save-time" hx-swap-oob="innerHTML" class="color-[var(--color-success)]">${now}</span>`;
    return toastResponse(c, `Shard '${id}' updated`, "success", extra);
  } catch (e: any) {
    console.error("Shard Save Error:", e);
    const message = e.issues
      ? `Validation Error: ${e.issues[0].path.join(".")} - ${e.issues[0].message}`
      : `JSON Error: ${e.message}`;
    return toastResponse(c, message, "error");
  }
});

/**
 * POST /admin/shards/preview
 * Validates JSON payloads and dynamically renders the Shard for iframe-like live previewing
 * without committing standard operations. Throws HTML errors gracefully on syntax mistakes.
 */
mutations.post("/preview", async (c) => {
  const { model, propsJson, css } = await c.req.parseBody();

  try {
    const props =
      typeof propsJson === "string" && propsJson.trim()
        ? JSON.parse(propsJson)
        : {};

    // Construct mock shard for render stream
    const mockShard = {
      id: "preview-instance",
      model: typeof model === "string" ? model : "Unknown",
      props,
      css: typeof css === "string" ? css : "",
    };

    // Render it utilizing the exact same ELS pipeline standard layouts use
    const mockTree = {
      grid: {
        layout: "standard",
        sectors: [
          {
            id: "main",
            items: [mockShard],
          },
        ],
      },
    };

    const { theme, site, nav, footer } = c.var;

    return c.html(renderELS(mockTree, { theme, site, nav, footer }));
  } catch (e: any) {
    return c.html(
      <div class="p-6 bg-[#ff000018] border border-solid border-[#ff0000] color-[#ff0000] font-mono text-0.85rem rounded-md mt-4 shadow-[0_0_20px_rgba(255,0,0,0.2)]">
        <h3 class="mt-0 mb-2 font-bold uppercase tracking-widest text-1rem">
          Syntax Exception
        </h3>
        <p class="m-0 whitespace-pre-wrap">{e.message}</p>
      </div>,
    );
  }
});

/**
 * DELETE /admin/shards/:id
 * Removes a shard from KV.
 */
mutations.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await deleteShard(c.env, id);

  c.header("HX-Redirect", "/admin/shards");
  return c.text("");
});

export default mutations;

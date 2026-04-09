/** @jsxImportSource hono/jsx */
import { Hono } from "hono";
import { 
  saveShard, 
  deleteShard, 
  getShard
} from "@core/kv/shards";
import { 
  createDefaultShards
} from "@core/factory";
import { toastResponse } from "@utils/admin-responses";
import { GlobalConfigVariables } from "@core/middleware";

const mutations = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();

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
    return toastResponse(c, `Repaired ${createdCount} global shard(s)`, "success");
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
    props: {}
  });
  
  return c.redirect(`/admin/shards/${normalizedId}`);
});

/**
 * POST /admin/shards/save/:id
 * Saves a global shard from Pro Mode (JSON textarea).
 */
mutations.post("/save/:id", async (c) => {
  const id = c.req.param("id");
  const { json } = await c.req.parseBody();

  if (typeof json !== "string") {
    return toastResponse(c, "Invalid payload", "error");
  }

  try {
    const data = JSON.parse(json);
    await saveShard(c.env, id, data);
    const now = new Date().toLocaleString();
    const extra = `${now}<span id="save-time" hx-swap-oob="innerHTML" style="color: var(--color-success)">${now}</span>`;
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

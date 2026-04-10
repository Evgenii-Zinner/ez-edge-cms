/** @jsxImportSource hono/jsx */
import { Hono } from "hono";
import { saveLayout, deleteLayout, getLayout } from "@core/kv";
import {
  createBaseLayout,
  createHomeLayout,
  createArticleLayout,
} from "@core/factory";
import { toastResponse } from "@utils/admin-responses";
import { GlobalConfigVariables } from "@core/middleware";

const mutations = new Hono<{
  Bindings: Env;
  Variables: GlobalConfigVariables;
}>();

/**
 * POST /admin/layouts/repair-defaults
 * Re-initializes base, home, and article layouts if they are missing or invalid.
 */
mutations.post("/repair-defaults", async (c) => {
  const tasks = [];

  if (!(await getLayout(c.env, "base"))) {
    tasks.push(saveLayout(c.env, "base", createBaseLayout()));
  }
  if (!(await getLayout(c.env, "home"))) {
    tasks.push(saveLayout(c.env, "home", createHomeLayout()));
  }
  if (!(await getLayout(c.env, "article"))) {
    tasks.push(saveLayout(c.env, "article", createArticleLayout()));
  }

  if (tasks.length > 0) {
    await Promise.all(tasks);
    return toastResponse(c, `Repaired ${tasks.length} layout(s)`, "success");
  }

  return toastResponse(c, "All default layouts are valid", "success");
});

/**
 * POST /admin/layouts/init
 * Initializes a new layout with the base blueprint.
 */
mutations.post("/init", async (c) => {
  const { slug } = await c.req.parseBody();
  if (typeof slug !== "string" || !slug) {
    return toastResponse(c, "Invalid slug", "error");
  }

  const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  await saveLayout(c.env, normalizedSlug, createBaseLayout());

  return c.redirect(`/admin/layouts/${normalizedSlug}`);
});

/**
 * POST /admin/layouts/save/:slug
 * Saves a layout blueprint from Pro Mode (JSON textarea).
 */
mutations.post("/save/:slug", async (c) => {
  const slug = c.req.param("slug");
  const { json } = await c.req.parseBody();

  if (typeof json !== "string") {
    return toastResponse(c, "Invalid payload", "error");
  }

  try {
    const data = JSON.parse(json);
    await saveLayout(c.env, slug, data);
    const now = new Date().toLocaleString();
    const extra = `${now}<span id="save-time" hx-swap-oob="innerHTML" style="color: var(--color-success)">${now}</span>`;
    return toastResponse(c, `Layout '${slug}' updated`, "success", extra);
  } catch (e: any) {
    console.error("Layout Save Error:", e);
    const message = e.issues
      ? `Validation Error: ${e.issues[0].path.join(".")} - ${e.issues[0].message}`
      : `JSON Error: ${e.message}`;
    return toastResponse(c, message, "error");
  }
});

/**
 * DELETE /admin/layouts/:slug
 * Removes a layout blueprint from KV.
 */
mutations.delete("/:slug", async (c) => {
  const slug = c.req.param("slug");
  await deleteLayout(c.env, slug);

  c.header("HX-Redirect", "/admin/layouts");
  return c.text("");
});

export default mutations;

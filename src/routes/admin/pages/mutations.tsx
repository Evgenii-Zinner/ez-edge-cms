/** @jsxImportSource hono/jsx */
/**
 * @module PageMutations
 * @description POST route handlers for creating, saving, publishing, and deleting pages.
 * Handles the logic for state transitions and persistent storage of page-level data.
 */

import { Hono } from "hono";
import {
  savePage,
  getPage,
  publishPage,
  unpublishPage,
  deletePage,
} from "@core/kv";
import { createDefaultPage } from "@core/factory";
import { PROTECTED_SLUGS } from "@core/constants";
import { GlobalConfigVariables } from "@core/middleware";
import { PageSchema, PageConfig } from "@core/schema";
import { extractAndSaveImages } from "@utils/image-storage";
import { PageRow } from "@routes/admin/pages/components";
import { validateForm } from "@utils/validation";
import { toastResponse } from "@utils/admin-responses";

/**
 * Hono sub-app for page mutations.
 */
const mutations = new Hono<{
  Bindings: Env;
  Variables: GlobalConfigVariables;
}>();

/**
 * POST /admin/pages/create
 * Creates a new draft page based on a title and optional path prefix.
 *
 * @param c - Hono context.
 * @returns A promise resolving to an HTMX redirect or an error message.
 */
mutations.post("/create", async (c) => {
  const body = await c.req.parseBody();
  const title = body.title as string;
  const pathPrefix = (body.path as string) || "";

  if (!title) return c.text("Title is required", 400);

  const titleSlug = title.toLowerCase().replace(/[^\w]+/g, "-");
  let slug = pathPrefix
    ? pathPrefix.replace(/\/+$/, "") + "/" + titleSlug
    : titleSlug;
  slug = slug.replace(/^\/+|\/+$/g, "");

  const existingRaw = await Promise.race([
    c.env.EZ_CONTENT.get(`page:draft:${slug}`),
    c.env.EZ_CONTENT.get(`page:live:${slug}`),
  ]);

  if (existingRaw) return c.text(`Page "/${slug}" already exists.`, 400);

  await savePage(c.env, createDefaultPage(title, slug), "draft");
  c.header("HX-Redirect", `/admin/pages/edit/${encodeURIComponent(slug)}`);
  return c.text("Redirecting...");
});

/**
 * Internal Helper: Processes page data from a form submission and prepares it for persistence.
 * Handles image extraction from Editor.js content and merges metadata.
 *
 * @param c - Hono context.
 * @param slug - The unique slug of the page being mutated.
 * @returns A promise resolving to the fully updated PageConfig object.
 * @throws Error if the page is not found or validation fails.
 */
async function processPageMutation(c: any, slug: string): Promise<PageConfig> {
  const currentPage =
    (await getPage(c.env, slug, "draft")) ||
    (await getPage(c.env, slug, "live"));

  if (!currentPage) throw new Error("Page not found");

  // Use deepPartial to ensure all nested fields are also optional.
  // We omit 'content' because it comes as a JSON string from the form and we parse it manually.
  const partialSchema = PageSchema.omit({ content: true }).deepPartial();
  const validatedData = await validateForm(c.req, partialSchema);

  // Handle content separately
  let parsedContent = currentPage.content;
  const body = await c.req.parseBody();
  if (body.content) {
    try {
      const newContent = JSON.parse(body.content as string);
      parsedContent = await extractAndSaveImages(c.env, slug, newContent);
    } catch (e) {
      console.error("Failed to parse Editor.js JSON representation", e);
    }
  }

  // Extract block types for analytics
  let usedBlocks: string[] = [];
  if (parsedContent.blocks && Array.isArray(parsedContent.blocks)) {
    usedBlocks = Array.from(
      new Set(parsedContent.blocks.map((b: any) => b.type)),
    );
  }

  const finalDescription =
    (validatedData.description as string) || currentPage.description;

  const updatedPage = {
    ...currentPage,
    title: validatedData.title || currentPage.title,
    description: finalDescription,
    content: parsedContent,
    seo: {
      ...currentPage.seo,
      ...(validatedData.seo || {}),
      metaDescription: finalDescription,
    },
    appearance: {
      ...currentPage.appearance,
      ...(validatedData.appearance || {}),
    },
    metadata: {
      ...currentPage.metadata,
      updatedAt: new Date().toISOString(),
      usedBlocks,
    },
  };

  // Final full validation check
  const validatedPage = PageSchema.parse(updatedPage);

  await savePage(c.env, validatedPage, "draft");
  return validatedPage;
}

/**
 * POST /admin/pages/save/:slug
 * Updates a draft page's content and metadata based on form data.
 *
 * @param c - Hono context.
 * @returns A promise resolving to an HTMX success or error toast notification.
 */
mutations.post("/save/:slug{.+}", async (c) => {
  const slug = c.req.param("slug");
  try {
    await processPageMutation(c, slug);
    const now = new Date().toLocaleString();
    return toastResponse(c, "PAGE SAVED", "success", now);
  } catch (e: any) {
    return toastResponse(c, `SAVE FAILED: ${e.message}`, "error", "Failed");
  }
});

/**
 * POST /admin/pages/publish/:slug
 * Transitions a page from draft to live status.
 *
 * @param c - Hono context.
 * @returns A promise resolving to a re-rendered PageRow or a toast notification.
 */
mutations.post("/publish/:slug{.+}", async (c) => {
  const slug = c.req.param("slug");
  try {
    const body = await c.req.parseBody();
    if (body.title) {
      await processPageMutation(c, slug);
    }

    const success = await publishPage(c.env, slug);
    if (success) {
      if (c.req.header("HX-Target")?.startsWith("row-")) {
        return c.html(<PageRow slug={slug} isLive={true} isDraft={false} />);
      }
      const now = new Date().toLocaleString();
      const extra = `${now}<span id="publish-time" hx-swap-oob="innerHTML" style="color: var(--color-success)">${now}</span>`;
      return toastResponse(c, "PAGE PUBLISHED", "success", extra);
    }
    throw new Error("Publication failed");
  } catch (e: any) {
    return toastResponse(c, `PUBLISH FAILED: ${e.message}`, "error", "Failed");
  }
});

/**
 * POST /admin/pages/unpublish/:slug
 * Reverts a live page to draft status.
 *
 * @param c - Hono context.
 * @returns A promise resolving to a re-rendered PageRow or an error message.
 */
mutations.post("/unpublish/:slug{.+}", async (c) => {
  const slug = c.req.param("slug");
  const success = await unpublishPage(c.env, slug);
  if (success) {
    return c.html(<PageRow slug={slug} isLive={false} isDraft={true} />);
  }
  return c.text("Unpublish failed", 500);
});

/**
 * POST /admin/pages/delete/:slug
 * Permanently removes a page from KV storage.
 *
 * @param c - Hono context.
 * @returns A promise resolving to an HTMX trigger for page refresh.
 */
mutations.post("/delete/:slug{.+}", async (c) => {
  const slug = c.req.param("slug");
  const isProtected = (PROTECTED_SLUGS as readonly string[]).includes(slug);

  if (isProtected) return c.text("Cannot delete protected page", 400);

  await deletePage(c.env, slug);
  c.header("HX-Refresh", "true");
  return c.text("Page Deleted", 200);
});

export default mutations;

/** @jsxImportSource hono/jsx */
/**
 * @module SiteMutations
 * @description POST route handlers for site settings and system maintenance (backup/restore).
 * Manages the persistence of global site identity, SEO profiles, and data portability operations.
 */

import { Hono } from "hono";
import { saveSite, exportAllData, importAllData } from "@core/kv";
import { SiteSchema } from "@core/schema";
import { GlobalConfigVariables } from "@core/middleware";
import { saveSiteImage } from "@utils/image-storage";
import { validateForm } from "@utils/validation";
import { toastResponse } from "@utils/admin-responses";

/**
 * Hono sub-app for site mutations.
 */
const mutations = new Hono<{
  Bindings: Env;
  Variables: GlobalConfigVariables;
}>();

/**
 * POST /admin/site/save
 * Persists global site settings, handles image uploads, and merges social link updates.
 *
 * @param c - Hono context.
 * @returns A promise resolving to an HTMX success or error toast notification.
 */
mutations.post("/save", async (c) => {
  try {
    // 1. Process the main form data including zipped social links
    const validatedData = await validateForm(c.req, SiteSchema, {
      zip: {
        "seo.identity.links": {
          platform: "link_platform[]",
          url: "link_url[]",
        },
      },
      coerce: {
        showStatus: "boolean",
      },
      partial: true,
    });

    // 2. Handle image upload separately
    const body = await c.req.parseBody();
    const ogImageBase64 = body.ogImageBase64 as string;

    if (ogImageBase64) {
      validatedData.ogImage = await saveSiteImage(
        c.env,
        "og-image",
        ogImageBase64,
      );
    }

    // 3. Persist to KV
    const currentSite = c.var.site;
    const finalSite = {
      ...currentSite,
      ...validatedData,
      seo: {
        ...currentSite.seo,
        ...(validatedData.seo || {}),
        identity: {
          ...currentSite.seo.identity,
          ...(validatedData.seo?.identity || {}),
        },
      },
    };

    await saveSite(c.env, finalSite);
    return toastResponse(c, "SETTINGS SAVED", "success");
  } catch (e: any) {
    return toastResponse(c, `SAVE FAILED: ${e.message}`, "error");
  }
});

/**
 * GET /admin/site/backup
 * Exports all project-related data as a single JSON object.
 * Securely excludes administrative credentials and session data.
 *
 * @param c - Hono context.
 * @returns A promise resolving to a JSON response containing the full site backup.
 */
mutations.get("/backup", async (c) => {
  try {
    const data = await exportAllData(c.env);
    return c.json(data);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

/**
 * POST /admin/site/restore
 * Restores project data from an uploaded JSON backup file.
 * Destructive operation that overwrites existing data except for protected system keys.
 *
 * @param c - Hono context.
 * @returns A promise resolving to a success message or an error notification.
 */
mutations.post("/restore", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.backup as File;

    if (!file) {
      return c.text("RESTORE FAILED: No backup file provided", 400);
    }

    const content = await file.text();
    const data = JSON.parse(content);

    if (typeof data !== "object" || data === null) {
      throw new Error("Invalid backup format: Expected a JSON object");
    }

    const count = await importAllData(c.env, data);
    return c.text(`Successfully imported ${count} keys. Redirecting...`);
  } catch (e: any) {
    return c.text(`RESTORE FAILED: ${e.message}`, 500);
  }
});

export default mutations;

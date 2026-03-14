/** @jsxImportSource hono/jsx */
/**
 * @module AdminFiles
 * @description Administrative route handlers for managing root-level text files.
 * Provides an interface for editing robots.txt, llms.txt, humans.txt, and ads.txt.
 */

import { Hono } from "hono";
import { AdminLayout } from "@layouts/AdminLayout";
import { saveSite } from "@core/kv";
import { SiteSchema } from "@core/schema";
import { GlobalConfigVariables } from "@core/middleware";
import { AdminCard, AdminField, FormGrid } from "@components/AdminUI";
import { validateForm } from "@utils/validation";
import { toastResponse } from "@utils/admin-responses";
import { createDefaultTxtFiles } from "@core/factory";

/**
 * Hono sub-app for text file management.
 */
const filesAdmin = new Hono<{
  Bindings: Env;
  Variables: GlobalConfigVariables;
}>();

/**
 * GET /admin/files
 * Renders the Text Files Manager interface.
 *
 * @param c - Hono context.
 * @returns A promise resolving to the rendered HTML Text Files Manager.
 */
filesAdmin.get("/", async (c) => {
  const { theme, site, seo } = c.var;
  // Safety: Initialize txtFiles if missing from legacy data
  const files = site.txtFiles || {};

  return c.html(
    <AdminLayout title="Text Files Manager" theme={theme} site={site} seo={seo}>
      <div class="flex flex-col">
        {/* HEADER ZONE */}
        <div class="flex justify-between items-center mb-8">
          <h1>Text Files Manager</h1>
          <div class="flex gap-4 items-center">
            <button
              hx-post="/admin/files/reset"
              data-confirm="Overwrite all text files with factory defaults? This cannot be undone."
              class="btn-primary border-[#ff4444] color-[#ff4444]"
            >
              RESET DEFAULTS
            </button>
            <button class="btn-primary" type="submit" form="files-form">
              SAVE ALL FILES
            </button>
          </div>
        </div>

        {/* MAIN FORM AREA */}
        <form
          id="files-form"
          hx-post="/admin/files/save"
          hx-target="#global-toast"
          class="flex flex-col gap-8 pb-16"
        >
          <FormGrid>
            <AdminCard
              title="robots.txt"
              description={
                <>
                  Instructions for search engine crawlers. Controls which parts
                  of your site can be indexed.{" "}
                  <a
                    href="https://developers.google.com/search/docs/crawling-indexing/robots/intro"
                    target="_blank"
                    class="color-[var(--theme-accent)] no-underline border-b border-b-solid border-[var(--theme-accent-glow)]"
                  >
                    Learn more
                  </a>
                </>
              }
            >
              <AdminField
                label=""
                name="txtFiles.robots"
                type="textarea"
                rows={10}
                value={files.robots || ""}
                placeholder="User-agent: *\nAllow: /"
              />
            </AdminCard>

            <AdminCard
              title="llms.txt"
              description={
                <>
                  A standard for providing concise information and specific
                  instructions to AI crawlers and LLMs.{" "}
                  <a
                    href="https://llmstxt.org/"
                    target="_blank"
                    class="color-[var(--theme-accent)] no-underline border-b border-b-solid border-[var(--theme-accent-glow)]"
                  >
                    Learn more
                  </a>
                </>
              }
            >
              <AdminField
                label=""
                name="txtFiles.llms"
                type="textarea"
                rows={10}
                value={files.llms || ""}
                placeholder="Describe your site for AI agents..."
              />
            </AdminCard>
          </FormGrid>

          <FormGrid>
            <AdminCard
              title="humans.txt"
              description={
                <>
                  A file for "knowing the people behind the website". Credits,
                  team, and technology info.{" "}
                  <a
                    href="http://humanstxt.org/"
                    target="_blank"
                    class="color-[var(--theme-accent)] no-underline border-b border-b-solid border-[var(--theme-accent-glow)]"
                  >
                    Learn more
                  </a>
                </>
              }
            >
              <AdminField
                label=""
                name="txtFiles.humans"
                type="textarea"
                rows={10}
                value={files.humans || ""}
                placeholder="/* TEAM */\nDeveloper: Your Name..."
              />
            </AdminCard>

            <AdminCard
              title="ads.txt"
              description={
                <>
                  Authorized Digital Sellers file. Used by ad platforms to
                  verify your authorized sellers.{" "}
                  <a
                    href="https://iabtechlab.com/ads-txt/"
                    target="_blank"
                    class="color-[var(--theme-accent)] no-underline border-b border-b-solid border-[var(--theme-accent-glow)]"
                  >
                    Learn more
                  </a>
                </>
              }
            >
              <AdminField
                label=""
                name="txtFiles.ads"
                type="textarea"
                rows={10}
                value={files.ads || ""}
                placeholder="google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0"
              />
            </AdminCard>
          </FormGrid>
        </form>
      </div>
    </AdminLayout>,
  );
});

/**
 * POST /admin/files/reset
 * Overwrites all text files with factory defaults.
 *
 * @param c - Hono context.
 * @returns A promise resolving to an HTMX redirect or an error message.
 */
filesAdmin.post("/reset", async (c) => {
  try {
    const { site } = c.var;
    const baseUrl = site.baseUrl || new URL(c.req.url).origin;
    const defaults = createDefaultTxtFiles(baseUrl, site.author);

    const finalSite = {
      ...site,
      txtFiles: defaults,
    };

    await saveSite(c.env, finalSite);
    c.header("HX-Redirect", "/admin/files");
    return c.text("Files reset to defaults. Redirecting...");
  } catch (e: any) {
    return toastResponse(c, `RESET FAILED: ${e.message}`, "error");
  }
});

/**
 * POST /admin/files/save
 * Persists the updated text file configurations.
 *
 * @param c - Hono context.
 * @returns A promise resolving to an HTMX success or error toast notification.
 */
filesAdmin.post("/save", async (c) => {
  try {
    const validatedData = await validateForm(c.req, SiteSchema, {
      partial: true,
    });

    const currentSite = c.var.site;
    const finalSite = {
      ...currentSite,
      txtFiles: {
        ...(currentSite.txtFiles || {}),
        ...(validatedData.txtFiles || {}),
      },
    };

    await saveSite(c.env, finalSite);
    return toastResponse(c, "TEXT FILES UPDATED", "success");
  } catch (e: any) {
    return toastResponse(c, `SAVE FAILED: ${e.message}`, "error");
  }
});

export default filesAdmin;

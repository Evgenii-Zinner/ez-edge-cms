/** @jsxImportSource hono/jsx */
/**
 * @module PageViews
 * @description GET route handlers for listing and editing pages.
 * Provides the user interface for the Page Manager and the complex block-based editor.
 */

import { Hono } from "hono";
import { AdminLayout } from "@layouts/AdminLayout";
import { listPages, getPage } from "@core/kv";
import { PROTECTED_SLUGS } from "@core/constants";
import { BlockEditor } from "@components/BlockEditor";
import { GlobalConfigVariables } from "@core/middleware";
import { CustomSelect } from "@components/CustomSelect";
import { PageRow } from "@routes/admin/pages/components";

/**
 * Hono sub-app for page views.
 */
const views = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();

/**
 * GET /admin/pages
 * Renders the primary Page Manager interface listing all live and draft pages.
 *
 * @param c - Hono context.
 * @returns A promise resolving to the rendered HTML Page Manager.
 */
views.get("/", async (c) => {
  const { theme, site, seo } = c.var;
  const [liveSlugs, draftSlugs] = await Promise.all([
    listPages(c.env, "live"),
    listPages(c.env, "draft"),
  ]);
  const allSlugs = Array.from(new Set([...liveSlugs, ...draftSlugs])).sort();

  return c.html(
    <AdminLayout title="Pages" theme={theme} site={site} seo={seo}>
      <div class="flex justify-between items-center mb-8">
        <h1>Page Manager</h1>
      </div>

      <div class="admin-card important-p-0">
        <table class="w-full border-collapse font-nav">
          <thead>
            <tr class="border-b border-b-solid border-[var(--theme-accent-glow)] text-left color-[var(--theme-accent)]">
              <th class="p-4">PAGE PATH</th>
              <th class="p-4">STATUS</th>
              <th class="p-4">ACTIONS</th>
            </tr>
          </thead>
          <tbody id="pages-table-body">
            <tr class="border-b border-b-solid border-[var(--theme-accent-glow)] bg-[rgba(0,255,255,0.03)]">
              <td colSpan={3} class="p-0">
                <button
                  class="admin-action-btn"
                  onclick="document.getElementById('create-modal').classList.add('open')"
                >
                  <span class="text-1.5rem">+</span> CREATE NEW PAGE
                </button>
              </td>
            </tr>
            {allSlugs.map((slug) => (
              <PageRow
                slug={slug}
                isLive={liveSlugs.includes(slug)}
                isDraft={draftSlugs.includes(slug)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div id="create-modal" class="modal-overlay">
        <div class="modal-content">
          <button
            class="modal-close"
            onclick="document.getElementById('create-modal').classList.remove('open')"
          >
            X
          </button>
          <h2 class="mt-0 text-1.2rem">Create New Page</h2>
          <form hx-post="/admin/pages/create" hx-target="#create-error">
            <label class="admin-label" htmlFor="inp-create-title">
              Page Title
            </label>
            <input
              type="text"
              name="title"
              id="inp-create-title"
              placeholder="e.g. About Us"
              class="admin-input"
              required
            />
            <label class="admin-label" htmlFor="inp-create-path">
              Parent Path (Folder)
            </label>
            <input
              type="text"
              name="path"
              id="inp-create-path"
              placeholder="e.g. services/ (optional)"
              class="admin-input"
            />
            <div
              id="create-error"
              class="color-[#ff4444] font-nav text-0.8rem mb-4"
            ></div>
            <button class="btn-primary w-full" type="submit">
              CREATE PAGE
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>,
  );
});

/**
 * GET /admin/pages/edit/:slug
 * Renders the complex page editor for a specific slug.
 *
 * @param c - Hono context.
 * @returns A promise resolving to the rendered HTML Page Editor.
 */
views.get("/edit/:slug{.+}", async (c) => {
  try {
    const slug = c.req.param("slug");
    const isProtected = (PROTECTED_SLUGS as readonly string[]).includes(slug);
    const { theme, site, seo } = c.var;

    const page =
      (await getPage(c.env, slug, "draft")) ||
      (await getPage(c.env, slug, "live"));

    if (!page) return c.text(`Page not found: ${slug}`, 404);

    let lastSaved = "UNKNOWN";
    let lastPublished = "NEVER";

    try {
      if (page.metadata?.updatedAt) {
        lastSaved = new Date(page.metadata.updatedAt).toLocaleString();
      }
      if (page.metadata?.publishedAt) {
        lastPublished = new Date(page.metadata.publishedAt).toLocaleString();
      }
    } catch (e) {
      console.error("Failed to parse page metadata dates", e);
    }

    return c.html(
      <AdminLayout
        title={`Edit: ${page.title}`}
        theme={theme}
        site={site}
        seo={seo}
        isEditor={true}
      >
        <div class="flex justify-between items-center mb-8 border-b border-b-solid border-[var(--theme-accent-glow)] pb-4">
          <div>
            <h1 class="m-0">Edit Page: {page.title}</h1>
            <div class="flex gap-8 mt-2 font-nav text-0.75rem color-[var(--theme-text-dim)]">
              <div id="save-status-container">
                SAVED:{" "}
                <span id="save-time" class="color-[var(--theme-text-main)]">
                  {lastSaved}
                </span>
              </div>
              <div id="publish-status-container">
                PUBLISHED:{" "}
                <span id="publish-time" class="color-[var(--theme-text-main)]">
                  {lastPublished}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <button
              form="editor-form"
              type={isProtected ? "button" : "submit"}
              disabled={isProtected}
              class={`btn-primary ${isProtected ? "opacity-50 cursor-not-allowed border-[var(--theme-text-dim)] color-[var(--theme-text-dim)]" : ""}`}
            >
              SAVE DRAFT
            </button>
            <button
              class="btn-primary border-[#00ff00] color-[#00ff00]"
              hx-post={`/admin/pages/publish/${encodeURIComponent(slug)}`}
              hx-include="#editor-form"
              hx-target="#save-time"
            >
              PUBLISH LIVE
            </button>
          </div>
        </div>

        <div id="publish-status-oob" class="hidden"></div>

        <form
          id="editor-form"
          hx-post={`/admin/pages/save/${encodeURIComponent(slug)}`}
          hx-target="#save-time"
        >
          <div class="admin-card">
            <div class="grid grid-cols-2 gap-8">
              <div class="flex flex-col gap-6">
                <div>
                  <label class="admin-label" htmlFor="inp-page-title">
                    Page Title
                  </label>
                  <input
                    type="text"
                    id="inp-page-title"
                    name="title"
                    class="admin-input"
                    value={page.title}
                    required
                  />
                </div>
                <div>
                  <label class="admin-label" htmlFor="inp-page-desc">
                    Description (SEO)
                  </label>
                  <textarea
                    id="inp-page-desc"
                    name="description"
                    class="admin-input"
                    rows={2}
                  >
                    {page.description || ""}
                  </textarea>
                </div>
              </div>

              <div class="flex flex-col gap-6">
                <div>
                  <label class="admin-label" htmlFor="inp-page-type">
                    Page Layout
                  </label>
                  <CustomSelect
                    name="appearance.layout"
                    id="inp-page-type"
                    options={[
                      { value: "post", label: "Standard Post" },
                      { value: "page", label: "Full Page" },
                    ]}
                    selectedValue={page.appearance?.layout || "post"}
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="mt-8">
            <BlockEditor content={page.content} />
          </div>

          <div class="admin-card mt-8">
            <h3 class="mt-0 border-b border-b-solid border-[var(--theme-accent-glow)] pb-2">
              SEO & Metadata Overrides
            </h3>
            <div class="grid grid-cols-2 gap-8">
              <div>
                <label class="admin-label" htmlFor="seo-page-type">
                  Page Type (Schema.org)
                </label>
                <CustomSelect
                  name="seo.pageType"
                  id="seo-page-type"
                  selectedValue={page.seo?.pageType || "WebPage"}
                  options={[
                    { value: "WebPage", label: "WebPage (Default)" },
                    { value: "Article", label: "Article / Blog Post" },
                    { value: "AboutPage", label: "About Page" },
                    { value: "ContactPage", label: "Contact Page" },
                  ]}
                />
              </div>
              <div>
                <label class="admin-label" htmlFor="seo-meta-title">
                  Meta Title Override
                </label>
                <input
                  type="text"
                  name="seo.metaTitle"
                  id="seo-meta-title"
                  value={page.seo?.metaTitle || ""}
                  class="admin-input"
                  placeholder="Custom Browser Title"
                />
              </div>
            </div>
            <div class="mt-4">
              <label class="admin-label" htmlFor="seo-custom-scripts">
                Page-Related Custom Scripts
              </label>
              <textarea
                name="seo.customHeadScripts"
                id="seo-custom-scripts"
                class="admin-input font-mono"
                rows={6}
                placeholder="<script>...</script>\n<style>...</style>"
              >
                {page.seo?.customHeadScripts || ""}
              </textarea>
              <p class="admin-helper-text">
                Inject raw HTML tags at the end of the <code>&lt;body&gt;</code>
                of just this page.
              </p>
              <div class="color-[#ff4444] text-0.7rem font-nav mt-2 border-l-2 border-l-solid border-[#ff4444] pl-2">
                <strong>⚠️ SECURITY WARNING:</strong> Never paste scripts from
                untrusted sources. Malicious code can compromise your site and
                steal user data.
              </div>
            </div>
          </div>
        </form>
      </AdminLayout>,
    );
  } catch (err: any) {
    return c.html(
      <div style="padding: 2rem; color: #ff4444; font-family: monospace;">
        <h1>500 EDITOR ERROR</h1>
        <pre>{err.stack || err.message}</pre>
        <a href="/admin/pages" style="color: cyan;">
          Back to list
        </a>
      </div>,
      500,
    );
  }
});

export default views;

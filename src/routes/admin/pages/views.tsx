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
import { encodeSlug } from "@utils/validation";

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

    // Signal to the UnoCSS middleware to use the heavy editor generator
    c.set("isEditor" as any, true);

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
              class={`btn-primary ${isProtected ? "opacity-50 cursor-not-allowed border-[var(--theme-accent-glow)] color-[var(--theme-text-dim)]" : ""}`}
            >
              SAVE DRAFT
            </button>
            <button
              class="btn-primary border-[#00ff00] color-[#00ff00]"
              hx-post={`/admin/pages/publish/${encodeSlug(slug)}`}
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
          hx-post={`/admin/pages/save/${encodeSlug(slug)}`}
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
            {"blocks" in page.content ? (
              <BlockEditor content={page.content} />
            ) : (
              <div class="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
                <div class="admin-card h-fit">
                  <h3 class="mt-0 border-b border-b-solid border-[var(--theme-accent-glow)] pb-2 mb-4">
                    ELS STRUCTURE
                  </h3>
                  <p class="admin-helper-text mb-4">
                    Edit the raw JSON structure of this ELS page. Update properties within the <code>grid.sectors</code>.
                  </p>
                  <textarea
                    id="els-json-editor"
                    name="content"
                    class="admin-input font-mono"
                    rows={25}
                    style={{
                      fontFamily: "Fira Code, monospace",
                      backgroundColor: "rgba(0,0,0,0.3)",
                      color: "#00ffcc",
                      lineHeight: "1.6",
                      fontSize: "0.85rem",
                    }}
                    oninput={`
                      try {
                        JSON.parse(this.value);
                        this.style.borderColor = 'var(--theme-accent-glow)';
                        this.style.boxShadow = 'none';
                      } catch (e) {
                        this.style.borderColor = '#ff4444';
                        this.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.2)';
                      }
                    `}
                  >
                    {JSON.stringify(page.content, null, 2)}
                  </textarea>
                </div>

                <div class="flex flex-col gap-8">
                  <div class="admin-card h-fit border-l-4 border-l-solid border-[var(--theme-accent)]">
                    <h4 class="mt-0 mb-4 text-0.85rem tracking-2px uppercase color-[var(--theme-accent)]">
                      ASSET UPLOADER
                    </h4>
                    <div class="relative group cursor-pointer border-2 border-dashed border-[var(--theme-accent-glow)] p-6 text-center hover:bg-[rgba(0,255,204,0.05)] transition-all">
                      <input
                        type="file"
                        id="els-image-upload"
                        accept="image/*"
                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onchange={`
                          const file = this.files[0];
                          if (!file) return;
                          
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            const img = new Image();
                            img.onload = async () => {
                              const canvas = document.createElement('canvas');
                              const MAX_WIDTH = 1200;
                              const MAX_HEIGHT = 1200;
                              let width = img.width;
                              let height = img.height;

                              if (width > height) {
                                if (width > MAX_WIDTH) {
                                  height *= MAX_WIDTH / width;
                                  width = MAX_WIDTH;
                                }
                              } else {
                                if (height > MAX_HEIGHT) {
                                  width *= MAX_HEIGHT / height;
                                  height = MAX_HEIGHT;
                                }
                              }
                              canvas.width = width;
                              canvas.height = height;
                              const ctx = canvas.getContext('2d');
                              ctx.drawImage(img, 0, 0, width, height);
                              
                              const resizedBase64 = canvas.toDataURL('image/webp', 0.85);
                              
                              const formData = new FormData();
                              formData.append('image', resizedBase64);
                              
                              const uploadBtn = document.getElementById('els-upload-status');
                              if (uploadBtn) {
                                uploadBtn.innerText = 'UPLOADING...';
                                uploadBtn.classList.remove('hidden');
                              }

                              try {
                                const res = await fetch('/admin/pages/upload-image/${encodeSlug(slug)}', {
                                  method: 'POST',
                                  body: formData,
                                  headers: { 'HX-Request': 'true' }
                                });
                                const data = await res.json();
                                if (data.url) {
                                  const preview = document.getElementById('els-upload-preview');
                                  if (preview) {
                                    preview.src = data.url;
                                    preview.classList.remove('hidden');
                                  }
                                  
                                  const copyBtn = document.getElementById('els-copy-url');
                                  if (copyBtn) {
                                    copyBtn.onclick = () => {
                                      navigator.clipboard.writeText(data.url);
                                      copyBtn.innerText = 'COPIED!';
                                      setTimeout(() => copyBtn.innerText = 'COPY LINK', 2000);
                                    };
                                    copyBtn.classList.remove('hidden');
                                  }
                                  if (uploadBtn) {
                                    uploadBtn.innerText = 'UPLOAD COMPLETE';
                                    setTimeout(() => uploadBtn.classList.add('hidden'), 3000);
                                  }
                                }
                              } catch (err) {
                                console.error('Upload failed', err);
                                if (uploadBtn) uploadBtn.innerText = 'UPLOAD FAILED';
                              }
                            };
                            img.src = e.target.result;
                          };
                          reader.readAsDataURL(file);
                        `}
                      />
                      <div class="text-[var(--theme-accent)] mb-2">
                        <span class="text-2rem">+</span>
                      </div>
                      <div class="text-0.75rem font-nav tracking-1px opacity-60">
                        DROP IMAGE OR CLICK TO LOAD
                      </div>
                    </div>

                    <div class="mt-4 flex flex-col gap-4">
                      <div id="els-upload-status" class="hidden text-0.7rem font-mono text-[var(--theme-accent)] animate-pulse">
                        UPLOADING...
                      </div>
                      <img
                        id="els-upload-preview"
                        class="hidden w-full h-150px object-cover border border-solid border-[var(--theme-accent-glow)]"
                      />
                      <button
                        type="button"
                        id="els-copy-url"
                        class="hidden admin-action-btn text-0.7rem py-2"
                      >
                        COPY LINK
                      </button>
                    </div>
                  </div>

                  <div class="admin-card h-fit">
                    <h4 class="mt-0 mb-4 text-0.85rem tracking-2px uppercase opacity-60">
                      ACTIVE ASSETS
                    </h4>
                    <div
                      class="grid grid-cols-2 gap-2 max-h-400px overflow-y-auto pr-2"
                      id="els-asset-gallery"
                    >
                      {/* Extract images from flat JSON grid */}
                      {(() => {
                        const images: { src: string; id: string }[] = [];
                        const content = page.content as any;
                        if (content?.grid?.sectors) {
                          const traverse = (sectors: any[]) => {
                            sectors.forEach((s: any) => {
                              s.items.forEach((item: any) => {
                                if (item.props?.src)
                                  images.push({ src: item.props.src, id: item.id });
                                if (item.props?.url)
                                  images.push({ src: item.props.url, id: item.id });
                                if (item.sectors) traverse(item.sectors);
                              });
                            });
                          };
                          traverse(content.grid.sectors);
                        }
                        
                        return images.length > 0 ? (
                          images.map((img) => (
                            <div class="relative group aspect-square border border-solid border-[var(--theme-accent-glow)] overflow-hidden">
                              <img
                                src={img.src}
                                class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all"
                                loading="lazy"
                              />
                              <div 
                                class="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.8)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-0.6rem text-center p-1"
                                onclick={`navigator.clipboard.writeText('${img.src}'); this.innerText = 'COPIED!'; setTimeout(() => this.innerText = 'COPY PATH', 1500);`}
                              >
                                COPY PATH
                              </div>
                            </div>
                          ))
                        ) : (
                          <div class="col-span-2 py-8 text-center border border-dashed border-[var(--theme-accent-glow)] opacity-30 text-0.7rem uppercase tracking-1px">
                            No active assets
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
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

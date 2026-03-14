/** @jsxImportSource hono/jsx */
/**
 * @module App
 * @description Main Entry Point for the EZ EDGE CMS (Cloudflare Workers).
 * Orchestrates routing for the public site, auto-generated categories, and the Admin HUD.
 * This file handles system bootstrapping, middleware injection (UnoCSS, Config),
 * and the universal content resolution logic that maps slugs to KV-stored pages.
 */

import { Hono } from "hono";
import { BaseLayout } from "@layouts/BaseLayout";
import {
  getPage,
  listPages,
  getInitializedStatus,
  getAdminUser,
  ensureSystemDefaults,
} from "@core/kv";
import { renderEditorJs, getFirstImage } from "@utils/editorjs-parser";
import admin from "@routes/admin/index";
import { injectGlobalConfig, GlobalConfigVariables } from "@core/middleware";
import { injectUnoCSS } from "@core/unocss-middleware";

const app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();
// Global Middleware: Inject site-wide configurations and the UnoCSS engine into the context.
app.use("*", injectGlobalConfig());
app.use("*", injectUnoCSS());

/**
 * Binary Image Delivery Route.
...

 * Fetches binary image data from KV based on the slug and filename.
 */
app.get("/images/*", async (c) => {
  const path = c.req.path;
  const relativePath = path.substring(8);
  const lastSlashIndex = relativePath.lastIndexOf("/");

  if (lastSlashIndex === -1) return c.notFound();

  const slug = relativePath.substring(0, lastSlashIndex);
  const filename = relativePath.substring(lastSlashIndex + 1);

  const imageKey = `img:${slug}:${filename}`;
  const { value, metadata } = await c.env.EZ_CONTENT.getWithMetadata<{
    contentType: string;
  }>(imageKey, "arrayBuffer");

  if (!value) return c.notFound();

  const contentType = metadata?.contentType || "image/webp";
  c.header("Content-Type", contentType);
  c.header("Cache-Control", "public, max-age=31536000, immutable");

  return c.body(value as ArrayBuffer);
});

/**
 * System Initialization & Access Check.
 * Ensures the system is initialized with defaults and an administrator exists.
 */
app.get("/", async (c, next) => {
  const adminExists = await getAdminUser(c.env);
  const isInitialized = await getInitializedStatus(c.env);

  if (!adminExists && !isInitialized) {
    await ensureSystemDefaults(c.env);
    return c.redirect("/admin/setup");
  }

  if (!adminExists) return c.redirect("/admin/setup");
  await next();
});

/**
 * Sitemap.xml Generator.
 */
app.get("/sitemap.xml", async (c) => {
  const slugs = await listPages(c.env, "live");
  const baseUrl = new URL(c.req.url).origin;

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${slugs
    .map((slug) => {
      const url = slug === "index" ? baseUrl : `${baseUrl}/${slug}`;
      return `<url><loc>${url}</loc></url>`;
    })
    .join("\n")}
</urlset>`;

  c.header("Content-Type", "application/xml");
  return c.body(sitemap);
});

/**
 * Robots.txt with automatic sitemap link.
 * Ensures the 'Sitemap:' directive provides an absolute URL as required by search engine standards.
 *
 * @param c - Hono context.
 * @returns A promise resolving to the plain-text robots.txt content.
 */
app.get("/robots.txt", async (c) => {
  const site = c.var.site;
  const baseUrl = new URL(c.req.url).origin;
  const content =
    site.txtFiles?.robots || "User-agent: *\nAllow: /\nDisallow: /admin/";

  /**
   * If the content already contains a Sitemap directive, we leave it untouched.
   * Otherwise, we append the absolute URL to the sitemap.xml.
   */
  const finalContent = content.includes("Sitemap:")
    ? content
    : `${content}\nSitemap: ${baseUrl}/sitemap.xml`;

  return c.text(finalContent);
});

/**
 * Metadata Files (LLMs, humans, ads).
 */
app.get("/llms.txt", (c) => c.text(c.var.site.txtFiles?.llms || ""));
app.get("/humans.txt", (c) => c.text(c.var.site.txtFiles?.humans || ""));
app.get("/ads.txt", (c) => c.text(c.var.site.txtFiles?.ads || ""));

/**
 * Admin HUD Sub-app.
 */
app.route("/admin", admin);

/**
 * Universal Content Resolution.
 * Resolves slugs to specific pages or dynamic category listings.
 */
app.get("/*", async (c) => {
  const path = c.req.path;
  const slug = path === "/" ? "index" : path.substring(1).replace(/\/$/, "");

  const { theme, nav, site, footer } = c.var;
  const detectedUrl = new URL(c.req.url).origin;

  const page = await getPage(c.env, slug, "live");
  if (page) {
    const contentHtml = renderEditorJs(page.content);
    return c.html(
      <BaseLayout
        title={page.title}
        theme={theme}
        nav={nav}
        site={site}
        footer={footer}
        page={page}
        description={page.description}
        detectedUrl={detectedUrl}
      >
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </BaseLayout>,
    );
  }

  const isNavPath = nav.items.some(
    (item) => item.path === path || item.path === `/${slug}`,
  );

  const allLiveSlugs = await listPages(c.env, "live");
  const subSlugs = allLiveSlugs.filter((s) => s.startsWith(slug + "/"));

  if (subSlugs.length > 0 || isNavPath) {
    const subPages = (
      await Promise.all(subSlugs.map((s) => getPage(c.env, s, "live")))
    ).filter((p) => p !== null);

    return c.html(
      <BaseLayout
        title={slug.toUpperCase()}
        theme={theme}
        nav={nav}
        site={site}
        footer={footer}
        detectedUrl={detectedUrl}
      >
        <div class="mb-12 border-l-4 border-solid border-[var(--theme-accent)] pl-6">
          <h1 class="text-2.5rem mb-2">{slug.toUpperCase()}</h1>
          <p class="text-[var(--theme-text-dim)] m-0 italic opacity-80 font-nav text-0.85rem tracking-1px uppercase">
            ARCHIVE EXPLORER // {subPages.length} ENTRIES FOUND IN THIS SECTOR
          </p>
        </div>

        {subPages.length > 0 ? (
          <div class="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8 my-12">
            {subPages.map((p) => {
              const thumbnail = p!.featuredImage || getFirstImage(p!.content);
              return (
                <a
                  href={`/${p!.slug}`}
                  class="bento-item group no-underline h-full overflow-hidden"
                >
                  <div class="flex flex-col h-full">
                    {thumbnail && (
                      <div
                        class="w-full h-180px mb-4 border border-solid border-[var(--theme-accent-glow)] overflow-hidden"
                        style={{
                          background: `url(${thumbnail}) center/cover no-repeat`,
                        }}
                      >
                        <div class="w-full h-full bg-[rgba(0,0,0,0.3)] group-hover:bg-transparent transition-all duration-500"></div>
                      </div>
                    )}
                    <h3 class="font-header text-[var(--theme-accent)] m-0 mb-3 text-1.2rem group-hover:drop-shadow-[0_0_8px_var(--theme-accent-glow)] transition-all">
                      {p!.title}
                    </h3>
                    {p!.description && (
                      <p class="text-0.85rem text-[var(--theme-text-dim)] line-clamp-3 m-0 flex-grow font-body leading-relaxed">
                        {p!.description}
                      </p>
                    )}
                    <div class="mt-6 flex items-center gap-2 text-0.75rem font-nav uppercase tracking-2px text-[var(--theme-accent)] opacity-60 group-hover:opacity-100 transition-all">
                      ACCESS DATA{" "}
                      <span class="group-hover:translate-x-1 transition-transform">
                        &rarr;
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div class="py-24 text-center border border-dashed border-[var(--theme-accent-glow)] opacity-50">
            <p class="font-nav uppercase tracking-2px">
              SECTOR IS CURRENTLY EMPTY // NO DATA ENTRIES DETECTED
            </p>
          </div>
        )}
      </BaseLayout>,
    );
  }

  return c.html(
    <BaseLayout
      title="404: Sector Not Found"
      theme={theme}
      nav={nav}
      site={site}
      footer={footer}
      detectedUrl={detectedUrl}
    >
      <div class="text-center py-24">
        <h1 class="text-4rem mb-4 font-header tracking-widest text-[var(--theme-accent)] drop-shadow-[0_0_15px_var(--theme-accent-glow)]">
          404: SECTOR NOT FOUND
        </h1>
        <p class="mb-12 text-[var(--theme-text-dim)] font-nav uppercase tracking-2px opacity-80">
          The coordinate <strong>/${slug}</strong> does not exist in our current
          database.
        </p>
        <a
          href="/"
          class="btn-primary no-underline inline-block px-10 py-4 transition-all hover:scale-105"
          style={{ textShadow: "none" }}
        >
          RETURN TO HOME SECTOR
        </a>
      </div>
    </BaseLayout>,
    404,
  );
});

export default app;

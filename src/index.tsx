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
import { renderPortableText } from "@utils/portabletext-parser";
import admin from "@routes/admin/index";
import { injectUnoCSS } from "@core/unocss-middleware";
import { injectGlobalConfig, GlobalConfigVariables } from "@core/middleware";
import { themeRegistry } from "@core/theme";
const app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();
// Global Middleware: Inject site-wide configurations into the context.
app.use("*", injectGlobalConfig());
app.use("*", injectUnoCSS());

/**
 * Binary Image Delivery Route.
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
  const pages = await listPages(c.env, "live");
  const baseUrl = new URL(c.req.url).origin;

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
      .map((p) => {
        const url = p.slug === "index" ? baseUrl : `${baseUrl}/${p.slug}`;
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
app.get("/llms-full.txt", async (c) => {
  // Generate a brief overview of the site directly from the index metadata
  const livePages = await listPages(c.env, "live");
  const pages = livePages.filter(
    (p) => p.slug !== "terms" && p.slug !== "privacy",
  );

  let content = `# Site Content Overview: ${c.var.site.title}\n`;
  if (c.var.site.tagline) content += `${c.var.site.tagline}\n`;
  content += `\n[Sitemap: ${c.var.site.baseUrl || new URL(c.req.url).origin}/sitemap.xml]\n\n`;

  for (const page of pages) {
    content += `--- PAGE: ${page.title} ---\n`;
    content += `Path: /${page.slug === "index" ? "" : page.slug}\n`;
    if (page.description) content += `Description: ${page.description}\n`;
    if (page.publishedAt) content += `Published: ${page.publishedAt}\n`;
    content += "\n";
  }

  return c.text(content.trim());
});
app.get("/humans.txt", (c) => c.text(c.var.site.txtFiles?.humans || ""));
app.get("/ads.txt", (c) => c.text(c.var.site.txtFiles?.ads || ""));
app.get("/security.txt", (c) =>
  c.text(
    c.var.site.txtFiles?.security ||
    `Contact: mailto:${c.var.site.adminEmail}\nPreferred-Languages: en`,
  ),
);
app.get("/.well-known/security.txt", (c) =>
  c.text(
    c.var.site.txtFiles?.security ||
    `Contact: mailto:${c.var.site.adminEmail}\nPreferred-Languages: en`,
  ),
);
app.get("/.well-known/mta-sts.txt", (c) =>
  c.text(c.var.site.txtFiles?.mtaSts || ""),
);
app.get("/.well-known/traffic-advice", (c) =>
  c.body('[{"user_agent": "prefetch-proxy", "fraction": 1.0}]', 200, {
    "Content-Type": "application/json",
  }),
);

/**
 * Common Redirects.
 */
app.get("/.well-known/change-password", (c) => c.redirect("/admin"));

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
  const stylingSystem = theme.values.styling_system || "ruri";
  const connector = themeRegistry.get(stylingSystem);
  const ThemeUI = connector.components;
  const tokens = connector.tokens!;

  if (page) {
    const contentHtml = renderPortableText(
      Array.isArray(page.content) ? page.content : [],
      stylingSystem,
    );
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
        currentPath={new URL(c.req.url).pathname}
      >
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </BaseLayout>,
    );
  }

  const isNavPath = nav.items.some(
    (item) => item.path === path || item.path === `/${slug}`,
  );

  const allLivePages = await listPages(c.env, "live");
  const subPages = allLivePages.filter((p) => p.slug.startsWith(slug + "/"));

  if (subPages.length > 0 || isNavPath) {
    // Implement pagination and sorting from the index metadata
    const ITEMS_PER_PAGE = 12;
    const pageParam = c.req.query("page");
    const currentPage = pageParam ? parseInt(pageParam, 10) : 1;
    const safePage = isNaN(currentPage) || currentPage < 1 ? 1 : currentPage;

    // Sort newest first
    subPages.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt).getTime();
      const dateB = new Date(b.publishedAt || b.createdAt).getTime();
      return dateB - dateA;
    });

    const totalItems = subPages.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedPages = subPages.slice(startIndex, endIndex);

    return c.html(
      <BaseLayout
        title={slug.toUpperCase()}
        theme={theme}
        nav={nav}
        site={site}
        footer={footer}
        detectedUrl={detectedUrl}
        currentPath={new URL(c.req.url).pathname}
      >
        <div class={`mb-12 border-l-4 border-solid pl-6`} style={{ borderColor: tokens.primary }}>
          <h1 class="text-2.5rem mb-2">{slug.toUpperCase()}</h1>
          <p class="m-0 italic opacity-80 font-nav text-0.85rem tracking-1px uppercase" style={{ color: tokens.textMuted }}>
            ARCHIVE EXPLORER // {totalItems} ENTRIES FOUND // PAGE {safePage} OF{" "}
            {totalPages || 1}
          </p>
        </div>

        {paginatedPages.length > 0 ? (
          <>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 my-12">
              {paginatedPages.map((p) => {
                const thumbnail = p.featuredImage;
                return (
                  <a
                    href={`/${p.slug}`}
                    class="no-underline h-full flex flex-col group"
                  >
                    <ThemeUI.Card title={p.title} glow={true} class="h-full">
                      {thumbnail && (
                        <div
                          class={`w-full h-180px mb-4 border border-solid overflow-hidden relative`}
                          style={{
                            borderColor: tokens.border,
                            background: `url(${thumbnail}) center/cover no-repeat`,
                          }}
                        >
                          <div class="w-full h-full bg-[rgba(0,0,0,0.3)] group-hover:bg-transparent transition-all duration-500"></div>
                        </div>
                      )}
                      {p.description && (
                        <p class="text-0.85rem line-clamp-3 m-0 flex-grow font-body leading-relaxed opacity-80">
                          {p.description}
                        </p>
                      )}
                      <div class="mt-6 flex items-center gap-2 text-0.75rem font-mono uppercase tracking-2px opacity-70 group-hover:opacity-100 transition-all" style={{ color: tokens.primary }}>
                        ACCESS DATA{" "}
                        <span class="group-hover:translate-x-1 transition-transform">
                          &rarr;
                        </span>
                      </div>
                    </ThemeUI.Card>
                  </a>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div class="flex justify-between items-center mt-12 border-t border-solid pt-6" style={{ borderColor: tokens.border }}>
                {safePage > 1 ? (
                  <a
                    href={`?page=${safePage - 1}`}
                    class="no-underline font-mono text-0.8rem uppercase tracking-2px px-6 py-2 border border-solid transition-all hover:opacity-100 opacity-80"
                    style={{ color: tokens.primary, borderColor: tokens.primary }}
                  >
                    &larr; PREVIOUS SECTOR
                  </a>
                ) : (
                  <div></div>
                )}
                {safePage < totalPages ? (
                  <a
                    href={`?page=${safePage + 1}`}
                    class="no-underline font-mono text-0.8rem uppercase tracking-2px px-6 py-2 border border-solid transition-all hover:opacity-100 opacity-80"
                    style={{ color: tokens.primary, borderColor: tokens.primary }}
                  >
                    NEXT SECTOR &rarr;
                  </a>
                ) : (
                  <div></div>
                )}
              </div>
            )}
          </>
        ) : (
          <div class="py-24 text-center border border-dashed opacity-50" style={{ borderColor: tokens.border }}>
            <p class="font-nav uppercase tracking-2px" style={{ color: tokens.textMuted }}>
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
      currentPath={new URL(c.req.url).pathname}
    >
      <div class="text-center py-24">
        <h1
          class="text-4rem mb-4 font-header tracking-widest"
          style={{ color: tokens.primary }}
        >
          404: SECTOR NOT FOUND
        </h1>
        <p class="mb-12 font-nav uppercase tracking-2px opacity-80" style={{ color: tokens.textMuted }}>
          The coordinate <strong>/{slug}</strong> does not exist in our current
          database.
        </p>
        <a
          href="/"
          class="no-underline inline-block px-10 py-4 border border-solid font-mono text-0.85rem uppercase tracking-2px transition-all hover:scale-105"
          style={{
            color: tokens.primary,
            borderColor: tokens.primary,
            textShadow: "none",
          }}
        >
          RETURN TO HOME SECTOR
        </a>
      </div>
    </BaseLayout>,
    404,
  );
});

export default app;

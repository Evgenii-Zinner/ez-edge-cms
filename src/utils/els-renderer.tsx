/** @jsxImportSource hono/jsx */
import {
  type SiteConfig,
  type ThemeConfig,
  type NavConfig,
  type FooterConfig,
  type ELSContent,
  type AssembledGrid,
  type AssembledSector,
  type AssembledShard,
} from "@core/schema";
import { getShardStyle } from "@core/kv/shards";

/**
 * Global rendering context for ELS components.
 * Provides access to site-wide configurations and request-specific metadata.
 */
export interface RenderContext {
  site: SiteConfig;
  theme: ThemeConfig;
  nav: NavConfig;
  footer: FooterConfig;
  /** The current page slug, used for image path resolution. */
  slug?: string;
}

/**
 * Resolves a raw asset path or filename into a fully qualified KV image route.
 */
function resolveAssetUrl(src: string, slug?: string): string {
  if (!src) return "";
  // If it's already a full URL or a data URI, leave it alone
  if (src.startsWith("http") || src.startsWith("data:")) return src;
  // If it's a relative path starting with / or ./, leave it alone (assumed static asset)
  if (src.startsWith("/") || src.startsWith("./")) return src;

  // Otherwise, assume it's a filename belonging to the current page's KV bucket
  return slug ? `/images/${slug}/${src}` : src;
}

/**
 * Replaces global tokens like {year} and {author} within a string.
 */
function replaceTokens(text: string, context: RenderContext): string {
  if (!text) return "";
  return text
    .replace(/{year}/g, new Date().getFullYear().toString())
    .replace(/{author}/g, context.site.author || "")
    .replace(/{site_title}/g, context.site.title || "");
}

/**
 * Renders an assembled ELSContent structure into Hono/JSX Elements.
 * Automatically fetches and injects scoped CSS for only the shards used on the page.
 * 
 * @param content - The pre-assembled ELS content snapshot.
 * @param context - Global site configuration and page context.
 * @param env - Cloudflare Worker environment for KV style lookups.
 * @returns A promise resolving to JSX elements.
 */
export async function renderELS(
  content: ELSContent,
  context: RenderContext,
  env: Env
) {

  const usedModels = content.usedShards || [];

  // Fetch styles for all used shards in parallel from the registry
  const styleResults = await Promise.all(
    usedModels.map(async (model) => {
      const css = await getShardStyle(env, model);
      return css ? `\n/* Model: ${model} */\n${css}\n` : "";
    }),
  );

  const globalCssStr = styleResults.join("");

  return (
    <>
      {globalCssStr && (
        <style
          id="els-registry-css"
          dangerouslySetInnerHTML={{ __html: globalCssStr }}
        />
      )}
      {renderGrid(content.grid as AssembledGrid, context)}
    </>
  );
}

function renderGrid(grid: AssembledGrid, context: RenderContext) {
  return (
    <div class={`els-grid layout-${grid.layout} els-grid-wrapper`}>
      {grid.sectors.map((s) => renderSector(s, context))}
    </div>
  );
}

function renderSector(sector: AssembledSector, context: RenderContext) {
  return (
    <section
      id={`sector-${sector.id}`}
      class={`els-sector sector-${sector.id}`}
    >
      {sector.items.map((item) => {
        if ("layout" in item) {
          return renderGrid(item as AssembledGrid, context);
        } else {
          return renderShard(item as AssembledShard, context);
        }
      })}
    </section>
  );
}

function renderShard(shard: AssembledShard, context: RenderContext) {
  switch (shard.model) {
    case "Hero":
      const heroImg = resolveAssetUrl(
        shard.props.url || shard.props.src,
        context.slug,
      );
      return (
        <div
          id={`shard-${shard.id}`}
          class="relative min-h-[500px] flex items-center justify-center text-center overflow-hidden my-12 border border-solid border-[var(--theme-accent-glow)] hero-block"
        >
          {heroImg && (
            <div
              class="absolute top-0 left-0 w-full h-full z-0 bg-cover bg-center opacity-40 transition-transform duration-10000 hover:scale-110"
              style={{ backgroundImage: `url('${heroImg}')` }}
            ></div>
          )}
          <div class="relative z-10 px-8 max-w-4xl">
            <h1 class="text-3rem md:text-5rem font-header mb-4 text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] leading-tight">
              {replaceTokens(shard.props.title || "Hero Title", context)}
            </h1>
            {shard.props.subtitle && (
              <p class="text-1.2rem md:text-1.5rem font-nav text-[var(--theme-text-main)] opacity-90 tracking-widest uppercase drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                {replaceTokens(shard.props.subtitle, context)}
              </p>
            )}
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-[var(--theme-bg)] to-transparent opacity-60 pointer-events-none"></div>
        </div>
      );
    case "Text":
      return (
        <div id={`shard-${shard.id}`} class="text-block content-frame">
          <div
            dangerouslySetInnerHTML={{
              __html: replaceTokens(
                shard.props.content || "<p>Text Content Override</p>",
                context,
              ),
            }}
          />
        </div>
      );
    case "Image":
      const imgSrc = resolveAssetUrl(shard.props.src, context.slug);
      return (
        <div id={`shard-${shard.id}`} class="image-block content-frame my-8">
          {imgSrc ? (
            <>
              <img
                src={imgSrc}
                alt={shard.props.alt || ""}
                class="content-img"
                loading="lazy"
              />
              {shard.props.caption && (
                <div class="text-center text-0.8rem color-[var(--theme-text-dim)] mt-2 italic">
                  {replaceTokens(shard.props.caption, context)}
                </div>
              )}
            </>
          ) : (
            <div class="image-block-placeholder border border-dashed border-[var(--theme-accent-glow)] p-12 text-center opacity-50">
              [Image Placeholder - Upload or Specify Src]
            </div>
          )}
        </div>
      );
    case "Logo":
      return (
        <a
          href="/"
          id={`shard-${shard.id}`}
          class="logo-block no-underline font-header text-1.5rem"
        >
          {replaceTokens(
            shard.props.text || context.site.title || "LOGO.",
            context,
          )}
        </a>
      );
    case "Nav":
      return (
        <nav id={`shard-${shard.id}`} class="nav-block">
          <ul class="flex justify-center gap-8 list-none p-0 m-0">
            {context.nav.items.map((item) => (
              <li>
                <a
                  href={item.path.startsWith("/") ? item.path : `/${item.path}`}
                  class="nav-link no-underline hover:color-[var(--theme-accent)] transition-colors uppercase tracking-widest text-0.9rem"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      );
    case "Footer":
      return (
        <footer
          id={`shard-${shard.id}`}
          class="footer-block text-center opacity-70"
        >
          {replaceTokens(shard.props.text || "© {year} EZ EDGE CMS", context)}
        </footer>
      );
    case "FooterNav":
      return (
        <div id={`shard-${shard.id}`} class="footer-nav">
          <ul class="flex justify-center gap-6 list-none p-0 m-0">
            {context.footer.links.map((link) => (
              <li>
                <a
                  href={link.path.startsWith("/") ? link.path : `/${link.path}`}
                  class="footer-link no-underline hover:color-[var(--theme-accent)] transition-colors opacity-70 hover:opacity-100 text-0.8rem uppercase"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      );
    case "ArticleHeader":
      return (
        <div
          id={`shard-${shard.id}`}
          class="article-header mb-8 border-l-4 border-solid border-[var(--theme-accent)] pl-6"
        >
          <h2 class="text-2rem font-header">
            {replaceTokens(
              shard.props.title || "Article Heading Shard",
              context,
            )}
          </h2>
        </div>
      );
    default:
      // Unknown Shard Output:
      return (
        <div
          id={`shard-${shard.id}`}
          class="unknown-block border border-red-500/30 p-4 bg-red-500/5"
        >
          <span class="text-red-400 font-mono text-0.8rem">
            Unknown Model: [{shard.model}] (ID: {shard.id})
          </span>
        </div>
      );
  }
}

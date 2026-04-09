/** @jsxImportSource hono/jsx */
import {
  type AssembledELS,
  type AssembledGrid,
  type AssembledSector,
  type AssembledShard,
} from "@core/schema";

/**
 * Renders a full AssembledELS tree into Hono/JSX Elements.
 * 
 * @param tree - The fully assembled layout tree.
 * @returns JSX elements.
 */
export function renderELS(tree: AssembledELS) {
  return renderGrid(tree.grid);
}

function renderGrid(grid: AssembledGrid) {
  return (
    <div class={`els-grid layout-${grid.layout} flex flex-col w-full`}>
      {grid.sectors.map(renderSector)}
    </div>
  );
}

function renderSector(sector: AssembledSector) {
  return (
    <section id={`sector-${sector.id}`} class={`els-sector sector-${sector.id} w-full`}>
      {sector.items.map((item) => {
        if ("layout" in item) {
          return renderGrid(item as AssembledGrid);
        } else {
          return renderShard(item as AssembledShard);
        }
      })}
    </section>
  );
}

function renderShard(shard: AssembledShard) {
  // A simple switch mapping default models to generic visually-pleasing UI blocks.
  // We use our unocss global vars for premium design elements.
  switch (shard.model) {
    case "Hero":
      return (
        <div class="hero-block py-24 px-8 text-center border-y border-solid border-[var(--theme-accent-glow)] bg-[rgba(0,0,0,0.4)] backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <h1 class="text-3rem md:text-5rem m-0 font-header text-[var(--theme-accent)] drop-shadow-[0_0_15px_var(--theme-accent-glow)] tracking-wider">
            {shard.props.title || "Hero Title"}
          </h1>
          {shard.props.subtitle && (
            <p class="text-1.2rem md:text-1.6rem color-[var(--theme-text-dim)] mt-6 font-nav uppercase tracking-[0.2em]">
              {shard.props.subtitle}
            </p>
          )}
        </div>
      );
    case "Text":
      return (
        <div class="text-block px-8 py-12 max-w-4xl mx-auto font-body color-[var(--theme-text-main)] leading-relaxed text-1.1rem">
          <div dangerouslySetInnerHTML={{ __html: shard.props.content || "<p>Text Content Override</p>" }} />
        </div>
      );
    case "Image":
      return (
        <div class="image-block w-full flex justify-center py-12 px-8">
          {shard.props.src ? (
            <img 
              src={shard.props.src} 
              alt={shard.props.alt || ""} 
              class="max-w-full h-auto border border-solid border-[var(--theme-accent-glow)] rounded-md shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:scale-[1.01] transition-transform duration-500" 
            />
          ) : (
            <div class="w-full max-w-4xl h-80 border-2 border-dashed border-[var(--theme-accent-glow)] opacity-50 flex items-center justify-center font-mono color-[var(--theme-accent)]">
              [Image Placeholder - Upload or Specify Src]
            </div>
          )}
        </div>
      );
    case "Logo":
      return (
        <div class="logo-block py-4 font-header text-2.5rem font-bold tracking-widest color-[var(--theme-accent)] drop-shadow-[0_0_10px_var(--theme-accent-glow)]">
          {shard.props.text || "LOGO."}
        </div>
      );
    case "Nav":
      return (
        <nav class="nav-block py-4 border-b border-solid border-[var(--theme-accent-glow)] font-nav tracking-widest text-[#0ff] opacity-80 text-center">
          [Global Navigation Bar]
        </nav>
      );
    case "Footer":
      return (
        <footer class="footer-block py-12 mt-12 border-t border-solid border-[var(--theme-accent-glow)] bg-[rgba(0,255,255,0.02)] text-center text-[var(--theme-text-dim)] font-nav text-0.85rem tracking-[0.1em]">
          {shard.props.text || "© {year} EZ EDGE CMS"}
        </footer>
      );
    case "FooterNav":
      return <div class="footer-nav"></div>;
    case "ArticleHeader":
      return (
        <div class="article-header py-16 text-center border-b border-dashed border-[var(--theme-accent-glow)] opacity-80">
          <h2 class="text-2rem font-header text-[var(--theme-accent)]">Article Heading Shard</h2>
        </div>
      );
    default:
      // Unknown Shard Output:
      return (
        <div class="unknown-block m-4 border border-dashed border-[#ff0055] bg-[rgba(255,0,85,0.05)] text-center p-6 color-[#ff0055]">
          <span class="font-mono text-0.9rem font-bold">Unknown Model: [{shard.model}] (ID: {shard.id})</span>
        </div>
      );
  }
}

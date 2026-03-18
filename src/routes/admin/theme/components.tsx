/** @jsxImportSource hono/jsx */
/**
 * @module ThemeComponents
 * @description Shared UI components for the Theme Styler.
 */

import { html } from "hono/html";

/**
 * Component: ThemePreview
 * Renders the live-updating site preview used in the Theme Styler.
 *
 * @returns A JSX element containing the site preview.
 */
export const ThemePreview = () => {
  return (
    <div class="relative border border-solid border-[var(--theme-accent-glow)] rounded-lg overflow-hidden">
      <style id="preview-theme-styles"></style>

      <div
        id="preview-container"
        class="w-full h-full overflow-y-auto bg-[var(--theme-bg)]"
      >
        {/* Dummy Public Navbar */}
        <header class="main-header relative">
          <div class="header-content p-4 px-8">
            <a href="#" class="logo">
              EZ-EDGE
            </a>
            <nav class="main-nav">
              <a href="#" class="nav-link">
                HOME
              </a>
              <a href="#" class="nav-link">
                RESOURCES
              </a>
              <a
                href="#"
                class="nav-link color-[var(--theme-accent)] border-b-[var(--theme-accent)]"
              >
                ACTIVATED
              </a>
            </nav>
          </div>
        </header>

        <main id="main-content" class="m-0 p-0">
          <div class="max-w-800px mx-auto py-12 px-8">
            <h1 class="mb-4">SYSTEM.INITIALIZE()</h1>
            <p class="text-1.1rem">
              This is the <strong>Live Preview</strong> environment. Adjust the
              controls on the left to instantly see changes to typography,
              glassmorphism surfaces, glow effects, and core identity colors.
            </p>
            <p>
              Code blocks utilize your chosen Monospace font:{" "}
              <code>sudo ./hack_the_planet.sh</code>
            </p>

            <div class="my-8 flex gap-4">
              <button class="btn-primary">PRIMARY ACTION</button>
              <button class="btn-primary bg-transparent text-[var(--theme-text-dim)] border-[var(--theme-text-dim)]">
                SECONDARY
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              <a href="#" class="bento-item animate-hologram min-h-250px">
                <div>
                  <div class="flex items-center flex-wrap gap-3 mb-4">
                    <div class="i-carbon-development text-1.8rem color-[var(--theme-accent)] flex-shrink-0"></div>
                    <h3 class="text-1.2rem m-0">Visual Feedback</h3>
                  </div>
                  <p class="text-0.85rem m-0 leading-relaxed color-[var(--theme-text-dim)]">
                    Notice the hover state and hologram animation driven by boot
                    speed. The design system dynamically adjusts these effects
                    based on your chosen accent color and transparency levels.
                  </p>
                </div>
              </a>
              <a href="#" class="bento-item min-h-250px">
                <div>
                  <div class="flex items-center flex-wrap gap-3 mb-4">
                    <div class="i-carbon-color-palette text-1.8rem color-[var(--theme-accent)] flex-shrink-0"></div>
                    <h3 class="text-1.2rem m-0">Surface Testing</h3>
                  </div>
                  <p class="text-0.85rem m-0 leading-relaxed color-[var(--theme-text-dim)]">
                    Evaluate surface opacity against the deep background color.
                    This card tests how your choices for surface color and
                    primary text contrast interact in a real-world layout.
                  </p>
                </div>
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

/**
 * Component: ThemePreviewScript
 * Injects the client-side logic for real-time CSS variable updates.
 *
 * @returns A JSX element containing the preview logic script.
 */
export const ThemePreviewScript = () => {
  return html`
    <script>
      (function () {
        const form = document.querySelector("#theme-form");
        const previewStyle = document.getElementById("preview-theme-styles");
        const previewContainer = document.getElementById("preview-container");

        const updatePreviewCSS = () => {
          const fd = new FormData(form);
          const vals = Object.fromEntries(fd.entries());

          // Ensure inputs exist and values are parsed
          if (!vals.primary_hue) return;

          const css = \`
          #preview-container {
            --theme-primary-hue: \${vals.primary_hue};
            --theme-primary-sat: \${vals.primary_sat}%;
            --theme-primary-light: \${vals.primary_light}%;
            
            --theme-accent: hsl(var(--theme-primary-hue), var(--theme-primary-sat), var(--theme-primary-light));
            --theme-accent-glow: hsla(var(--theme-primary-hue), var(--theme-primary-sat), var(--theme-primary-light), 0.4);
            --theme-accent-dim: hsla(var(--theme-primary-hue), var(--theme-primary-sat), var(--theme-primary-light), 0.1);
            
            --theme-bg: hsl(var(--theme-primary-hue), \${vals.bg_sat}%, \${vals.bg_light}%);
            --theme-surface: hsla(var(--theme-primary-hue), \${vals.surface_sat}%, \${vals.surface_light}%, \${vals.surface_opacity});
            --theme-surface-solid: hsl(var(--theme-primary-hue), \${vals.surface_sat}%, \${vals.surface_light}%);
            --theme-text-main: hsl(var(--theme-primary-hue), \${vals.text_main_sat}%, \${vals.text_main_light}%);
            --theme-text-dim: hsl(var(--theme-primary-hue), \${vals.text_dim_sat}%, \${vals.text_dim_light}%);
            
            --font-header: '\${vals.font_header}', sans-serif;
            --font-nav: '\${vals.font_nav}', sans-serif;
            --font-body: '\${vals.font_body}', sans-serif;
            --font-mono: '\${vals.font_mono}', monospace;
            
            --ui-glow-spread: \${vals.glow_spread}px;
            --ui-boot-speed: \${vals.boot_speed}s;
            --ui-elevation: \${vals.elevation}px;
          }
        \`;

          previewStyle.textContent = css;

          // Load Google Fonts dynamically for preview using a singleton link tag
          const fontNames = [
            vals.font_header,
            vals.font_nav,
            vals.font_body,
            vals.font_mono,
          ].filter(Boolean);
          const uniqueFonts = [...new Set(fontNames)];

          const fontUrl =
            "https://fonts.googleapis.com/css2?" +
            uniqueFonts
              .map((f) => "family=" + f.replace(/s+/g, "+") + ":wght@400;700")
              .join("&") +
            "&display=swap";

          let fontLink = document.getElementById("dynamic-fonts-preview");
          if (!fontLink) {
            fontLink = document.createElement("link");
            fontLink.id = "dynamic-fonts-preview";
            fontLink.rel = "stylesheet";
            document.head.appendChild(fontLink);
          }
          if (fontLink.href !== fontUrl) {
            fontLink.href = fontUrl;
          }
        };

        // Initialize preview on load
        updatePreviewCSS();

        // Listen for all input changes
        form.addEventListener("input", updatePreviewCSS);
        form.addEventListener("change", updatePreviewCSS);
      })();
    </script>
  `;
};

/**
 * Component: ThemeFontPreloader
 * Loads all available font options in bulk when the Theme Styler is opened.
 *
 * @param props - Contains the array of font names.
 * @returns A JSX element containing the link tag.
 */
export const ThemeFontPreloader = (props: { fonts: string[] }) => {
  const { fonts } = props;
  const uniqueFonts = [...new Set(fonts)];

  const fontUrl =
    "https://fonts.googleapis.com/css2?" +
    uniqueFonts
      .map((f) => "family=" + f.replace(/\s+/g, "+") + ":wght@400")
      .join("&") +
    "&display=swap";

  return <link rel="stylesheet" href={fontUrl} />;
};

/** @jsxImportSource hono/jsx */
/**
 * @module ThemeViews
 * @description GET route handlers for the Theme Styler.
 * Features a streamlined design system dashboard (Theme Engine choice + Typography pickers)
 * and an interactive live iframe preview with dark/light mode toggling.
 */

import { Hono } from "hono";
import { AdminLayout } from "@layouts/AdminLayout";
import {
  FONT_OPTIONS_HEADER,
  FONT_OPTIONS_BODY,
  FONT_OPTIONS_NAV,
  FONT_OPTIONS_MONO,
} from "@core/constants";
import { GlobalConfigVariables } from "@core/middleware";
import { CustomSelect } from "@components/CustomSelect";
import {
  ThemePreview,
  ThemePreviewScript,
  ThemeFontPreloader,
} from "@routes/admin/theme/components";
import { AdminHeader } from "@components/AdminUI";
import { themeRegistry } from "@core/theme";

/**
 * Hono sub-app for theme views.
 */
const views = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();

/**
 * GET /admin/theme/preview-frame
 * Renders an isolated HTML document previewing the selected theme connector and fonts.
 */
views.get("/preview-frame", async (c): Promise<Response> => {
  const query = c.req.query();
  const stylingSystem = query.styling_system || "ruri";
  const themeMode = query.theme_mode || "dark";
  const fontHeader = query.font_header || "Inter";
  const fontNav = query.font_nav || "Inter";
  const fontBody = query.font_body || "Inter";
  const fontMono = query.font_mono || "monospace";

  const themeConfig = {
    ...c.var.theme,
    values: {
      ...c.var.theme.values,
      styling_system: stylingSystem,
      font_header: fontHeader,
      font_nav: fontNav,
      font_body: fontBody,
      font_mono: fontMono,
    },
  };

  const connector = themeRegistry.get(stylingSystem);
  const cssVariables = connector.generateCssVariables(themeConfig);

  const fontUrl = `https://fonts.googleapis.com/css2?${[
    ...new Set([fontHeader, fontNav, fontBody, fontMono]),
  ]
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700`)
    .join("&")}&display=swap`;

  const bgStyle =
    themeMode === "dark"
      ? stylingSystem === "astryx"
        ? "#0f172a"
        : "#02060c"
      : "#ffffff";
  const textStyle =
    themeMode === "dark"
      ? stylingSystem === "astryx"
        ? "#f8fafc"
        : "#00c3ff"
      : "#0f172a";

  return c.html(
    `<!DOCTYPE html>
    <html lang="en" data-theme="${themeMode}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="${fontUrl}">
      <style>
        ${cssVariables}
        body {
          margin: 0;
          padding: 2rem;
          box-sizing: border-box;
          font-family: var(--font-body), sans-serif;
          background-color: ${bgStyle};
          color: ${textStyle};
          min-height: 100vh;
        }
        #main-content h1, #main-content h2 {
          font-family: var(--font-header), sans-serif;
        }
        nav a {
          font-family: var(--font-nav), sans-serif;
        }
        code, pre {
          font-family: var(--font-mono), monospace;
        }
      </style>
    </head>
    <body>
      <header style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(148,163,184,0.2); padding-bottom: 1rem; margin-bottom: 2rem;">
        <h2 style="margin: 0; font-size: 1.25rem;">EZ-EDGE // ${connector.name.toUpperCase()}</h2>
        <nav style="display: flex; gap: 1.5rem;">
          <a href="#" style="color: inherit; text-decoration: none; font-weight: bold;">HOME</a>
          <a href="#" style="color: inherit; opacity: 0.7; text-decoration: none;">ARTICLES</a>
          <a href="#" style="color: inherit; opacity: 0.7; text-decoration: none;">ABOUT</a>
        </nav>
      </header>

      <main id="main-content" class="${stylingSystem === "ruri" ? "ruri-content" : ""}">
        <h1 style="font-size: 2.2rem; margin-top: 0;">Interactive Theme Engine Preview</h1>
        <p style="font-size: 1.1rem; line-height: 1.7; opacity: 0.85;">
          Currently rendering <strong>${connector.name}</strong> theme connector with preloaded Google fonts. 
          Use the dark/light mode toggle on top to evaluate both surface themes in real time.
        </p>

        <h3 style="margin-top: 2rem;">Typography & Structure</h3>
        <ul style="padding-left: 1.5rem; line-height: 1.8;">
          <li>Theme-tailored typography and surface tokens without color picker clutter</li>
          <li>Zero-flash dark/light mode surface preference detection</li>
          <li>Scoped list bullets (disc for Astryx, cybernetic HUD nodes for Ruri)</li>
        </ul>

        <h3 style="margin-top: 2rem;">Monospaced Code Block</h3>
        <pre style="background: rgba(15, 23, 42, 0.6); padding: 1rem; border-radius: 8px; border: 1px solid rgba(148,163,184,0.2); overflow-x: auto;"><code>const cms = new EZEdgeCMS({
  styling_system: "${stylingSystem}",
  fonts: { header: "${fontHeader}", body: "${fontBody}" }
});</code></pre>
      </main>
    </body>
    </html>`
  );
});

/**
 * GET /admin/theme
 * Renders the streamlined Theme Styler interface.
 */
views.get("/", async (c): Promise<Response> => {
  const { theme, site, seo } = c.var;

  const allFonts = [
    ...FONT_OPTIONS_HEADER,
    ...FONT_OPTIONS_NAV,
    ...FONT_OPTIONS_BODY,
    ...FONT_OPTIONS_MONO,
  ];

  return c.html(
    <AdminLayout title="Theme Styler" theme={theme} site={site} seo={seo}>
      <ThemeFontPreloader fonts={allFonts} />
      <div class="flex flex-col h-[calc(100vh-6rem)]">
        {/* TOP HEADER ZONE */}
        <AdminHeader title="Theme Styler">
          <button
            hx-post="/admin/theme/reset"
            data-confirm="Restore visual settings to defaults? This cannot be undone."
            class="btn-primary border-[#ff4444] color-[#ff4444]"
          >
            RESET DEFAULTS
          </button>
          <button class="btn-primary" form="theme-form" type="submit">
            SAVE SETTINGS
          </button>
        </AdminHeader>

        {/* SPLIT PANE BODY */}
        <div class="grid grid-cols-[380px_1fr] gap-8 flex-1 min-h-0">
          {/* LEFT PANEL: STREAMLINED CONTROLS */}
          <div class="overflow-y-auto pr-4 flex flex-col">
            <form
              id="theme-form"
              hx-post="/admin/theme/save"
              hx-target="#global-toast"
              class="flex flex-col gap-6 pb-16"
            >
              {/* STYLING SYSTEM ENGINE */}
              <div class="admin-card p-5 m-0 flex flex-col gap-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-1rem font-bold m-0 text-white">
                    1. Theme Engine
                  </h3>
                  <span class="text-xs font-mono color-[var(--theme-accent,#00c3ff)] uppercase">
                    Select Design System
                  </span>
                </div>
                <p class="text-xs text-[#94a3b8] m-0 leading-relaxed">
                  Choose the active visual identity. Each theme provides curated light and dark surface color palettes.
                </p>
                <div class="mt-2">
                  <CustomSelect
                    name="styling_system"
                    selectedValue={theme.values.styling_system || "ruri"}
                    options={themeRegistry.list().map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                  />
                </div>
              </div>

              {/* TYPOGRAPHY FOUNDATION */}
              <div class="admin-card p-5 m-0 flex flex-col gap-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-1rem font-bold m-0 text-white">
                    2. Typography
                  </h3>
                  <span class="text-xs font-mono color-[var(--theme-accent,#00c3ff)] uppercase">
                    Font Families
                  </span>
                </div>
                <p class="text-xs text-[#94a3b8] m-0 leading-relaxed mb-2">
                  Select Google Fonts for titles, navigation, body copy, and code blocks.
                </p>
                {[
                  {
                    label: "Header Font",
                    name: "font_header",
                    options: FONT_OPTIONS_HEADER,
                    selected: theme.values.font_header,
                  },
                  {
                    label: "Sub-Header & Nav Font",
                    name: "font_nav",
                    options: FONT_OPTIONS_NAV,
                    selected: theme.values.font_nav,
                  },
                  {
                    label: "Body Font",
                    name: "font_body",
                    options: FONT_OPTIONS_BODY,
                    selected: theme.values.font_body,
                  },
                  {
                    label: "Mono & Code Font",
                    name: "font_mono",
                    options: FONT_OPTIONS_MONO,
                    selected: theme.values.font_mono,
                  },
                ].map((f) => (
                  <div class="flex flex-col gap-1.5">
                    <label class="admin-label text-xs" for={`inp-${f.name}`}>
                      {f.label}
                    </label>
                    <CustomSelect
                      name={f.name}
                      id={`inp-${f.name}`}
                      selectedValue={f.selected}
                      options={f.options.map((font) => ({
                        value: font,
                        label: font,
                        style: {
                          fontFamily: `"${font}", ${
                            f.name === "font_mono" ? "monospace" : "sans-serif"
                          }`,
                        },
                      }))}
                    />
                  </div>
                ))}
              </div>
            </form>
          </div>

          {/* RIGHT PANEL: LIVE IFRAME PREVIEW */}
          <ThemePreview />
        </div>
      </div>

      <ThemePreviewScript />
    </AdminLayout>,
  );
});

export default views;

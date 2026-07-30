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
  const UI = connector.components;

  const fontUrl = `https://fonts.googleapis.com/css2?${[
    ...new Set([fontHeader, fontNav, fontBody, fontMono]),
  ]
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700`)
    .join("&")}&display=swap`;

  const previewSite = {
    ...c.var.site,
    title: c.var.site?.title || "EZ EDGE SITE",
  };

  const rawNav =
    c.var.nav?.items && c.var.nav.items.length > 0
      ? c.var.nav
      : {
          schemaVersion: "1.0.0",
          items: [
            { label: "HOME", path: "#" },
            { label: "ARTICLES", path: "#" },
            { label: "ABOUT", path: "#" },
          ],
        };

  const previewNav = {
    ...rawNav,
    items: rawNav.items.map((item: any) => ({ ...item, path: "#" })),
  };

  const rawFooter = c.var.footer?.links
    ? c.var.footer
    : {
        schemaVersion: "1.0.0",
        links: [
          { label: "HOME", path: "#" },
          { label: "PRIVACY", path: "#" },
          { label: "TERMS", path: "#" },
        ],
      };

  const previewFooter = {
    ...rawFooter,
    links: rawFooter.links.map((link: any) => ({ ...link, path: "#" })),
  };

  const { html } = await import("hono/html");

  return c.html(
    html`<!DOCTYPE html>
    <html lang="en" data-theme="${themeMode}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="${fontUrl}">
      <style>
        ${cssVariables}
        /* Disable CRT scanlines and overlays inside preview iframe */
        .scanlines, .ui-overlay, .ruri-crt, .ruri-panel-bg::after { display: none !important; }
        
        body {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: var(--font-body), sans-serif;
          background-color: var(--ruri-bg-void, var(--astryx-surface, #02060c));
          color: var(--ruri-text-main, var(--astryx-text, #ffffff));
          min-height: 100vh;
        }
        [data-theme='light'] body {
          background-color: var(--ruri-bg-void, var(--astryx-surface, #ffffff));
          color: var(--ruri-text-main, var(--astryx-text, #0f172a));
        }
      </style>
      <script>
        document.addEventListener('click', function(e) {
          var a = e.target.closest('a');
          if (a) {
            e.preventDefault();
            e.stopPropagation();
          }
        }, true);
      </script>
    </head>
    <body>
      ${UI.Overlays ? <UI.Overlays /> : ""}
      ${<UI.Header site={previewSite} nav={previewNav} title={previewSite.title} currentPath="/" />}

      ${<UI.Main>
        <UI.Hero
          title="Interactive Theme Engine Preview"
          subtitle={`Currently previewing ${connector.name} with real-time typography and surface design tokens.`}
        />

        <UI.Grid cols={{ sm: 1, md: 2 }} gap={6} class="my-8">
          <UI.Card title="⚡ Edge Engine Performance" status="ACTIVE" shape="sci-fi" glow={true}>
            <p class="text-sm opacity-80 leading-relaxed m-0">
              Ultra-fast serverless HTML rendering powered by Hono and Cloudflare Workers KV with zero bundle bloat.
            </p>
          </UI.Card>
          <UI.Card title="🎨 Curated Design Tokens" status="ONLINE" shape="rectangle">
            <p class="text-sm opacity-80 leading-relaxed m-0">
              Seamless switching between Ruri's HUD cybernetics and Astryx's sleek modern slate design system.
            </p>
          </UI.Card>
        </UI.Grid>

        <div class="my-8 flex justify-center gap-4 flex-wrap">
          <UI.Button shape="cyber" variant="default">EXPLORE SYSTEM</UI.Button>
          <UI.Button shape="notch" variant="neutral">DOCUMENTATION</UI.Button>
        </div>

        <UI.CodeBlock
          code={`const cms = new EZEdgeCMS({\n  styling_system: "${stylingSystem}",\n  fonts: { header: "${fontHeader}", body: "${fontBody}" }\n});`}
          language="typescript"
          filename="theme.config.ts"
        />
      </UI.Main>}

      ${<UI.Footer site={previewSite} footer={previewFooter} />}
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

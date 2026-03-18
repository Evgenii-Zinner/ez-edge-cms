/** @jsxImportSource hono/jsx */
/**
 * @module ThemeViews
 * @description GET route handlers for the Theme Styler.
 * Provides the interactive design system dashboard where administrators can customize
 * foundations like colors, typography, and visual effects with real-time feedback.
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
import { AdminRange } from "@components/AdminUI";

/**
 * Hono sub-app for theme views.
 */
const views = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();

/**
 * GET /admin/theme
 * Renders the primary Theme Styler interface with sidebar controls and a live preview pane.
 *
 * @param c - Hono context.
 * @returns A promise resolving to the rendered HTML Theme Styler.
 */
views.get("/", async (c) => {
  const { theme, site, seo } = c.var;

  // Aggregate all fonts to preload them for zero-latency previews
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
        <div class="flex justify-between items-center mb-8 flex-shrink-0">
          <h1>Theme Styler</h1>
          <div class="flex gap-4 items-center">
            <button
              hx-post="/admin/theme/reset"
              data-confirm="Restore all visual settings to factory defaults? This cannot be undone."
              class="btn-primary border-[#ff4444] color-[#ff4444]"
            >
              RESET DEFAULTS
            </button>
            <button class="btn-primary" form="theme-form" type="submit">
              SAVE SETTINGS
            </button>
          </div>
        </div>

        {/* SPLIT PANE BODY */}
        <div class="grid grid-cols-[400px_1fr] gap-8 flex-1 min-h-0">
          {/* LEFT PANEL: CONTROLS */}
          <div class="overflow-y-auto pr-4 flex flex-col">
            <form
              id="theme-form"
              hx-post="/admin/theme/save"
              hx-target="#global-toast"
              class="flex flex-col gap-6 pb-16"
            >
              <details class="admin-card p-4 m-0" open>
                <summary class="text-1rem cursor-pointer outline-none">
                  A. Core
                </summary>
                <div class="mt-6">
                  <AdminRange
                    label="Primary Hue (0-360)"
                    name="primary_hue"
                    min="0"
                    max="360"
                    value={theme.values.primary_hue}
                  />
                  <AdminRange
                    label="Saturation"
                    name="primary_sat"
                    min="0"
                    max="100"
                    unit="%"
                    value={parseInt(theme.values.primary_sat)}
                  />
                  <AdminRange
                    label="Lightness"
                    name="primary_light"
                    min="0"
                    max="100"
                    unit="%"
                    value={parseInt(theme.values.primary_light)}
                  />
                </div>
              </details>

              <details class="admin-card p-4 m-0">
                <summary class="text-1rem cursor-pointer outline-none">
                  B. Typography
                </summary>
                <div class="flex flex-col gap-4 mt-6">
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
                    <div>
                      <label class="admin-label" for={`inp-${f.name}`}>
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
                              f.name === "font_mono"
                                ? "monospace"
                                : "sans-serif"
                            }`,
                          },
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </details>

              <details class="admin-card p-4 m-0">
                <summary class="text-1rem cursor-pointer outline-none">
                  C. UI & Surfaces
                </summary>
                <div class="mt-6 flex flex-col gap-6">
                  <div>
                    <h4 class="text-0.8rem color-[var(--theme-accent)] mb-3 uppercase tracking-widest font-bold">
                      Background
                    </h4>
                    <div class="grid grid-cols-2 gap-4">
                      <AdminRange
                        label="Saturation"
                        name="bg_sat"
                        min="0"
                        max="100"
                        unit="%"
                        value={parseInt(theme.values.bg_sat)}
                      />
                      <AdminRange
                        label="Lightness"
                        name="bg_light"
                        min="0"
                        max="100"
                        unit="%"
                        value={parseInt(theme.values.bg_light)}
                      />
                    </div>
                  </div>

                  <div>
                    <h4 class="text-0.8rem color-[var(--theme-accent)] mb-3 uppercase tracking-widest font-bold">
                      Surface Panel
                    </h4>
                    <div class="grid grid-cols-2 gap-4 mb-4">
                      <AdminRange
                        label="Saturation"
                        name="surface_sat"
                        min="0"
                        max="100"
                        unit="%"
                        value={parseInt(theme.values.surface_sat)}
                      />
                      <AdminRange
                        label="Lightness"
                        name="surface_light"
                        min="0"
                        max="100"
                        unit="%"
                        value={parseInt(theme.values.surface_light)}
                      />
                    </div>
                    <AdminRange
                      label="Opacity"
                      name="surface_opacity"
                      min="0"
                      max="1"
                      step="0.05"
                      value={theme.values.surface_opacity}
                    />
                  </div>

                  <div>
                    <h4 class="text-0.8rem color-[var(--theme-accent)] mb-3 uppercase tracking-widest font-bold">
                      Typography Colors
                    </h4>
                    <div class="grid grid-cols-2 gap-4 mb-4">
                      <AdminRange
                        label="Main Sat"
                        name="text_main_sat"
                        min="0"
                        max="100"
                        unit="%"
                        value={parseInt(theme.values.text_main_sat)}
                      />
                      <AdminRange
                        label="Main Light"
                        name="text_main_light"
                        min="0"
                        max="100"
                        unit="%"
                        value={parseInt(theme.values.text_main_light)}
                      />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <AdminRange
                        label="Dim Sat"
                        name="text_dim_sat"
                        min="0"
                        max="100"
                        unit="%"
                        value={parseInt(theme.values.text_dim_sat)}
                      />
                      <AdminRange
                        label="Dim Light"
                        name="text_dim_light"
                        min="0"
                        max="100"
                        unit="%"
                        value={parseInt(theme.values.text_dim_light)}
                      />
                    </div>
                  </div>
                </div>
              </details>

              <details class="admin-card p-4 m-0">
                <summary class="text-1rem cursor-pointer outline-none">
                  D. Effects
                </summary>
                <div class="mt-6">
                  <AdminRange
                    label="Glow Spread (px)"
                    name="glow_spread"
                    min="1"
                    max="10"
                    value={parseInt(theme.values.glow_spread)}
                  />
                  <AdminRange
                    label="Elevation Distance (px)"
                    name="elevation"
                    min="0"
                    max="40"
                    step="5"
                    value={parseInt(theme.values.elevation || "20")}
                  />
                  <AdminRange
                    label="Boot Speed (seconds)"
                    name="boot_speed"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={parseFloat(theme.values.boot_speed)}
                  />
                </div>
              </details>
            </form>
          </div>

          {/* RIGHT PANEL: LIVE PREVIEW */}
          <ThemePreview />
        </div>
      </div>

      <ThemePreviewScript />
    </AdminLayout>,
  );
});

export default views;

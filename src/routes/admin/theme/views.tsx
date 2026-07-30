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
import { ThemeFontPreloader } from "@routes/admin/theme/components";
import { AdminHeader } from "@components/AdminUI";
import { themeRegistry } from "@core/theme";

/**
 * Hono sub-app for theme views.
 */
const views = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();

/**
 * GET /admin/theme
 * Renders the streamlined Theme Styler interface without preview.
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

        {/* CENTERED BODY */}
        <div class="flex-1 overflow-y-auto px-4 py-8">
          <div class="max-w-3xl mx-auto flex flex-col">
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
        </div>
      </div>
    </AdminLayout>
  );
});

export default views;

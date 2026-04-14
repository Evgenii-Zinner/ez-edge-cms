/** @jsxImportSource hono/jsx */
/**
 * @module ThemeMutations
 * @description POST route handlers for theme saving and resetting.
 * Handles the logic for processing form data into valid design system variables and persists them to KV.
 */

import { Hono } from "hono";
import { saveTheme } from "@core/kv";
import { ThemeSchema } from "@core/schema";
import { createDefaultTheme } from "@core/factory";
import { GlobalConfigVariables } from "@core/middleware";
import { validateForm } from "@utils/validation";
import { toastResponse } from "@utils/admin-responses";

/**
 * Hono sub-app for theme mutations.
 */
const mutations = new Hono<{
  Bindings: Env;
  Variables: GlobalConfigVariables;
}>();

/**
 * POST /admin/theme/save
 * Processes and persists theme configuration changes.
 * Utilizes validateForm with mapping to handle CSS unit suffixes.
 *
 * @param c - Hono context.
 * @returns A promise resolving to an HTMX success or error toast notification.
 */
mutations.post("/save", async (c) => {
  try {
    const p = (u: string) => (v: any) => `${v}${u}`;

    const validatedValues = await validateForm(
      c.req,
      ThemeSchema.shape.values,
      {
        coerce: {
          primary_hue: "number",
          surface_opacity: "number",
        },
        map: {
          primary_sat: p("%"),
          primary_light: p("%"),
          bg_sat: p("%"),
          bg_light: p("%"),
          surface_sat: p("%"),
          surface_light: p("%"),
          text_main_sat: p("%"),
          text_main_light: p("%"),
          text_dim_sat: p("%"),
          text_dim_light: p("%"),
          glow_spread: p("px"),
          boot_speed: p("s"),
          elevation: p("px"),
        },
      },
    );

    const currentTheme = c.var.theme;
    const updatedTheme = {
      ...currentTheme,
      updatedAt: new Date().toISOString(),
      values: validatedValues,
    };

    await saveTheme(c.env, updatedTheme);
    return toastResponse(c, "THEME SAVED", "success");
  } catch (e: any) {
    return toastResponse(c, `SAVE FAILED: ${e.message}`, "error");
  }
});

/**
 * POST /admin/theme/reset
 * Restores the theme to the project's factory default settings.
 *
 * @param c - Hono context.
 * @returns A promise resolving to an HTMX refresh header.
 */
mutations.post("/reset", async (c) => {
  const defaultTheme = createDefaultTheme();
  await saveTheme(c.env, defaultTheme);
  c.header("HX-Refresh", "true");
  return c.text("Theme Reset", 200);
});

export default mutations;

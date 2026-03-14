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
 * Converts raw form numbers into valid CSS unit strings (%, px, s) before validation.
 *
 * @param c - Hono context.
 * @returns A promise resolving to an HTMX success or error toast notification.
 */
mutations.post("/save", async (c) => {
  try {
    const body = await c.req.parseBody();
    const currentTheme = c.var.theme;

    const processedBody = {
      ...body,
      primary_sat: body.primary_sat + "%",
      primary_light: body.primary_light + "%",
      bg_sat: body.bg_sat + "%",
      bg_light: body.bg_light + "%",
      surface_sat: body.surface_sat + "%",
      surface_light: body.surface_light + "%",
      text_main_sat: body.text_main_sat + "%",
      text_main_light: body.text_main_light + "%",
      text_dim_sat: body.text_dim_sat + "%",
      text_dim_light: body.text_dim_light + "%",
      glow_spread: body.glow_spread + "px",
      boot_speed: body.boot_speed + "s",
      elevation: body.elevation + "px",
    };

    const validatedValues = ThemeSchema.shape.values.parse(processedBody);

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

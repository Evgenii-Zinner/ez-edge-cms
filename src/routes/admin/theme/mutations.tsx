/** @jsxImportSource hono/jsx */
/**
 * @module ThemeMutations
 * @description POST route handlers for theme saving and resetting.
 * Handles the logic for processing form data into valid design system variables and persists them to KV.
 */

import { Hono } from "hono";
import { saveTheme } from "@core/kv";
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
 * Utilizes validateForm with mapping to handle CSS unit suffixes.
 *
 * @param c - Hono context.
 * @returns A promise resolving to an HTMX success or error toast notification.
 */
mutations.post("/save", async (c): Promise<Response> => {
  try {
    const formData = await c.req.parseBody();
    const currentTheme = c.var.theme;

    const updatedValues = {
      ...currentTheme.values,
      styling_system:
        (formData.styling_system as string) ||
        currentTheme.values.styling_system ||
        "ruri",
      font_header:
        (formData.font_header as string) || currentTheme.values.font_header,
      font_nav: (formData.font_nav as string) || currentTheme.values.font_nav,
      font_body:
        (formData.font_body as string) || currentTheme.values.font_body,
      font_mono:
        (formData.font_mono as string) || currentTheme.values.font_mono,
    };

    const updatedTheme = {
      ...currentTheme,
      updatedAt: new Date().toISOString(),
      values: updatedValues,
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
mutations.post("/reset", async (c): Promise<Response> => {
  const defaultTheme = createDefaultTheme();
  await saveTheme(c.env, defaultTheme);
  c.header("HX-Refresh", "true");
  return c.text("Theme Reset", 200);
});

export default mutations;

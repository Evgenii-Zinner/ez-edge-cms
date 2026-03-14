/** @jsxImportSource hono/jsx */
/**
 * @module AdminResponses
 * @description Standardized HTML responses for administrative mutations.
 * Provides consistent toast notifications and status updates.
 */

import { Context } from "hono";

/**
 * Returns a standardized toast notification as an HTMX fragment.
 *
 * @param c - The Hono context.
 * @param message - The text to display in the toast.
 * @param type - The semantic type of the notification.
 * @param extraHtml - Optional additional HTML to prepend to the toast (e.g. status updates).
 * @returns A promise resolving to an HTML Response.
 */
export async function toastResponse(
  c: Context,
  message: string,
  type: "success" | "error" | "warning" | "info" = "success",
  extraHtml: string = "",
): Promise<Response> {
  const colorVar = `--color-${type}`;
  const isToastTarget = c.req.header("HX-Target") === "global-toast";

  if (type === "error") {
    console.error(`[Admin Error] ${message}`);
  }

  // Consistent inner toast element
  const toastInner = `<div class="toast-notification" style="border-color: var(${colorVar}); color: var(${colorVar});">${message}</div>`;

  if (isToastTarget) {
    // If the toast is the primary target, return the inner content
    return c.html(`${extraHtml}${toastInner}`, 200);
  }

  // Otherwise, return it as an OOB swap that replaces the whole container
  // We include the fixed positioning classes to ensure it's visible.
  return c.html(
    `${extraHtml}<div id="global-toast" hx-swap-oob="true" class="fixed bottom-8 right-8 z-9999">${toastInner}</div>`,
    200,
  );
}

import { MiddlewareHandler } from "hono";
import { renderWithUno } from "@utils/unocss-engine";

/**
 * Middleware: Global UnoCSS Injector
 * Intercepts all outgoing HTML responses, passes them through the UnoCSS edge engine,
 * and seamlessly appends or injects the required CSS utility classes.
 *
 * @returns A Hono MiddlewareHandler.
 */
export const injectUnoCSS = (): MiddlewareHandler => {
  return async (c, next) => {
    // Skip static assets
    if (c.req.path.startsWith("/static/")) return await next();

    await next();

    const contentType = c.res.headers.get("Content-Type");
    // We only want to parse and inject CSS into HTML payloads
    if (contentType && contentType.includes("text/html")) {
      // Read the HTML string from the response stream
      const responseClone = c.res.clone();
      const html = await responseClone.text();

      const isHtmx = c.req.header("HX-Request") === "true";

      // Skip admin HTMX partials (mutations/fragments without head tag).
      // Admin HUD styling is fully self-contained in ADMIN_CSS, and appending
      // <style> tags to fragments pollutes target elements (like #save-time).
      if (isHtmx && c.req.path.startsWith("/admin/") && !html.includes("</head>")) {
        return;
      }

      // Check if the route has explicitly marked this as an editor payload
      const isEditor = c.get("isEditor" as any) === true;

      const finalHtml = await renderWithUno(html, isHtmx, isEditor);

      // Re-construct the response with the styled HTML
      c.res = new Response(finalHtml, c.res);
      c.res.headers.delete("Content-Length");
    }
  };
};

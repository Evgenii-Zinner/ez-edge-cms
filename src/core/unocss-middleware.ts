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
      const finalHtml = await renderWithUno(html, isHtmx);

      // Re-construct the response with the styled HTML
      c.res = new Response(finalHtml, c.res);
      c.res.headers.delete("Content-Length");
    }
  };
};

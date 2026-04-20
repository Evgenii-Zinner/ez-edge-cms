import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { toastResponse } from "@utils/admin-responses";

describe("AdminResponses Utilities", () => {
  it("toastResponse should return inner HTML when target is global-toast", async () => {
    const app = new Hono();
    app.get("/test", async (c) => {
      return toastResponse(c, "Success Message", "success");
    });

    const res = await app.request("http://localhost/test", {
      headers: { "HX-Target": "global-toast" },
    });

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Success Message");
    expect(html).toContain('class="toast-notification"');
    expect(html).toContain("var(--color-success)");
    expect(html).not.toContain('hx-swap-oob="true"');
  });

  it("toastResponse should log to console and return OOB swap for errors", async () => {
    const app = new Hono();
    app.get("/test", async (c) => {
      return toastResponse(c, "Critical Error", "error", "<span>STATUS: FAILED</span>");
    });

    const originalConsoleError = console.error;
    let loggedMessage = "";
    console.error = (msg) => { loggedMessage = msg; };

    const res = await app.request("http://localhost/test");

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Critical Error");
    expect(html).toContain('hx-swap-oob="true"');
    expect(html).toContain("<span>STATUS: FAILED</span>");
    expect(html).toContain('id="global-toast"');
    expect(html).toContain("var(--color-error)");
    expect(loggedMessage).toBe("[Admin Error] Critical Error");

    console.error = originalConsoleError;
  });

  it("toastResponse should correctly apply colors for different semantic types", async () => {
    const app = new Hono();
    app.get("/test", async (c) => {
      return toastResponse(c, "Warning Message", "warning");
    });

    const res = await app.request("http://localhost/test", {
      headers: { "HX-Target": "global-toast" },
    });

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Warning Message");
    expect(html).toContain("var(--color-warning)");
  });
});

import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { toastResponse } from "@utils/admin-responses";

describe("AdminResponses Utilities", () => {
  it("toastResponse should return inner HTML when target is global-toast", async () => {
    const app = new Hono();
    app.get("/test", async (c) => {
      return toastResponse(c, "Success Message", "success");
    });

    const res = await app.request("/test", {
      headers: { "HX-Target": "global-toast" },
    });

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Success Message");
    expect(html).not.toContain('hx-swap-oob="true"');
  });

  it("toastResponse should return OOB swap when target is NOT global-toast", async () => {
    const app = new Hono();
    app.get("/test", async (c) => {
      return toastResponse(c, "Error Message", "error", "<span>Extra</span>");
    });

    const res = await app.request("/test");

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Error Message");
    expect(html).toContain('hx-swap-oob="true"');
    expect(html).toContain("<span>Extra</span>");
    expect(html).toContain('id="global-toast"');
  });
});

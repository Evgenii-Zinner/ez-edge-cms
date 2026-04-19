import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import navAdmin from "@routes/admin/navigation";
import { GlobalConfigVariables } from "@core/middleware";
import {
  createDefaultTheme,
  createDefaultSite,
  createDefaultNav,
  createDefaultFooter,
} from "@core/factory";

/**
 * Tests for the Navigation Administrative routes.
 * These tests ensure the router can be initialized, renders the management interface,
 * and handles data persistence for both navbar and footer.
 */
describe("Navigation Admin Routes", () => {
  /**
   * Smoke test: Ensures the router loads and renders the main interface.
   * This would catch ReferenceErrors like the one recently fixed.
   */
  it("GET / should render the Navigation Manager interface", async () => {
    const app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();

    // Mock global middleware context
    app.use("*", async (c, next) => {
      const site = createDefaultSite();
      c.set("theme", createDefaultTheme());
      c.set("site", site);
      c.set("nav", createDefaultNav());
      c.set("footer", createDefaultFooter());
      c.set("seo", site.seo);
      await next();
    });

    app.route("/", navAdmin);

    const res = await app.request("http://localhost/", { method: "GET" }, {
      EZ_CONTENT: {
        get: async () => null,
      },
    } as any);

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Navigation Manager");
    expect(html).toContain("Navbar Links");
    expect(html).toContain("Footer Links");
  });

  /**
   * Integration test: Verifies the parallel save logic for both Nav and Footer.
   */
  it("POST /save should validate and persist navigation changes", async () => {
    const app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();
    app.route("/admin/navigation", navAdmin);

    const formData = new FormData();
    formData.append("navLabel[]", "Home");
    formData.append("navPath[]", "index"); // Should be normalized to /index
    formData.append("footerLabel[]", "Privacy");
    formData.append("footerPath[]", "/privacy");

    let savedKeys: string[] = [];

    const res = await app.request(
      "http://localhost/admin/navigation/save",
      {
        method: "POST",
        body: formData,
      },
      {
        EZ_CONTENT: {
          put: async (key: string) => {
            savedKeys.push(key);
          },
        },
      } as any,
    );

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("NAVIGATION SAVED");

    // Verify both keys were updated (Nav and Footer)
    expect(savedKeys).toContain("config:nav");
    expect(savedKeys).toContain("config:footer");
  });

  /**
   * Error Handling test: Verifies that KV failures are gracefully caught and reported.
   */
  it("POST /save should report errors when KV persistence fails", async () => {
    const app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();
    app.route("/admin/navigation", navAdmin);

    const res = await app.request(
      "http://localhost/admin/navigation/save",
      {
        method: "POST",
        body: new FormData(),
      },
      {
        EZ_CONTENT: {
          put: async () => {
            throw new Error("KV Persistence Error");
          },
        },
      } as any,
    );

    expect(res.status).toBe(200); // Toast responses still return 200
    expect(await res.text()).toContain("SAVE FAILED");
  });
});

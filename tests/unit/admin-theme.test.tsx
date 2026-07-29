import { describe, it, expect, beforeAll, spyOn } from "bun:test";
import { Hono } from "hono";
import themeAdmin from "@routes/admin/theme";
import { GlobalConfigVariables } from "@core/middleware";
import { createDefaultTheme, createDefaultSite } from "@core/factory";

/**
 * Tests for Administrative Theme Styler.
 */
describe("Admin Theme Routes", () => {
  // Silence console during tests to keep output clean
  beforeAll(() => {
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
    spyOn(console, "warn").mockImplementation(() => {});
  });

  const setupApp = () => {
    const app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();

    app.use("*", async (c, next) => {
      const site = createDefaultSite();
      c.set("theme", createDefaultTheme());
      c.set("site", site);
      c.set("seo", site.seo);
      await next();
    });
    app.route("/admin/theme", themeAdmin);
    return app;
  };

  describe("GET /admin/theme", () => {
    it("should render the theme styler interface", async () => {
      const app = setupApp();
      const res = await app.request("http://localhost/admin/theme", {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("Theme Styler");
      expect(html).toContain("Theme Engine");
      expect(html).toContain("Typography");
      expect(html).toContain("theme-preview-iframe");
    });
  });

  describe("POST /admin/theme/save", () => {
    it("should process and save theme values", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("styling_system", "astryx");
      formData.append("font_header", "Inter");
      formData.append("font_nav", "Inter");
      formData.append("font_body", "Inter");
      formData.append("font_mono", "Fira Code");

      let savedTheme: any = null;
      const res = await app.request(
        "http://localhost/admin/theme/save",
        {
          method: "POST",
          body: formData,
        },
        {
          EZ_CONTENT: {
            put: async (key: string, val: string) => {
              if (key === "config:theme") savedTheme = JSON.parse(val);
            },
          },
        } as any,
      );

      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain("THEME SAVED");
      expect(body).toContain("success");
      expect(savedTheme.values.styling_system).toBe("astryx");
      expect(savedTheme.values.font_mono).toBe("Fira Code");
      expect(savedTheme.updatedAt).toBeDefined();
    });

    it("should handle KV persistence failure", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("primary_hue", "200");

      const res = await app.request(
        "http://localhost/admin/theme/save",
        {
          method: "POST",
          body: formData,
        },
        {
          EZ_CONTENT: {
            put: async () => {
              throw new Error("KV Persistence Error");
            },
          },
        } as any,
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toContain("SAVE FAILED: KV Persistence Error");
    });
  });

  describe("POST /admin/theme/reset", () => {
    it("should reset theme to defaults", async () => {
      const app = setupApp();
      let resetSaved = false;

      const res = await app.request(
        "http://localhost/admin/theme/reset",
        {
          method: "POST",
        },
        {
          EZ_CONTENT: {
            put: async (key: string) => {
              if (key === "config:theme") resetSaved = true;
            },
          },
        } as any,
      );

      expect(res.status).toBe(200);
      expect(res.headers.get("HX-Refresh")).toBe("true");
      expect(resetSaved).toBe(true);
    });

    it("should handle KV failure on reset", async () => {
      const app = setupApp();
      const res = await app.request(
        "http://localhost/admin/theme/reset",
        {
          method: "POST",
        },
        {
          EZ_CONTENT: {
            put: async () => {
              throw new Error("KV Failure");
            },
          },
        } as any,
      );

      // Current implementation of reset doesn't have a try-catch for the put operation,
      // it might throw a 500 or crash if not handled by Hono's global error handler.
      // Based on mutations.tsx, it's not wrapped in try-catch.
      expect(res.status).toBe(500);
    });
  });
});

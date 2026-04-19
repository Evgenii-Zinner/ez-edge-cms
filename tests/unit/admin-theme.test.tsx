import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import themeAdmin from "@routes/admin/theme";
import { GlobalConfigVariables } from "@core/middleware";
import { createDefaultTheme, createDefaultSite } from "@core/factory";

/**
 * Tests for Administrative Theme Styler.
 */
describe("Admin Theme Routes", () => {
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
      expect(html).toContain("Primary Hue");
      expect(html).toContain("Typography");
      expect(html).toContain("preview-container");
    });
  });

  describe("POST /admin/theme/save", () => {
    it("should process and save theme values", async () => {
      const app = setupApp();
      const formData = new FormData();
      formData.append("primary_hue", "200");
      formData.append("primary_sat", "50");
      formData.append("primary_light", "50");
      formData.append("bg_sat", "10");
      formData.append("bg_light", "5");
      formData.append("surface_sat", "10");
      formData.append("surface_light", "10");
      formData.append("surface_opacity", "0.8");
      formData.append("text_main_sat", "0");
      formData.append("text_main_light", "100");
      formData.append("text_dim_sat", "0");
      formData.append("text_dim_light", "70");
      formData.append("glow_spread", "5");
      formData.append("boot_speed", "0.8");
      formData.append("elevation", "20");
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
      expect(await res.text()).toContain("THEME SAVED");
      expect(savedTheme.values.primary_hue).toBe(200);
      expect(savedTheme.values.primary_sat).toBe("50%");
      expect(savedTheme.values.boot_speed).toBe("0.8s");
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
  });
});

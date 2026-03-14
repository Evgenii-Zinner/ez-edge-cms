import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import filesAdmin from "@routes/admin/files";
import { GlobalConfigVariables } from "@core/middleware";
import {
  createDefaultTheme,
  createDefaultSite,
  createDefaultNav,
  createDefaultFooter,
} from "@core/factory";

describe("Files Admin Routes", () => {
  it("GET / should render the Text Files Manager when data exists", async () => {
    const app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();
    app.use("*", async (c, next) => {
      c.set("theme", createDefaultTheme());
      c.set("site", createDefaultSite());
      c.set("nav", createDefaultNav());
      c.set("footer", createDefaultFooter());
      c.set("seo", createDefaultSite().seo);
      await next();
    });
    app.route("/", filesAdmin);

    const res = await app.request("http://localhost/", { method: "GET" }, {
      EZ_CONTENT: {
        get: async () => null,
      },
    } as any);

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Text Files Manager");
  });

  it("GET / should handle missing txtFiles in site config and still render", async () => {
    const app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();
    app.use("*", async (c, next) => {
      const site = createDefaultSite();
      delete (site as any).txtFiles;
      c.set("theme", createDefaultTheme());
      c.set("site", site);
      c.set("nav", createDefaultNav());
      c.set("footer", createDefaultFooter());
      c.set("seo", site.seo);
      await next();
    });
    app.route("/", filesAdmin);

    const res = await app.request("http://localhost/", { method: "GET" }, {
      EZ_CONTENT: { get: async () => null },
    } as any);

    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Text Files Manager");
  });

  it("POST /reset should return error toast when KV persistence fails", async () => {
    const app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();
    app.use("*", async (c, next) => {
      c.set("site", createDefaultSite());
      await next();
    });
    app.route("/admin/files", filesAdmin);

    // Force a failure by providing a broken environment
    const res = await app.request(
      "http://localhost/admin/files/reset",
      { method: "POST" },
      {
        EZ_CONTENT: {
          put: async () => {
            throw new Error("KV Failure");
          },
        },
      } as any,
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toContain("RESET FAILED");
  });

  it("POST /save should return error toast when KV persistence fails", async () => {
    const app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();
    app.use("*", async (c, next) => {
      c.set("site", createDefaultSite());
      await next();
    });
    app.route("/admin/files", filesAdmin);

    const res = await app.request(
      "http://localhost/admin/files/save",
      { method: "POST" },
      {
        EZ_CONTENT: {
          put: async () => {
            throw new Error("KV Failure");
          },
        },
      } as any,
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toContain("SAVE FAILED");
  });

  it("POST /save should successfully merge files when data is valid", async () => {
    const app = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();
    app.use("*", async (c, next) => {
      c.set("site", createDefaultSite());
      await next();
    });
    app.route("/admin/files", filesAdmin);

    const formData = new FormData();
    formData.append("txtFiles.robots", "New Robots");

    const res = await app.request(
      "http://localhost/admin/files/save",
      {
        method: "POST",
        body: formData,
      },
      {
        EZ_CONTENT: {
          put: async () => {},
        },
      } as any,
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toContain("TEXT FILES UPDATED");
  });
});

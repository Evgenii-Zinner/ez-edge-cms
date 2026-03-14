/** @jsxImportSource hono/jsx */
/**
 * @module SiteViews
 * @description GET route handlers for site settings.
 * Provides the user interface for managing global site identity, branding,
 * SEO profiles, and data portability (backup/restore).
 */

import { Hono } from "hono";
import { AdminLayout } from "@layouts/AdminLayout";
import { SiteConfig } from "@core/schema";
import { GlobalConfigVariables } from "@core/middleware";
import {
  BasicInfoCard,
  BrandingCard,
  IdentityFields,
  SocialLinksCard,
  SystemSettingsCard,
  BackupRestoreCard,
} from "@routes/admin/site/components";
import { SiteScripts } from "@routes/admin/site/scripts";

/**
 * Hono sub-app for site configuration views.
 */
const views = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();

/**
 * GET /admin/site/identity-fields
 * Partial route used by HTMX to dynamically swap identity input fields based on selection.
 *
 * @param c - Hono context.
 * @returns A promise resolving to the rendered HTML identity fields fragment.
 */
views.get("/identity-fields", async (c) => {
  const type = c.req.query("seo.identity.type") || "Organization";

  const siteMock: Partial<SiteConfig> = {
    seo: {
      identity: {
        type: type as any,
        name: c.req.query("seo.identity.name") || "",
        description: c.req.query("seo.identity.description") || "",
        logo: c.req.query("seo.identity.logo") || "",
        image: c.req.query("seo.identity.image") || "",
        address: (c.req.query("seo.identity.address") as any) || "",
        phone: (c.req.query("seo.identity.phone") as any) || "",
        links: [],
      },
    },
  };

  return c.html(<IdentityFields type={type} site={siteMock} />);
});

/**
 * GET /admin/site
 * Renders the primary Site Settings interface.
 *
 * @param c - Hono context.
 * @returns A promise resolving to the rendered HTML Site Settings page.
 */
views.get("/", async (c) => {
  const { theme, site, seo } = c.var;

  return c.html(
    <AdminLayout title="Site Settings" theme={theme} site={site} seo={seo}>
      <>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h1>Site Settings</h1>
          <div>
            <button class="btn-primary" form="site-form" type="submit">
              SAVE SETTINGS
            </button>
          </div>
        </div>

        <form
          id="site-form"
          hx-post="/admin/site/save"
          hx-target="#global-toast"
        >
          {/* =========== BASIC INFO =========== */}
          <BasicInfoCard site={site} />

          {/* =========== BRANDING =========== */}
          <BrandingCard site={site} />

          {/* =========== SEO - IDENTITY =========== */}
          <div class="admin-card" style={{ marginTop: "2rem" }}>
            <h3 style={{ marginTop: 0 }}>SEO - Site Identity</h3>
            <p class="admin-label">
              Select the primary entity for this website to improve search
              engine understanding.
            </p>
            <div style={{ display: "flex", gap: "2rem" }}>
              {["Organization", "Person", "LocalBusiness"].map((type) => (
                <label
                  class="admin-label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    color: "white",
                    textTransform: "none",
                  }}
                >
                  <input
                    type="radio"
                    name="seo.identity.type"
                    value={type}
                    checked={site.seo.identity.type === type}
                    class="admin-radio"
                    hx-get="/admin/site/identity-fields"
                    hx-include="#site-form"
                    hx-target="#identity-details-container"
                    hx-swap="outerHTML"
                  />
                  {type}
                </label>
              ))}
            </div>

            <IdentityFields type={site.seo.identity.type} site={site} />
          </div>

          {/* =========== SEO - SOCIAL LINKS =========== */}
          <SocialLinksCard site={site} />

          {/* =========== SYSTEM SETTINGS =========== */}
          <SystemSettingsCard site={site} />
        </form>

        {/* =========== BACKUP & RESTORE =========== */}
        <BackupRestoreCard />

        {/* Client-side scripts */}
        <SiteScripts />
      </>
    </AdminLayout>,
  );
});

export default views;

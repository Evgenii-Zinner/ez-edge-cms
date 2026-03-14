/** @jsxImportSource hono/jsx */
/**
 * @module AdminOnboarding
 * @description Guided initialization flow for new CMS installations.
 * Collects foundational site data (Title, Author, Email) and generates
 * standard legal pages (Terms, Privacy) to ensure the site is ready for public use.
 */

import { Hono } from "hono";
import { AdminLayout } from "@layouts/AdminLayout";
import {
  saveSite,
  savePage,
  setOnboardingStatus,
  ensureSystemDefaults,
} from "@core/kv";
import { SiteSchema } from "@core/schema";
import { GlobalConfigVariables } from "@core/middleware";
import { createTermsPage, createPrivacyPage } from "@core/factory";
import { AdminCard, AdminField } from "@components/AdminUI";

/**
 * Hono sub-app for the onboarding process.
 */
const onboarding = new Hono<{
  Bindings: Env;
  Variables: GlobalConfigVariables;
}>();

/**
 * GET /admin/onboarding
 * Renders the multi-step onboarding form for initial site configuration.
 *
 * @param c - Hono context.
 * @returns A promise resolving to the rendered HTML onboarding interface.
 */
onboarding.get("/", async (c) => {
  const { theme, site, seo } = c.var;

  return c.html(
    <AdminLayout
      title="CMS Onboarding"
      theme={theme}
      site={site}
      seo={seo}
      hideSidebar={true}
    >
      <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
        <AdminCard
          title="WELCOME TO EZ CMS"
          description="Let's configure the basics of your new digital identity."
          marginTop="0"
        ></AdminCard>

        <form action="/admin/onboarding/complete" method="post" class="mt-8">
          <AdminCard title="Site Configuration">
            <div class="flex flex-col gap-6">
              <AdminField
                label="Website Title (Required)"
                name="title"
                id="on-site-title"
                required
                placeholder="My Awesome Website"
                autofocus
              />

              <AdminField
                label="Author Name (Required)"
                name="author"
                id="on-site-author"
                required
                placeholder="John Doe"
                helper="This will be used as the default author for pages and in copyright notice."
              />

              <AdminField
                label="Admin Email (Required)"
                name="adminEmail"
                id="on-site-email"
                type="email"
                required
                placeholder="admin@example.com"
                helper="Used for system notifications and master contact."
              />

              <AdminField
                label="Site Tagline"
                name="tagline"
                id="on-site-tagline"
                placeholder="Edge-native high performance CMS"
              />

              <AdminField
                label="Copyright Template"
                name="copyright"
                id="on-site-copyright"
                value="© {year} {author}. All rights reserved."
                helper={
                  <>
                    Use <code>{"{year}"}</code> and <code>{"{author}"}</code>{" "}
                    for dynamic injection.
                  </>
                }
              />

              <div style={{ marginTop: "1rem" }}>
                <label class="admin-label">Site Identity Type</label>
                <div style={{ display: "flex", gap: "2rem" }}>
                  {["Organization", "Person", "LocalBusiness"].map((type) => (
                    <label
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
                        checked={type === "Organization"}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: "2.5rem" }}>
              <button
                type="submit"
                class="btn-primary"
                style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}
              >
                FINALIZE INITIALIZATION
              </button>
            </div>
          </AdminCard>
        </form>
      </div>
    </AdminLayout>,
  );
});

/**
 * POST /admin/onboarding/complete
 * Finalizes the initialization process.
 * Saves the site configuration and generates the necessary legal pages
 * before marking onboarding as complete.
 *
 * @param c - Hono context.
 * @returns A promise resolving to a redirect to the dashboard or an error message.
 */
onboarding.post("/complete", async (c) => {
  try {
    const body = await c.req.parseBody();
    const site = c.var.site;

    // 1. Ensure all other system defaults exist (Theme, Nav, Footer, Index)
    // This handles cases where the user bypassed the home page.
    await ensureSystemDefaults(c.env);

    const updatedSiteObj = {
      ...site,
      title: body.title as string,
      author: body.author as string,
      adminEmail: body.adminEmail as string,
      tagline: (body.tagline as string) || site.tagline,
      copyright: (body.copyright as string) || site.copyright,
      seo: {
        ...site.seo,
        identity: {
          ...site.seo.identity,
          type: (body["seo.identity.type"] as any) || site.seo.identity.type,
          name: (body.author as string) || site.seo.identity.name, // Use author as default identity name
        },
      },
    };

    // Validate using Zod schema
    const validatedSite = SiteSchema.parse(updatedSiteObj);
    await saveSite(c.env, validatedSite);

    // Generate robust legal pages using factory templates
    const termsPage = createTermsPage(
      validatedSite.title,
      validatedSite.author || "Admin",
    );
    const privacyPage = createPrivacyPage(
      validatedSite.title,
      validatedSite.author || "Admin",
    );

    // Save and publish legal pages immediately using savePage(..., "live")
    // This ensures they are both persisted and correctly indexed in the live page list.
    await Promise.all([
      savePage(c.env, termsPage, "live"),
      savePage(c.env, privacyPage, "live"),
      setOnboardingStatus(c.env, true),
    ]);

    return c.redirect("/admin");
  } catch (e: any) {
    // Fallback error display if validation fails
    return c.html(
      `<h1>Setup Error: ${e.message}</h1><a href="/admin/onboarding">Try Again</a>`,
    );
  }
});

export default onboarding;

/** @jsxImportSource hono/jsx */
/**
 * @module AdminNavigation
 * @description Administrative route handlers for managing site navigation.
 * Provides a dynamic interface for editing the main navbar and footer link menus.
 */

import { Hono } from "hono";
import { AdminLayout } from "@layouts/AdminLayout";
import { saveNav, saveFooter } from "@core/kv";
import { NavSchema, FooterSchema } from "@core/schema";
import { GlobalConfigVariables } from "@core/middleware";
import {
  AdminCard,
  AdminField,
  DynamicTable,
  SortButtons,
  AdminDeleteButton,
} from "@components/AdminUI";
import { validateForm } from "@utils/validation";
import { toastResponse } from "@utils/admin-responses";

/**
 * Hono sub-app for navigation management.
 */
const navAdmin = new Hono<{
  Bindings: Env;
  Variables: GlobalConfigVariables;
}>();

/**
 * GET /admin/navigation
 * Renders the Navigation Manager interface.
 *
 * @param c - Hono context.
 * @returns A promise resolving to the rendered HTML Navigation Manager.
 */
navAdmin.get("/", async (c) => {
  const { theme, nav, footer, site, seo } = c.var;

  /**
   * Internal helper to generate the HTML template for new dynamic rows.
   *
   * @param labelName - The form field name for the link label.
   * @param pathName - The form field name for the link path.
   * @returns A string containing the HTML <td> markup.
   */
  const linkTemplate = (labelName: string, pathName: string): string => `
    <td style="padding: 0.5rem">
      <div style="display: flex; gap: 0.2rem; justifyContent: center;">
        <button type="button" class="nav-item" style="padding: 0.2rem 0.4rem; fontSize: 0.7rem;" onclick="moveDynamicRow(this, 'up')" title="Move Up">▲</button>
        <button type="button" class="nav-item" style="padding: 0.2rem 0.4rem; fontSize: 0.7rem;" onclick="moveDynamicRow(this, 'down')" title="Move Down">▼</button>
      </div>
    </td>
    <td class="p-2">
      <input type="text" name="${labelName}" class="admin-input" placeholder="New Link" required />
    </td>
    <td class="p-2">
      <input type="text" name="${pathName}" class="admin-input" placeholder="/path" required />
    </td>
    <td style="padding: 0.5rem; width: 100px;">
      <div style="display: flex; justify-content: center;">
        <button type="button" class="nav-item" style="border: 1px solid var(--color-error); color: var(--color-error); padding: 0.2rem 0.5rem; background: transparent; cursor: pointer; font-size: 0.7rem;" onclick="this.closest('tr').remove()">DELETE</button>
      </div>
    </td>
  `;

  return c.html(
    <AdminLayout title="Navigation Manager" theme={theme} site={site} seo={seo}>
      <div class="flex flex-col">
        <div class="flex justify-between items-center mb-8">
          <h1>Navigation Manager</h1>
          <div>
            <button class="btn-primary" type="submit" form="navigation-form">
              SAVE NAVIGATION
            </button>
          </div>
        </div>

        <form
          id="navigation-form"
          hx-post="/admin/navigation/save"
          hx-target="#global-toast"
          class="flex flex-col gap-8"
        >
          <AdminCard title="Navbar Links">
            <DynamicTable
              id="nav-items"
              headers={["LABEL", "PATH"]}
              items={nav.items}
              addButtonLabel="+ ADD NAVBAR LINK"
              template={linkTemplate("navLabel[]", "navPath[]")}
              renderRow={(item, _i) => (
                <tr class="border-b border-b-solid border-[rgba(255,255,255,0.05)]">
                  <SortButtons />
                  <td class="p-2">
                    <AdminField
                      label=""
                      name="navLabel[]"
                      value={item.label}
                      required
                    />
                  </td>
                  <td class="p-2">
                    <AdminField
                      label=""
                      name="navPath[]"
                      value={item.path}
                      required
                    />
                  </td>
                  <AdminDeleteButton />
                </tr>
              )}
            />
          </AdminCard>

          <AdminCard title="Footer Links">
            <DynamicTable
              id="footer-items"
              headers={["LABEL", "PATH"]}
              items={footer.links}
              addButtonLabel="+ ADD FOOTER LINK"
              template={linkTemplate("footerLabel[]", "footerPath[]")}
              renderRow={(item, _i) => (
                <tr class="border-b border-b-solid border-[rgba(255,255,255,0.05)]">
                  <SortButtons />
                  <td class="p-2">
                    <AdminField
                      label=""
                      name="footerLabel[]"
                      value={item.label}
                      required
                    />
                  </td>
                  <td class="p-2">
                    <AdminField
                      label=""
                      name="footerPath[]"
                      value={item.path}
                      required
                    />
                  </td>
                  <AdminDeleteButton />
                </tr>
              )}
            />
          </AdminCard>
        </form>
      </div>
    </AdminLayout>,
  );
});

/**
 * POST /admin/navigation/save
 * Persists the updated navbar and footer configurations.
 * Validates the form data and performs a parallel save to KV.
 *
 * @param c - Hono context.
 * @returns A promise resolving to an HTMX success or error toast notification.
 */
navAdmin.post("/save", async (c) => {
  try {
    // Use the new zip-mapping feature of validateForm
    const validatedNav = await validateForm(c.req, NavSchema, {
      zip: { items: { label: "navLabel[]", path: "navPath[]" } },
    });

    const validatedFooter = await validateForm(c.req, FooterSchema, {
      zip: { links: { label: "footerLabel[]", path: "footerPath[]" } },
    });

    // Perform saves in parallel
    await Promise.all([
      saveNav(c.env, validatedNav),
      saveFooter(c.env, validatedFooter),
    ]);

    return toastResponse(c, "NAVIGATION SAVED", "success");
  } catch (e: any) {
    return toastResponse(c, `SAVE FAILED: ${e.message}`, "error");
  }
});

export default navAdmin;

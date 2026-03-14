import { test, expect } from "@playwright/test";

/**
 * EZ EDGE CMS | Comprehensive E2E Journey
 *
 * This test verifies the entire lifecycle of the CMS:
 * 1. Initial System Setup (Admin Creation)
 * 2. Site Onboarding (Branding & Identity)
 * 3. Content Management (Pages & Publishing)
 * 4. Structural Management (Navigation)
 * 5. Visual Customization (Theming & CSS)
 */

test.describe.configure({ mode: "serial" });

test.describe("The Zero-to-Hero Journey", () => {
  const SITE_TITLE = "PLAYWRIGHT TEST SITE";
  const ADMIN_USER = "e2e_admin";
  const ADMIN_PASS = "E2E_password_123!";

  test("Complete Lifecycle: Setup -> Content -> Design -> Verification", async ({
    page,
  }) => {
    test.setTimeout(120000);

    // ==========================================
    // PHASE 1: INITIAL SETUP (FIRST RUN)
    // ==========================================
    await test.step("Create Admin Account", async () => {
      await page.goto("/admin/setup");

      // Verified from src/routes/admin/auth.tsx: INITIAL SETUP
      await expect(
        page.getByRole("heading", { name: "INITIAL SETUP" }),
      ).toBeVisible();

      // Verified from src/routes/admin/auth-components.tsx: label="Username" etc
      await page.getByLabel("Username").fill(ADMIN_USER);
      await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASS);
      await page.getByLabel("Repeat Password").fill(ADMIN_PASS);
      await page.getByRole("button", { name: "CREATE ADMIN" }).click();

      // The code does an automatic login and redirects to /admin/onboarding if fresh
      await expect(page).toHaveURL(/\/admin\/onboarding/);
    });

    // ==========================================
    // PHASE 2: BRANDING & ONBOARDING
    // ==========================================
    await test.step("Finalize Site Identity", async () => {
      // Verified from src/routes/admin/onboarding.tsx: WELCOME TO EZ CMS
      await expect(
        page.getByRole("heading", { name: "WELCOME TO EZ CMS" }),
      ).toBeVisible();

      // Verified labels from src/routes/admin/onboarding.tsx
      await page.getByLabel("Website Title (Required)").fill(SITE_TITLE);
      await page.getByLabel("Author Name (Required)").fill("E2E Bot");
      await page.getByLabel("Admin Email (Required)").fill("bot@test.com");

      await page
        .getByRole("button", { name: "FINALIZE INITIALIZATION" })
        .click();

      // Should land on Dashboard
      await expect(page.locator(".admin-sidebar")).toBeVisible();
      // Verified from src/routes/admin/dashboard.tsx: <h1>Dashboard</h1>
      await expect(
        page.getByRole("heading", { name: "Dashboard" }),
      ).toBeVisible();
    });

    // ==========================================
    // PHASE 3: CONTENT CREATION
    // ==========================================
    await test.step("Create and Publish a Page", async () => {
      // Sidebar link verified as 'PAGES' in AdminLayout.tsx
      await page.getByRole("link", { name: "PAGES", exact: true }).click();

      // Verified from src/routes/admin/pages/views.tsx: + CREATE NEW PAGE
      await page.getByRole("button", { name: "CREATE NEW PAGE" }).click();

      // Verified labels from src/routes/admin/pages/views.tsx
      await page.getByLabel("Page Title").fill("E2E Dynamic Page");
      await page.getByLabel("Parent Path (Folder)").fill("test-sector");

      await Promise.all([
        page.waitForURL(/\/admin\/pages\/edit\//),
        page.getByRole("button", { name: "CREATE PAGE" }).click(),
      ]);

      // Verified button text from src/routes/admin/pages/views.tsx: PUBLISH LIVE
      await page.getByRole("button", { name: "PUBLISH LIVE" }).click();
      await expect(page.locator(".toast-notification")).toContainText(
        "PUBLISHED",
      );

      const slug = page.url().split("/edit/")[1];

      // Verify on Public Site
      await page.goto(`/${decodeURIComponent(slug)}`);
      await expect(page.locator("h1")).toContainText("E2E Dynamic Page");
    });

    // ==========================================
    // PHASE 4: NAVIGATION & STRUCTURE
    // ==========================================
    await test.step("Update Site Navigation", async () => {
      await page.goto("/admin/navigation");

      // Verified button label from src/routes/admin/navigation.tsx
      await page.getByRole("button", { name: "+ ADD NAVBAR LINK" }).click();

      // Field names verified from navigation.tsx: navLabel[] / navPath[]
      const labels = page.locator('input[name="navLabel[]"]');
      const paths = page.locator('input[name="navPath[]"]');

      await labels.last().fill("DYNAMIC_LINK");
      await paths.last().fill("/test-sector/e2e-dynamic-page");

      // Verified from navigation.tsx: SAVE NAVIGATION
      await page.getByRole("button", { name: "SAVE NAVIGATION" }).click();
      await expect(page.locator(".toast-notification")).toContainText("SAVED");

      // Verify on Public Site
      await page.goto("/");
      await expect(page.locator("nav.main-nav")).toContainText("DYNAMIC_LINK");
    });

    // ==========================================
    // PHASE 5: DESIGN & THEME
    // ==========================================
    await test.step("Modify Visual Theme", async () => {
      // Return to admin area. Sidebar link verified as 'THEME STYLER'
      await page.goto("/admin/theme");

      // Verified label from src/routes/admin/theme/views.tsx: Primary Hue (0-360)
      const hueSlider = page.getByLabel("Primary Hue (0-360)");
      await hueSlider.focus();
      for (let i = 0; i < 20; i++) await page.keyboard.press("ArrowRight");

      // Verified from src/routes/admin/theme/views.tsx: SAVE SETTINGS
      await page.getByRole("button", { name: "SAVE SETTINGS" }).click();
      await expect(page.locator(".toast-notification")).toContainText("SAVED");

      // Verify the CSS variable is updated on the public site
      await page.goto("/");
      const styleTag = await page.locator("#dynamic-theme");
      await expect(styleTag).toBeAttached();

      const cssContent = await styleTag.innerHTML();
      expect(cssContent).toContain("--theme-primary-hue");
      expect(cssContent).not.toContain("--theme-primary-hue: 180;");
    });

    // ==========================================
    // PHASE 6: NESTED STRUCTURES & CATEGORIES
    // ==========================================
    await test.step("Verify Nested Slugs & Explorer", async () => {
      await page.goto("/admin/pages");
      await page.getByRole("button", { name: "CREATE NEW PAGE" }).click();

      await page.getByLabel("Page Title").fill("Nested Child Page");
      await page.getByLabel("Parent Path (Folder)").fill("parent/sub-folder");

      await page.getByRole("button", { name: "CREATE PAGE" }).click();
      await page.waitForURL(/\/admin\/pages\/edit\//);
      await page.getByRole("button", { name: "PUBLISH LIVE" }).click();
      await expect(page.locator(".toast-notification")).toContainText(
        "PUBLISHED",
      );

      // 1. Verify Category Explorer view text verified from src/index.tsx
      await page.goto("/parent");
      await expect(page.locator("h1")).toContainText("PARENT");
      await expect(page.locator("body")).toContainText("ARCHIVE EXPLORER");
      await expect(page.locator(".bento-item")).toBeVisible();

      // 2. Verify JSON-LD Metadata Breadcrumbs
      await page.goto("/parent/sub-folder/nested-child-page");

      const jsonLdScript = page.locator('script[type="application/ld+json"]');
      const content = await jsonLdScript.textContent();
      const data = JSON.parse(content || "{}");

      const breadcrumbs = data["@graph"].find(
        (item: any) => item["@type"] === "BreadcrumbList",
      );
      expect(breadcrumbs).toBeDefined();

      const items = breadcrumbs.itemListElement;
      expect(items.length).toBeGreaterThanOrEqual(3);

      const labels = items.map((i: any) => i.item?.name || i.name);
      expect(labels).toContain("Parent");
      expect(labels).toContain("Sub-folder");
    });

    // ==========================================
    // PHASE 7: SEO & METADATA
    // ==========================================
    await test.step("Verify SEO Injection", async () => {
      // Direct navigation to edit page for reliability
      await page.goto("/admin/pages/edit/test-sector%2Fe2e-dynamic-page");

      // Verified label from src/routes/admin/pages/views.tsx: Description (SEO)
      await page
        .getByLabel("Description (SEO)")
        .fill("This is a custom SEO description for E2E testing.");

      // Verified from src/routes/admin/pages/views.tsx: SAVE DRAFT
      await page.getByRole("button", { name: "SAVE DRAFT" }).click();
      await page.getByRole("button", { name: "PUBLISH LIVE" }).click();

      // Check the public head
      await page.goto("/test-sector/e2e-dynamic-page");

      const description = await page
        .locator('meta[name="description"]')
        .getAttribute("content");
      expect(description).toBe(
        "This is a custom SEO description for E2E testing.",
      );

      const ogTitle = await page
        .locator('meta[property="og:title"]')
        .getAttribute("content");
      expect(ogTitle).toContain("E2E Dynamic Page");
    });

    // ==========================================
    // ==========================================
    // PHASE 8: GLOBAL FOOTER
    // ==========================================
    await test.step("Update & Verify Global Footer", async () => {
      // Return to admin area
      await page.goto("/admin/site");

      // Verified label from src/routes/admin/site/components.tsx: Copyright Text
      await page.getByLabel("Copyright Text").fill("© 2026 E2E ROBOTICS CORP");
      await page.getByRole("button", { name: "SAVE SETTINGS" }).click();
      await expect(page.locator(".toast-notification")).toContainText("SAVED");

      await page.goto("/");
      await expect(page.locator("footer")).toContainText(
        "2026 E2E ROBOTICS CORP",
      );
    });

    // ==========================================
    // PHASE 9: SECURITY & LOGOUT
    // ==========================================
    await test.step("Session Termination", async () => {
      await page.goto("/admin");
      // Verified from AdminLayout.tsx: LOGOUT
      await page.getByRole("link", { name: "LOGOUT" }).click();

      await expect(page).toHaveURL(/\/admin\/login/);

      // Verify protected routes are inaccessible
      await page.goto("/admin/pages");
      await expect(page).toHaveURL(/\/admin\/login/);
    });
  });
});

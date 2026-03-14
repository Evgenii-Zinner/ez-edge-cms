/** @jsxImportSource hono/jsx */
/**
 * @module SiteComponents
 * @description Shared UI components for Site Settings.
 */

import { SiteConfig } from "@core/schema";
import { html } from "hono/html";
import {
  AdminCard,
  AdminField,
  DynamicTable,
  FormColumn,
  FormGrid,
  SortButtons,
  AdminDeleteButton,
} from "@components/AdminUI";

/**
 * Props for the Site Setting cards.
 */
export interface SiteCardProps {
  /** The current site configuration. */
  site: SiteConfig;
}

/**
 * Component: BasicInfoCard
 * Renders the Basic Information section of the site settings.
 *
 * @param props - Component properties.
 * @returns A JSX element representing the Basic Info card.
 */
export const BasicInfoCard = ({ site }: SiteCardProps) => (
  <AdminCard title="Basic Information">
    <FormGrid>
      <FormColumn>
        <AdminField
          label="Website Title"
          name="title"
          value={site.title}
          required
        />
        <AdminField
          label="Tagline (Description)"
          name="tagline"
          value={site.tagline || ""}
        />
        <AdminField
          label="Default Author / Owner"
          name="author"
          value={site.author || ""}
        />
        <AdminField
          label="Copyright Text"
          name="copyright"
          value={site.copyright || ""}
          placeholder="© {year} {author}. All rights reserved."
          helper={
            <>
              Use <code>&#123;year&#125;</code> and{" "}
              <code>&#123;author&#125;</code> to dynamically inject values.
            </>
          }
        />
      </FormColumn>
      <FormColumn>
        <AdminField
          label="Language Code"
          name="language"
          value={site.language}
          style={{ width: "100px" }}
        />
        <AdminField
          label="Public Contact Email"
          name="contactEmail"
          value={site.contactEmail || ""}
          type="email"
          placeholder="hello@example.com"
        />
        <AdminField
          label="Admin Notification Email (Required)"
          name="adminEmail"
          value={site.adminEmail}
          type="email"
          required
        />
        <div>
          <label
            class="admin-label"
            for="inp-show-status"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <input
              type="checkbox"
              id="inp-show-status"
              name="showStatus"
              value="true"
              checked={site.showStatus}
            />
            Show "Powered by EZ" Badge
          </label>
        </div>
      </FormColumn>
    </FormGrid>
  </AdminCard>
);

/**
 * Component: OGImageField
 * Specifically handles the OG Image upload, resizing, and Facebook preview.
 *
 * @param props - Component properties.
 * @returns A JSX element representing the OG Image field.
 */
export const OGImageField = ({ site }: SiteCardProps) => (
  <div>
    <label class="admin-label">Global OpenGraph (OG) Image</label>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          id="og-image-filename"
          class="admin-input"
          placeholder="No file chosen"
          readonly
          value={site.ogImage ? site.ogImage.split("/").pop() : ""}
        />
        <button
          type="button"
          class="btn-primary"
          style={{ whiteSpace: "nowrap" }}
          onclick="document.getElementById('og-image-upload').click()"
        >
          CHOOSE IMAGE
        </button>
      </div>

      <input
        type="file"
        id="og-image-upload"
        accept="image/*"
        style={{ display: "none" }}
      />
      <input type="hidden" id="inp-site-ogimage-base64" name="ogImageBase64" />
      <input
        type="hidden"
        id="inp-site-ogimage"
        name="ogImage"
        value={site.ogImage || ""}
      />

      {/* Facebook Post Preview */}
      <div
        style={{
          marginTop: "1rem",
          background: "#242526",
          borderRadius: "8px",
          overflow: "hidden",
          width: "100%",
          maxWidth: "500px",
          border: "1px solid #3e4042",
          fontFamily: "Segoe UI, Helvetica, Arial, sans-serif",
        }}
      >
        <div
          id="fb-preview-image"
          style={{
            width: "100%",
            aspectRatio: "1200/630",
            background: "#3e4042",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {site.ogImage ? (
            <img
              src={`${site.ogImage}?t=${Date.now()}`}
              style="width: 100%; height: 100%; object-fit: cover;"
            />
          ) : (
            <span style="color: #b0b3b8; font-size: 0.9rem;">1200 x 630</span>
          )}
        </div>
        <div style="padding: 12px; background: #242526;">
          <div
            id="fb-preview-url"
            style="color: #b0b3b8; text-transform: uppercase; font-size: 12px; margin-bottom: 4px;"
          >
            {site.baseUrl ? new URL(site.baseUrl).hostname : "YOURDOMAIN.COM"}
          </div>
          <div
            id="fb-preview-title"
            style="color: #e4e6eb; font-weight: 600; font-size: 16px; margin-bottom: 4px; line-height: 20px;"
          >
            {site.title}
          </div>
          <div
            id="fb-preview-desc"
            style="color: #b0b3b8; font-size: 14px; line-height: 18px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;"
          >
            {site.tagline || "Site description goes here..."}
          </div>
        </div>
      </div>
      <p class="admin-helper-text">
        This image will be shown when your site is shared on social media.
        Recommended size: 1200x630px.
      </p>
    </div>
  </div>
);

/**
 * Component: BrandingCard
 * Renders the Branding & Defaults section including Logo and OG Image.
 *
 * @param props - Component properties.
 * @returns A JSX element representing the Branding card.
 */
export const BrandingCard = ({ site }: SiteCardProps) => (
  <AdminCard title="Branding & Defaults" marginTop="2rem">
    <FormGrid>
      <FormColumn>
        <AdminField
          id="logo-svg-input"
          label="Logo / Favicon (Raw SVG)"
          name="logoSvg"
          type="textarea"
          rows={6}
          value={site.logoSvg || ""}
          placeholder="<svg ...>...</svg>"
          helper="Paste raw SVG code here. It will be used as the site logo and favicon."
        />

        <div
          style={{
            marginTop: "1.5rem",
            display: "flex",
            gap: "3rem",
            alignItems: "flex-start",
            background: "rgba(0,0,0,0.2)",
            padding: "1.5rem",
            border: "1px solid var(--theme-accent-glow)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <div
              id="logo-preview-nav"
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                filter: "drop-shadow(0 0 5px var(--theme-accent))",
              }}
            >
              {site.logoSvg
                ? html`<img
                    src="data:image/svg+xml,${encodeURIComponent(site.logoSvg)}"
                    style="width: 32px; height: 32px; object-fit: contain;"
                  />`
                : ""}
            </div>
            <span
              style={{
                fontFamily: "'Chakra Petch'",
                fontSize: "0.6rem",
                color: "var(--theme-text-dim)",
                letterSpacing: "1px",
              }}
            >
              NAV LOGO (32px)
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <div
              id="logo-preview-fav"
              style={{
                width: "16px",
                height: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {site.logoSvg
                ? html`<img
                    src="data:image/svg+xml,${encodeURIComponent(site.logoSvg)}"
                    style="width: 16px; height: 16px; object-fit: contain;"
                  />`
                : ""}
            </div>
            <span
              style={{
                fontFamily: "'Chakra Petch'",
                fontSize: "0.6rem",
                color: "var(--theme-text-dim)",
                letterSpacing: "1px",
              }}
            >
              FAVICON (16px)
            </span>
          </div>
        </div>
      </FormColumn>

      <FormColumn>
        <AdminField
          label="Base URL (Custom Domain)"
          name="baseUrl"
          type="url"
          value={site.baseUrl || ""}
          placeholder="https://example.com"
          helper="For canonical URLs and sitemap generation."
        />

        <OGImageField site={site} />
      </FormColumn>
    </FormGrid>
  </AdminCard>
);

/**
 * Component: SocialLinksCard
 * Renders the SEO - Social Profiles table.
 *
 * @param props - Component properties.
 * @returns A JSX element representing the Social Links card.
 */
export const SocialLinksCard = ({ site }: SiteCardProps) => (
  <AdminCard
    title="SEO - Social Profiles (SameAs)"
    marginTop="2rem"
    description="List URLs of your other social profiles (e.g., Facebook, Twitter, LinkedIn, GitHub). These are used in the schema.org markup to link your identity to these profiles."
  >
    <DynamicTable
      id="social-links"
      headers={["Platform", "URL"]}
      items={site.seo.identity.links || []}
      addButtonLabel="+ Add Social Profile"
      template={`
        <td style="padding: 0.5rem">
          <div style="display: flex; gap: 0.2rem; justifyContent: center;">
            <button type="button" class="nav-item" style="padding: 0.2rem 0.4rem; fontSize: 0.7rem;" onclick="moveDynamicRow(this, 'up')" title="Move Up">▲</button>
            <button type="button" class="nav-item" style="padding: 0.2rem 0.4rem; fontSize: 0.7rem;" onclick="moveDynamicRow(this, 'down')" title="Move Down">▼</button>
          </div>
        </td>
        <td style="padding: 0.5rem">
          <input type="text" name="link_platform[]" class="admin-input" placeholder="Platform" required />
        </td>
        <td style="padding: 0.5rem">
          <input type="url" name="link_url[]" class="admin-input" placeholder="https://..." required />
        </td>
        <td style="padding: 0.5rem; width: 100px;">
          <div style="display: flex; justify-content: center;">
            <button type="button" class="nav-item" style="border: 1px solid var(--color-error); color: var(--color-error); padding: 0.2rem 0.5rem; background: transparent; cursor: pointer; font-size: 0.7rem;" onclick="this.closest('tr').remove()">DELETE</button>
          </div>
        </td>
      `}
      renderRow={(link, _i) => (
        <tr style={{ borderBottom: "1px dotted rgba(255,255,255,0.05)" }}>
          <SortButtons />
          <td style={{ padding: "0.5rem" }}>
            <AdminField
              label=""
              name="link_platform[]"
              value={link.platform}
              placeholder="Twitter"
              required
            />
          </td>
          <td style={{ padding: "0.5rem" }}>
            <AdminField
              label=""
              name="link_url[]"
              value={link.url}
              placeholder="https://..."
              required
            />
          </td>
          <AdminDeleteButton />
        </tr>
      )}
    />
  </AdminCard>
);

/**
 * Component: SystemSettingsCard
 * Renders the Advanced System Settings section.
 *
 * @param props - Component properties.
 * @returns A JSX element representing the System Settings card.
 */
export const SystemSettingsCard = ({ site }: SiteCardProps) => (
  <AdminCard title="Advanced System Settings" marginTop="2rem">
    <AdminField
      label="Global Custom Head Scripts"
      name="customHeadScripts"
      type="textarea"
      rows={6}
      value={site.customHeadScripts || ""}
      style={{ fontFamily: "monospace" }}
      placeholder="<script>...</script>"
      helper={
        <>
          Inject raw HTML tags into the <code>&lt;head&gt;</code> of every page.
          Ideal for Google Analytics (gtag.js) or custom styles.
          <div class="color-[#ff4444] text-0.7rem font-nav mt-2 border-l-2 border-l-solid border-[#ff4444] pl-2">
            <strong>⚠️ SECURITY WARNING:</strong> Never paste scripts from
            untrusted sources. Malicious code can compromise your site and steal
            user data.
          </div>
        </>
      }
    />
  </AdminCard>
);

/**
 * Component: BackupRestoreCard
 * Renders the system backup and restore interface.
 *
 * @returns A JSX element representing the Backup & Restore card.
 */
export const BackupRestoreCard = () => (
  <AdminCard title="Backup & Restore" marginTop="2rem">
    <p class="admin-label" style={{ textTransform: "none", color: "white" }}>
      Perform backup or restore.
    </p>

    {/* Progress Indicator */}
    <div
      id="backup-progress-container"
      class="hidden mt-4 p-4 border border-dashed border-[var(--theme-accent-glow)]"
    >
      <p
        id="backup-progress-text"
        class="m-0 font-nav text-xs uppercase tracking-widest color-[var(--theme-accent)]"
      >
        Ready
      </p>
      <div class="w-full h-1 bg-[rgba(255,255,255,0.05)] mt-2">
        <div
          id="backup-progress-bar"
          class="h-full bg-[var(--theme-accent)] transition-all duration-300"
          style="width: 0%"
        ></div>
      </div>
    </div>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        marginTop: "1.5rem",
      }}
    >
      {/* Export Section */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style="flex: 1">
          <p class="m-0 font-nav text-sm color-[var(--theme-text-dim)]">
            Download all configurations, pages, and images as a single JSON
            file.
          </p>
        </div>
        <button
          id="btn-start-backup"
          type="button"
          class="btn-primary"
          onclick="handleBackup()"
        >
          START BACKUP
        </button>
      </div>

      {/* Import Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--theme-accent-glow)",
        }}
      >
        <p class="m-0 font-nav text-sm color-[var(--theme-text-dim)]">
          Restore site content from a backup file.{" "}
          <strong style="color: var(--color-warning)">
            WARNING: This overwrites all current data.
          </strong>
        </p>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            id="restore-filename"
            class="admin-input"
            placeholder="No backup file chosen"
            readonly
          />
          <button
            type="button"
            class="btn-primary"
            style={{ whiteSpace: "nowrap" }}
            onclick="document.getElementById('restore-upload').click()"
          >
            CHOOSE FILE
          </button>
          <button
            id="btn-start-restore"
            type="button"
            class="btn-primary border-[var(--color-warning)] color-[var(--color-warning)]"
            style={{ whiteSpace: "nowrap" }}
            onclick="handleRestore()"
          >
            RESTORE NOW
          </button>
        </div>

        <input
          type="file"
          id="restore-upload"
          accept=".json"
          style="display: none"
          onchange="document.getElementById('restore-filename').value = this.files[0] ? this.files[0].name : ''"
        />
      </div>
    </div>
  </AdminCard>
);

/**
 * Props for the IdentityFields component.
 */
export interface IdentityFieldsProps {
  /** The selected identity type (e.g., 'Person', 'Organization'). */
  type: string;
  /** Partial site configuration for identity context. */
  site: Partial<SiteConfig>;
}

/**
 * Component: IdentityFields
 * Renders a set of input fields tailored to the selected Site Identity Type.
 *
 * @param props - Component properties.
 * @returns A JSX element representing the Identity fields.
 */
export const IdentityFields = (props: IdentityFieldsProps) => {
  const { type, site } = props;
  const identity = site.seo?.identity || {
    name: "",
    description: "",
    type: "Organization",
    links: [],
  };

  const isPerson = type === "Person";
  const isBusiness = type === "LocalBusiness";

  return (
    <div id="identity-details-container">
      <FormGrid>
        <FormColumn>
          <AdminField
            label={
              isPerson
                ? "Person Name"
                : isBusiness
                  ? "Business Name"
                  : "Organization Name"
            }
            name="seo.identity.name"
            value={identity.name}
            required
          />
          <AdminField
            label={
              isPerson
                ? "Identity Image URL"
                : isBusiness
                  ? "Business Logo URL"
                  : "Organization Logo URL"
            }
            name={isPerson ? "seo.identity.image" : "seo.identity.logo"}
            value={(identity as any)[isPerson ? "image" : "logo"] || ""}
            type="url"
            helper={
              isPerson
                ? "Used specifically if Identity Type is Person."
                : undefined
            }
          />
        </FormColumn>
        <FormColumn>
          <AdminField
            label="Description"
            name="seo.identity.description"
            type="textarea"
            rows={3}
            value={identity.description || ""}
          />
        </FormColumn>
      </FormGrid>

      {isBusiness && (
        <FormGrid style={{ marginTop: "1.5rem" }}>
          <AdminField
            label="Physical Address"
            name="seo.identity.address"
            value={(identity as any).address || ""}
          />
          <AdminField
            label="Phone Number"
            name="seo.identity.phone"
            value={(identity as any).phone || ""}
          />
        </FormGrid>
      )}
    </div>
  );
};

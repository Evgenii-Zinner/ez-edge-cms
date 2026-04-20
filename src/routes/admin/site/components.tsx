/** @jsxImportSource hono/jsx */
/**
 * @module SiteComponents
 * @description Domain components for the Site Settings interface.
 */

import type { FC } from "hono/jsx";
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
import {
  socialLinksRowTemplate,
  getIdentityMetadata,
  fbPreviewStyles,
} from "@routes/admin/site/helpers";

/**
 * Component: BasicInfoCard
 * Renders core site identity fields (Title, Tagline, Author).
 *
 * @param props - Component properties.
 * @returns A JSX element representing the basic info card.
 */
export const BasicInfoCard: FC<{ site: SiteConfig }> = ({ site }) => (
  <AdminCard title="Basic Information">
    <FormGrid>
      <FormColumn>
        <AdminField
          label="Website Title"
          name="title"
          value={site.title}
          required
        />
        <AdminField label="Tagline" name="tagline" value={site.tagline || ""} />
        <AdminField
          label="Author / Owner"
          name="author"
          value={site.author || ""}
        />
        <AdminField
          label="Copyright"
          name="copyright"
          value={site.copyright || ""}
          placeholder="© {year} {author}"
          helper={
            <>
              Use <code>&#123;year&#125;</code> and{" "}
              <code>&#123;author&#125;</code>
            </>
          }
        />
      </FormColumn>
      <FormColumn>
        <AdminField
          label="Language"
          name="language"
          value={site.language}
          style={{ width: "100px" }}
        />
        <AdminField
          label="Public Email"
          name="contactEmail"
          value={site.contactEmail || ""}
          type="email"
        />
        <AdminField
          label="Admin Email"
          name="adminEmail"
          value={site.adminEmail}
          type="email"
          required
        />
        <div class="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="inp-show-status"
            name="showStatus"
            value="true"
            checked={site.showStatus}
          />
          <label class="admin-label m-0 cursor-pointer" for="inp-show-status">
            Show System Status Badge
          </label>
        </div>
      </FormColumn>
    </FormGrid>
  </AdminCard>
);

/**
 * Component: OGImageField
 * Handles the OG Image upload and Facebook post preview.
 *
 * @param props - Component properties.
 * @returns A JSX element representing the OG image field.
 */
export const OGImageField: FC<{ site: SiteConfig }> = ({ site }) => (
  <div>
    <label class="admin-label">Global Social (OG) Image</label>
    <div class="flex flex-col gap-4">
      <div class="flex gap-2">
        <input
          type="text"
          id="og-image-filename"
          class="admin-input"
          readonly
          value={site.ogImage?.split("/").pop() || ""}
        />
        <button
          type="button"
          class="btn-primary whitespace-nowrap"
          onclick="document.getElementById('og-image-upload').click()"
        >
          CHOOSE
        </button>
      </div>
      <input type="file" id="og-image-upload" accept="image/*" class="hidden" />
      <input type="hidden" id="inp-site-ogimage-base64" name="ogImageBase64" />
      <input
        type="hidden"
        id="inp-site-ogimage"
        name="ogImage"
        value={site.ogImage || ""}
      />

      {/* Preview Container */}
      <div style={fbPreviewStyles.container}>
        <div id="fb-preview-image" style={fbPreviewStyles.imageBox}>
          {site.ogImage ? (
            <img
              src={`${site.ogImage}?t=${Date.now()}`}
              class="w-full h-full object-cover"
            />
          ) : (
            <span class="color-[#b0b3b8]">1200 x 630</span>
          )}
        </div>
        <div style={fbPreviewStyles.content}>
          <div id="fb-preview-url" style={fbPreviewStyles.url}>
            {site.baseUrl ? new URL(site.baseUrl).hostname : "DOMAIN.COM"}
          </div>
          <div id="fb-preview-title" style={fbPreviewStyles.title}>
            {site.title}
          </div>
          <div id="fb-preview-desc" style={fbPreviewStyles.desc}>
            {site.tagline || "Description..."}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Component: BrandingCard
 * Renders Logo SVG input and absolute URL settings.
 *
 * @param props - Component properties.
 * @returns A JSX element representing the branding card.
 */
export const BrandingCard: FC<{ site: SiteConfig }> = ({ site }) => (
  <AdminCard title="Branding & Defaults" marginTop="2rem">
    <FormGrid>
      <FormColumn>
        <AdminField
          label="Logo (Raw SVG)"
          name="logoSvg"
          type="textarea"
          rows={6}
          value={site.logoSvg || ""}
          helper="Paste raw SVG code for the site logo and favicon."
        />
        <div class="flex gap-12 bg-[rgba(0,0,0,0.2)] p-6 border border-solid border-[var(--theme-accent-glow)]">
          {["NAV LOGO (32px)", "FAVICON (16px)"].map((label) => (
            <div class="flex flex-col items-center gap-2">
              <div
                style={{
                  width: label.includes("32") ? "32px" : "16px",
                  height: label.includes("32") ? "32px" : "16px",
                }}
              >
                {site.logoSvg &&
                  html`<img
                    src="data:image/svg+xml,${encodeURIComponent(site.logoSvg)}"
                    class="w-full h-full"
                  />`}
              </div>
              <span class="text-0.6rem color-[var(--theme-text-dim)] tracking-1px uppercase">
                {label}
              </span>
            </div>
          ))}
        </div>
      </FormColumn>
      <FormColumn>
        <AdminField
          label="Base URL"
          name="baseUrl"
          type="url"
          value={site.baseUrl || ""}
          placeholder="https://..."
        />
        <OGImageField site={site} />
      </FormColumn>
    </FormGrid>
  </AdminCard>
);

/**
 * Component: IdentityFields
 * Renders dynamic inputs based on selected Site Identity Type.
 *
 * @param props - Component properties.
 * @returns A JSX element representing the identity details.
 */
export const IdentityFields: FC<{
  type: string;
  site: Partial<SiteConfig>;
}> = ({ type, site }) => {
  const identity = site.seo?.identity || {
    name: "",
    description: "",
    type: "Organization",
    links: [],
  };
  const { nameLabel, imageLabel, imageFieldName, isPerson, isBusiness } =
    getIdentityMetadata(type);

  return (
    <div id="identity-details-container">
      <FormGrid>
        <FormColumn>
          <AdminField
            label={nameLabel}
            name="seo.identity.name"
            value={identity.name}
            required
          />
          <AdminField
            label={imageLabel}
            name={imageFieldName}
            value={(identity as any)[isPerson ? "image" : "logo"] || ""}
            type="url"
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
            label="Address"
            name="seo.identity.address"
            value={(identity as any).address || ""}
          />
          <AdminField
            label="Phone"
            name="seo.identity.phone"
            value={(identity as any).phone || ""}
          />
        </FormGrid>
      )}
    </div>
  );
};

/**
 * Component: SocialLinksCard
 * Dynamic table for managing Social Profile URLs.
 *
 * @param props - Component properties.
 * @returns A JSX element representing the social links card.
 */
export const SocialLinksCard: FC<{
  site: SiteConfig;
}> = ({ site }) => (
  <AdminCard title="SEO - Social Profiles" marginTop="2rem">
    <DynamicTable
      id="social-links"
      headers={["Platform", "URL"]}
      items={site.seo.identity.links || []}
      addButtonLabel="+ Add Profile"
      template={socialLinksRowTemplate}
      renderRow={(link) => (
        <tr class="border-b border-b-dotted border-[rgba(255,255,255,0.05)]">
          <SortButtons />
          <td class="p-2">
            <AdminField
              label=""
              name="link_platform[]"
              value={link.platform}
              required
            />
          </td>
          <td class="p-2">
            <AdminField
              label=""
              name="link_url[]"
              value={link.url}
              type="url"
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
 * Renders global script injections.
 *
 * @param props - Component properties.
 * @returns A JSX element representing the system settings card.
 */
export const SystemSettingsCard: FC<{
  site: SiteConfig;
}> = ({ site }) => (
  <AdminCard title="Advanced System Settings" marginTop="2rem">
    <AdminField
      label="Global Custom Head Scripts"
      name="customHeadScripts"
      type="textarea"
      rows={6}
      value={site.customHeadScripts || ""}
      style={{ fontFamily: "monospace" }}
      helper={
        <div class="color-[#ff4444] text-0.7rem border-l-2 border-[#ff4444] pl-2 mt-2">
          <strong>⚠️ SECURITY:</strong> Never paste untrusted scripts.
        </div>
      }
    />
  </AdminCard>
);

/**
 * Component: BackupRestoreCard
 * Interface for system backup and data restoration.
 *
 * @returns A JSX element representing the backup and restore section.
 */
export const BackupRestoreCard: FC = () => (
  <AdminCard title="Backup & Restore" marginTop="2rem">
    <div
      id="backup-progress-container"
      class="hidden mt-4 p-4 border border-dashed border-[var(--theme-accent-glow)]"
    >
      <p
        id="backup-progress-text"
        class="m-0 font-nav text-xs uppercase color-[var(--theme-accent)]"
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
    <div class="flex flex-col gap-6 mt-6">
      <div class="flex items-center gap-4">
        <p class="flex-1 m-0 text-sm color-[var(--theme-text-dim)]">
          Download full site database as JSON.
        </p>
        <button type="button" class="btn-primary" onclick="handleBackup()">
          START BACKUP
        </button>
      </div>
      <div class="flex flex-col gap-4 pt-6 border-t border-[var(--theme-accent-glow)]">
        <p class="m-0 text-sm color-[var(--theme-text-dim)]">
          Restore site content.{" "}
          <strong class="color-[var(--color-warning)]">
            WARNING: Overwrites data.
          </strong>
        </p>
        <div class="flex gap-2">
          <input
            type="text"
            id="restore-filename"
            class="admin-input"
            placeholder="No file chosen"
            readonly
          />
          <button
            type="button"
            class="btn-primary whitespace-nowrap"
            onclick="document.getElementById('restore-upload').click()"
          >
            CHOOSE
          </button>
          <button
            type="button"
            class="btn-primary border-[var(--color-warning)] color-[var(--color-warning)] whitespace-nowrap"
            onclick="handleRestore()"
          >
            RESTORE NOW
          </button>
        </div>
        <input
          type="file"
          id="restore-upload"
          accept=".json"
          class="hidden"
          onchange="document.getElementById('restore-filename').value = this.files[0]?.name || ''"
        />
      </div>
    </div>
  </AdminCard>
);

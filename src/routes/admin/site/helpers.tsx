/** @jsxImportSource hono/jsx */
/**
 * @module SiteComponentHelpers
 * @description Extracted implementation details and templates for Site Settings components.
 * This separates the "noise" (HTML templates, complex logic) from the component layouts.
 */

/**
 * HTML template for new rows in the Social Profiles table.
 * Extracted to keep the component JSX clean.
 */
export const socialLinksRowTemplate = `
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
`;

/**
 * Returns labels and field names for the Identity section based on the selected type.
 *
 * @param type - The selected identity type.
 * @returns Metadata for rendering the identity fields.
 */
export const getIdentityMetadata = (type: string) => {
  const isPerson = type === "Person";
  const isBusiness = type === "LocalBusiness";

  return {
    nameLabel: isPerson
      ? "Person Name"
      : isBusiness
        ? "Business Name"
        : "Organization Name",
    imageLabel: isPerson
      ? "Identity Image URL"
      : isBusiness
        ? "Business Logo URL"
        : "Organization Logo URL",
    imageFieldName: isPerson ? "seo.identity.image" : "seo.identity.logo",
    isPerson,
    isBusiness,
  };
};

/**
 * Common styles for the Facebook preview container.
 */
export const fbPreviewStyles = {
  container: {
    marginTop: "1rem",
    background: "#242526",
    borderRadius: "8px",
    overflow: "hidden",
    width: "100%",
    maxWidth: "500px",
    border: "1px solid #3e4042",
    fontFamily: "Segoe UI, Helvetica, Arial, sans-serif",
  },
  imageBox: {
    width: "100%",
    aspectRatio: "1200/630",
    background: "#3e4042",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  content: { padding: "12px", background: "#242526" },
  url: {
    color: "#b0b3b8",
    textTransform: "uppercase" as const,
    fontSize: "12px",
    marginBottom: "4px",
  },
  title: {
    color: "#e4e6eb",
    fontWeight: "600",
    fontSize: "16px",
    marginBottom: "4px",
    lineHeight: "20px",
  },
  desc: {
    color: "#b0b3b8",
    fontSize: "14px",
    lineHeight: "18px",
    display: "-webkit-box",
    webkitLineClamp: "2",
    webkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },
};

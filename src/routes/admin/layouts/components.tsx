/** @jsxImportSource hono/jsx */
/**
 * @module LayoutComponents
 * @description Shared UI components for the ELS Layout Manager.
 */

/**
 * Props for the LayoutRow component.
 */
export interface LayoutRowProps {
  /** The unique slug of the layout blueprint. */
  slug: string;
}

/**
 * Component: LayoutRow
 * Renders a single row in the layout manager table with action buttons
 * for editing and deletion.
 *
 * @param props - Component properties.
 * @returns A JSX element representing a table row.
 */
export const LayoutRow = (props: LayoutRowProps) => {
  const { slug } = props;
  const safeId = slug.replace(/[^\w]/g, "-");
  const isProtected = ["base", "home", "article"].includes(slug);

  return (
    <tr
      id={`row-${safeId}`}
      class="border-b border-b-solid border-[rgba(0,255,255,0.1)]"
    >
      <td class="p-4 font-mono uppercase tracking-widest">{slug}</td>
      <td class="p-4 flex gap-2">
        <a
          href={`/admin/layouts/${encodeURIComponent(slug)}`}
          class="btn-mini nav-item-info no-underline"
        >
          EDIT
        </a>

        {!isProtected && (
          <button
            hx-delete={`/admin/layouts/${encodeURIComponent(slug)}`}
            data-confirm={`Permanently delete the '${slug}' layout blueprint?`}
            hx-target={`#row-${safeId}`}
            hx-swap="delete"
            class="btn-mini nav-item-error"
          >
            DELETE
          </button>
        )}
        
        {isProtected && (
          <span class="text-0.7rem color-[var(--theme-text-dim)] flex items-center px-2 opacity-50 italic">
            [PROTECTED]
          </span>
        )}
      </td>
    </tr>
  );
};

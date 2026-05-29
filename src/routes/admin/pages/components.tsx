/** @jsxImportSource hono/jsx */
/**
 * @module PageComponents
 * @description Shared UI components for the Page Manager.
 */

import type { FC } from "hono/jsx";
import { PROTECTED_SLUGS } from "@core/constants";

/**
 * Props for the PageRow component.
 */
export interface PageRowProps {
  slug: string;
  title: string;
  publishedAt?: string;
  isLive: boolean;
  isDraft: boolean;
}

/**
 * Component: PageRow
 * Renders a single row in the page manager table with action buttons
 * for editing, publishing, unpublishing, and deletion.
 * Uses HTMX for in-place updates of status and deletion.
 *
 * @param props - Component properties.
 * @returns A JSX element representing a table row.
 */
export const PageRow: FC<PageRowProps> = (props) => {
  const { slug, title, publishedAt, isLive, isDraft } = props;
  const parts = slug.split("/");
  const displaySlug =
    parts.length > 1 ? (
      <span>
        <span class="opacity-50">{parts.slice(0, -1).join("/")}/</span>
        {parts.slice(-1)}
      </span>
    ) : (
      slug
    );
  const safeId = slug.replace(/[^\w]/g, "-");
  const isProtected = (PROTECTED_SLUGS as readonly string[]).includes(slug);
  const dateStr = publishedAt
    ? new Date(publishedAt).toLocaleDateString()
    : "---";

  return (
    <tr
      id={`row-${safeId}`}
      class="border-b border-b-solid border-[rgba(0,255,255,0.1)] hover:bg-[rgba(0,255,255,0.02)] transition-colors"
    >
      <td class="p-4">
        <div class="font-bold text-[var(--theme-text-main)] text-1.1rem mb-1">
          {title}
        </div>
        <div class="text-0.85rem text-[var(--theme-text-dim)]">
          /{displaySlug}
        </div>
      </td>
      <td class="p-4 text-center text-0.85rem text-[var(--theme-text-dim)]">
        {dateStr}
      </td>
      <td class="p-4 text-center">
        {isLive ? (
          <span style={{ color: "var(--color-success)" }} class="text-0.8rem">
            [LIVE]
          </span>
        ) : (
          <span style={{ color: "var(--color-warning)" }} class="text-0.8rem">
            [DRAFT]
          </span>
        )}
      </td>
      <td class="p-4 flex gap-2">
        <a
          href={`/admin/pages/edit/${slug}`}
          class="btn-mini nav-item-info no-underline"
        >
          EDIT
        </a>

        {isDraft && !isLive && (
          <button
            hx-post={`/admin/pages/publish/${slug}`}
            hx-target={`#row-${safeId}`}
            hx-swap="outerHTML"
            class="btn-mini nav-item-success"
          >
            PUBLISH
          </button>
        )}

        {isLive && !isProtected && (
          <button
            hx-post={`/admin/pages/unpublish/${slug}`}
            hx-target={`#row-${safeId}`}
            hx-swap="outerHTML"
            class="btn-mini nav-item-warning"
          >
            UNPUBLISH
          </button>
        )}

        {!isProtected && (
          <button
            hx-post={`/admin/pages/delete/${slug}`}
            data-confirm={`Permanently delete /${slug}?`}
            hx-target={`#row-${safeId}`}
            hx-swap="delete"
            class="btn-mini nav-item-error"
          >
            DELETE
          </button>
        )}
      </td>
    </tr>
  );
};

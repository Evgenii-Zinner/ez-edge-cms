/** @jsxImportSource hono/jsx */

interface ShardRowProps {
  id: string;
}

/**
 * Renders a row for a specific Global Shard in the Shard Manager list.
 * Includes quick actions for editing and deletion.
 */
export const ShardRow = (props: ShardRowProps) => {
  const { id } = props;
  const safeId = id.replace(/[^\w]/g, "-");

  return (
    <tr
      id={`row-${safeId}`}
      class="border-b border-b-solid border-[rgba(0,255,255,0.1)]"
    >
      <td class="p-4 font-mono uppercase tracking-widest">{id}</td>
      <td class="p-4 flex gap-2">
        <a
          href={`/admin/shards/${encodeURIComponent(id)}`}
          class="btn-mini nav-item-info no-underline"
        >
          EDIT
        </a>
        <button
          hx-delete={`/admin/shards/${encodeURIComponent(id)}`}
          data-confirm={`Permanently delete the '${id}' global shard?`}
          hx-target={`#row-${safeId}`}
          hx-swap="delete"
          class="btn-mini nav-item-error"
        >
          DELETE
        </button>
      </td>
    </tr>
  );
};

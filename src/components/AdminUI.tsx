/** @jsxImportSource hono/jsx */
/**
 * @module AdminUI
 * @description Core UI primitives for the Administrative HUD.
 * Provides reusable patterns like Cards, Grids, and Fields to ensure
 * consistency and reduce duplication across admin interfaces.
 */

import { Child, PropsWithChildren } from "hono/jsx";

/**
 * Props for the AdminCard component.
 */
export interface AdminCardProps {
  /** The primary title of the card. */
  title: string;
  /** Optional descriptive text or element displayed below the title. */
  description?: string | Child;
  /** Optional top margin for layout adjustment. */
  marginTop?: string;
}

/**
 * Component: AdminCard
 * A stylized container with a title, optional description, and background styling.
 *
 * @param props - Component properties and children.
 * @returns A JSX element representing the admin card.
 */
export const AdminCard = (props: PropsWithChildren<AdminCardProps>) => (
  <div class={`admin-card ${props.marginTop ? props.marginTop : "m-0"}`}>
    <h3 class="mt-0">{props.title}</h3>
    {props.description && <p class="admin-helper-text">{props.description}</p>}
    {props.children}
  </div>
);

/**
 * Props for the AdminHeader component.
 */
export interface AdminHeaderProps {
  /** The primary title of the page section. */
  title: string;
  /** Optional descriptive text or element displayed below the title. */
  description?: string | Child;
  /** Optional action buttons or elements displayed on the right. */
  children?: Child;
}

/**
 * Component: AdminHeader
 * A reusable page header with a title and an optional action slot.
 *
 * @param props - Component properties.
 * @returns A JSX element representing the admin header.
 */
export const AdminHeader = (props: AdminHeaderProps) => (
  <div class="flex justify-between items-center mb-8">
    <div>
      <h1 class="m-0">{props.title}</h1>
      {props.description && (
        <div class="mt-2 font-nav text-0.75rem color-[var(--theme-text-dim)]">
          {props.description}
        </div>
      )}
    </div>
    <div class="flex gap-4 items-center">{props.children}</div>
  </div>
);

/**
 * Component: FormGrid
 * A two-column responsive grid layout for organizing admin form fields.
 *
 * @param props - Component properties including optional styles and children.
 * @returns A JSX element representing the form grid.
 */
export const FormGrid = (props: PropsWithChildren<{ style?: any }>) => (
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8" style={props.style}>
    {props.children}
  </div>
);

/**
 * Component: FormColumn
 * A single vertical column designed for use within a FormGrid.
 *
 * @param props - Component children.
 * @returns A JSX element representing the form column.
 */
export const FormColumn = (props: PropsWithChildren) => (
  <div class="flex flex-col gap-6">{props.children}</div>
);

/**
 * Props for the AdminRange component.
 */
export interface AdminRangeProps {
  /** Label for the range input. */
  label: string;
  /** Form field name. */
  name: string;
  /** Minimum value. */
  min: number | string;
  /** Maximum value. */
  max: number | string;
  /** Optional step increment. */
  step?: number | string;
  /** Current value. */
  value: number | string;
  /** Optional unit label (e.g., '%', 'px'). */
  unit?: string;
  /** Optional unique ID for the input. */
  id?: string;
}

/**
 * Component: AdminRange
 * A styled range input with a real-time value display in the label.
 *
 * @param props - Component properties.
 * @returns A JSX element representing the range field.
 */
export const AdminRange = (props: AdminRangeProps) => {
  const { label, name, min, max, step, value, unit = "", id } = props;
  const fieldId = id || `inp-${name}`;
  const valId = `val-${name}`;

  return (
    <div class="mb-6">
      <label class="admin-label" htmlFor={fieldId}>
        {label}: <span id={valId}>{value}</span>
        {unit}
      </label>
      <input
        type="range"
        id={fieldId}
        name={name}
        min={min}
        max={max}
        step={step}
        value={value}
        class="admin-range w-full"
        oninput={`document.getElementById('${valId}').innerText = this.value`}
      />
    </div>
  );
};

/**
 * Props for the AdminColor component.
 */
export interface AdminColorProps {
  /** Label for the color picker. */
  label: string;
  /** Form field name. */
  name: string;
  /** Current hex color value. */
  value: string;
  /** Optional unique ID for the input. */
  id?: string;
}

/**
 * Component: AdminColor
 * A color picker input with an adjacent hex code readout.
 *
 * @param props - Component properties.
 * @returns A JSX element representing the color field.
 */
export const AdminColor = (props: AdminColorProps) => {
  const { label, name, value, id } = props;
  const fieldId = id || `inp-${name}`;

  return (
    <div>
      <label class="admin-label text-0.6rem opacity-70" htmlFor={fieldId}>
        {label}
      </label>
      <div class="flex gap-2 items-center">
        <input
          type="color"
          id={fieldId}
          name={name}
          value={value}
          class="w-40px h-30px border border-solid border-[var(--theme-accent-glow)] bg-none cursor-pointer"
          oninput="this.nextElementSibling.innerText = this.value"
        />
        <code class="text-0.7rem color-[var(--theme-text-dim)]">{value}</code>
      </div>
    </div>
  );
};

/**
 * Props for the DynamicTable component.
 */
export interface DynamicTableProps {
  /** Unique ID for the table element. */
  id: string;
  /** Array of column header labels. */
  headers: string[];
  /** Array of items to display in the table rows. */
  items: any[];
  /** Render function for each individual item row. */
  renderRow: (item: any, index: number) => Child;
  /** HTML template string for newly added rows. */
  template: string;
  /** Label for the 'Add Item' button. */
  addButtonLabel: string;
}

/**
 * Component: DynamicTable
 * A sophisticated table for managing lists of data with sorting and addition capabilities.
 *
 * @param props - Component properties.
 * @returns A JSX element representing the dynamic table.
 */
export const DynamicTable = (props: DynamicTableProps) => {
  const { id, headers, items, renderRow, template, addButtonLabel } = props;
  const containerId = `${id}-container`;

  return (
    <>
      <table class="w-full border-collapse" id={id}>
        <thead>
          <tr class="border-b border-b-solid border-[rgba(255,255,255,0.1)]">
            <th class="text-center p-2 w-80px">Sort</th>
            {headers.map((h) => (
              <th class="text-left p-2">{h}</th>
            ))}
            <th class="text-center p-2 w-100px">Action</th>
          </tr>
        </thead>

        <tbody id={containerId}>
          {items.map((item, i) => renderRow(item, i))}
          <tr>
            <td colSpan={headers.length + 2} class="p-2">
              <button
                type="button"
                class="btn-primary w-full p-2"
                onclick={`addDynamicRow('${containerId}', \`${template}\`)`}
              >
                {addButtonLabel}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <script
        dangerouslySetInnerHTML={{
          __html: `
        if (typeof window.addDynamicRow === 'undefined') {
          window.addDynamicRow = function(containerId, template) {
            const tbody = document.getElementById(containerId);
            const tr = document.createElement("tr");
            tr.className = "border-b border-b-dotted border-[rgba(255,255,255,0.05)]";
            tr.innerHTML = template;
            tbody.insertBefore(tr, tbody.lastElementChild);
          }
        }
        if (typeof window.moveDynamicRow === 'undefined') {
          window.moveDynamicRow = function(btn, direction) {
            const row = btn.closest('tr');
            if (direction === 'up') {
              const prev = row.previousElementSibling;
              if (prev) row.parentNode.insertBefore(row, prev);
            } else {
              const next = row.nextElementSibling;
              if (next && next.nextElementSibling) {
                row.parentNode.insertBefore(next, row);
              }
            }
          }
        }
      `,
        }}
      />
    </>
  );
};

/**
 * Component: SortButtons
 * Helper component that renders Up and Down sorting buttons for table rows.
 *
 * @returns A JSX element containing sorting controls.
 */
export const SortButtons = () => (
  <td class="p-2 w-80px align-middle text-center">
    <div class="flex gap-1 justify-center">
      <button
        type="button"
        class="nav-item p-1 text-0.7rem"
        onclick="moveDynamicRow(this, 'up')"
        title="Move Up"
      >
        ▲
      </button>
      <button
        type="button"
        class="nav-item p-1 text-0.7rem"
        onclick="moveDynamicRow(this, 'down')"
        title="Move Down"
      >
        ▼
      </button>
    </div>
  </td>
);

/**
 * Component: AdminDeleteButton
 * Standardized delete button cell for removal of dynamic table rows.
 *
 * @returns A JSX element containing a removal button.
 */
export const AdminDeleteButton = () => (
  <td class="p-2 w-100px align-middle text-center">
    <div class="flex justify-center">
      <button
        type="button"
        class="nav-item-error p-1 px-2 bg-transparent cursor-pointer text-0.7rem"
        onclick="this.closest('tr').remove()"
      >
        DELETE
      </button>
    </div>
  </td>
);

/**
 * Props for the AdminField component.
 */
export interface AdminFieldProps {
  /** Label for the form field. */
  label: string;
  /** Form field name. */
  name: string;
  /** Current field value. */
  value?: string | number;
  /** The input type or textarea selection. */
  type?: "text" | "email" | "password" | "url" | "number" | "textarea";
  /** Whether the field is mandatory. */
  required?: boolean;
  /** Input placeholder text. */
  placeholder?: string;
  /** Optional descriptive or instructional text. */
  helper?: string | Child;
  /** Row count for textarea inputs. */
  rows?: number;
  /** Optional unique ID for the field. */
  id?: string;
  /** Whether the field is read-only. */
  readonly?: boolean;
  /** Custom styles for the input element. */
  style?: any;
  /** Standard HTML autocomplete attribute. */
  autocomplete?: string;
  /** Whether to focus the input on load. */
  autofocus?: boolean;
  /** Minimum length constraint. */
  minlength?: number;
}

/**
 * Component: AdminField
 * A comprehensive form field unit combining label, input/textarea, and validation metadata.
 *
 * @param props - Component properties.
 * @returns A JSX element representing the admin field.
 */
export const AdminField = (props: AdminFieldProps) => {
  const {
    label,
    name,
    value,
    type = "text",
    required,
    placeholder,
    helper,
    rows = 3,
    id,
    readonly,
    style,
    autocomplete,
    autofocus,
    minlength,
  } = props;
  const fieldId = id || `inp-${name.replace(/\./g, "-")}`;

  return (
    <div>
      {label && (
        <label class="admin-label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      {type === "textarea" ? (
        <textarea
          id={fieldId}
          name={name}
          class="admin-input"
          rows={rows}
          placeholder={placeholder}
          required={required}
          readonly={readonly}
          style={style}
          autofocus={autofocus}
        >
          {value || ""}
        </textarea>
      ) : (
        <input
          type={type}
          id={fieldId}
          name={name}
          value={value}
          class="admin-input"
          required={required}
          placeholder={placeholder}
          readonly={readonly}
          style={style}
          autocomplete={autocomplete}
          autofocus={autofocus}
          minlength={minlength}
        />
      )}
      {helper && <p class="admin-helper-text">{helper}</p>}
    </div>
  );
};

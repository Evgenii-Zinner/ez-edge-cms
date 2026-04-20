/** @jsxImportSource hono/jsx */
/**
 * @module AdminUI
 * @description Core UI primitives for the Administrative HUD.
 * Provides reusable patterns like Cards, Grids, and Fields to ensure
 * consistency and reduce duplication across admin interfaces.
 */

import type { FC, Child, PropsWithChildren } from "hono/jsx";

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
  /** Explicit children for type safety in some TS versions. */
  children?: any;
}

/**
 * Component: AdminCard
 * A standard container for administrative sections with a futuristic border and header.
 *
 * @param props - Component properties.
 */
export const AdminCard: FC<PropsWithChildren<AdminCardProps>> = ({
  title,
  description,
  marginTop,
  children,
}) => (
  <div
    class="admin-card"
    style={{ marginTop: marginTop || "0" }}
    hx-boost="false"
  >
    <div class="admin-card-header">
      <h2 class="admin-card-title">{title}</h2>
      {description && <div class="admin-card-desc">{description}</div>}
    </div>
    <div class="admin-card-content">{children}</div>
  </div>
);

/**
 * Props for the AdminHeader component.
 */
export interface AdminHeaderProps {
  /** The main title of the page/section. */
  title: string;
  /** Optional descriptive text. */
  description?: string | Child;
  /** Explicit children for type safety. */
  children?: any;
}

/**
 * Component: AdminHeader
 * A top-level header for administrative pages, providing consistent spacing and typography.
 *
 * @param props - Component properties.
 */
export const AdminHeader: FC<PropsWithChildren<AdminHeaderProps>> = (props) => (
  <div class="admin-header">
    <div class="flex flex-col gap-1">
      <h1 class="admin-title">{props.title}</h1>
      {props.description && (
        <p class="text-0.8rem color-[var(--theme-text-dim)] uppercase tracking-1px">
          {props.description}
        </p>
      )}
    </div>
    <div class="admin-header-actions">{props.children}</div>
  </div>
);

/**
 * Component: FormGrid
 * A two-column responsive grid container for form fields.
 */
export const FormGrid: FC<PropsWithChildren<{ style?: any }>> = ({
  children,
  style,
}) => (
  <div
    class="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6"
    style={style || {}}
  >
    {children}
  </div>
);

/**
 * Component: FormColumn
 * A layout column within a FormGrid.
 */
export const FormColumn: FC<PropsWithChildren> = (props) => (
  <div class="flex flex-col gap-4">{props.children}</div>
);

/**
 * Props for the AdminRange component.
 */
export interface AdminRangeProps {
  /** Label for the range input. */
  label: string;
  /** Input field name. */
  name: string;
  /** Current value. */
  value: number;
  /** Optional custom ID. */
  id?: string;
  /** Step increment for the range. */
  step?: string;
  /** Minimum value. */
  min?: string | number;
  /** Maximum value. */
  max?: string | number;
  /** Optional unit display. */
  unit?: string;
}

/**
 * Component: AdminRange
 * A styled range input (slider) for numerical theme values.
 */
export const AdminRange: FC<AdminRangeProps> = (props) => {
  const id = props.id || `range-${props.name}`;
  return (
    <div class="admin-field">
      <div class="flex justify-between items-center mb-2">
        <label class="admin-label m-0" for={id}>
          {props.label}
        </label>
        <span
          id={`${id}-value`}
          class="font-mono text-xs color-[var(--theme-accent)]"
        >
          {props.value}
          {props.unit}
        </span>
      </div>
      <input
        type="range"
        id={id}
        name={props.name}
        min={props.min || "0"}
        max={props.max || "360"}
        step={props.step || "1"}
        value={props.value.toString()}
        class="admin-range"
        oninput={`document.getElementById('${id}-value').textContent = this.value + '${props.unit || ""}'`}
      />
    </div>
  );
};

/**
 * Props for the AdminColor component.
 */
export interface AdminColorProps {
  /** Label for the color input. */
  label: string;
  /** Input field name. */
  name: string;
  /** Current hex color value. */
  value: string;
  /** Optional custom ID. */
  id?: string;
}

/**
 * Component: AdminColor
 * A styled color picker input with a hex value readout.
 */
export const AdminColor: FC<AdminColorProps> = (props) => {
  const id = props.id || `color-${props.name}`;
  return (
    <div class="admin-field">
      <label class="admin-label" for={id}>
        {props.label}
      </label>
      <div class="flex items-center gap-4">
        <input
          type="color"
          id={id}
          name={props.name}
          value={props.value}
          class="admin-color-picker"
          oninput={`document.getElementById('${id}-hex').textContent = this.value.toUpperCase()`}
        />
        <span
          id={`${id}-hex`}
          class="font-mono text-sm color-[var(--theme-text-main)]"
        >
          {props.value.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

/**
 * Props for the DynamicTable component.
 */
export interface DynamicTableProps {
  /** Unique ID for the table. */
  id: string;
  /** Column headers. */
  headers: string[];
  /** Initial items to render. */
  items: any[];
  /** Function to render a single row. Supports an index. */
  renderRow: (item: any, index: number) => Child;
  /** HTML template for a new empty row. */
  template: string;
  /** Label for the add button. */
  addButtonLabel?: string;
}

/**
 * Component: DynamicTable
 * A managed table that supports adding, removing, and sorting rows.
 */
export const DynamicTable: FC<DynamicTableProps> = (props) => {
  return (
    <div class="dynamic-table-container" id={`${props.id}-container`}>
      <table class="admin-table w-full border-collapse" id={props.id}>
        <thead>
          <tr>
            <th class="w-8"></th>
            {props.headers.map((h) => (
              <th class="text-left p-2 font-nav text-xs uppercase color-[var(--theme-text-dim)]">
                {h}
              </th>
            ))}
            <th class="w-8"></th>
          </tr>
        </thead>
        <tbody class="sortable">
          {props.items.map((item, index) => props.renderRow(item, index))}
        </tbody>
      </table>
      <button
        type="button"
        class="mt-4 text-xs color-[var(--theme-accent)] hover:color-[var(--theme-text-main)] transition-colors uppercase tracking-1px flex items-center gap-1"
        onclick={`addTableRow('${props.id}', \`${props.template}\`)`}
      >
        {props.addButtonLabel || "+ ADD ITEM"}
      </button>
    </div>
  );
};

/**
 * Component: SortButtons
 * Rendering of sort handles for table rows.
 */
export const SortButtons: FC = () => (
  <td class="w-8 text-center color-[var(--theme-text-dim)]">
    <div class="cursor-move sort-handle">⠿</div>
  </td>
);

/**
 * Component: AdminDeleteButton
 * Standardized delete button for table rows.
 */
export const AdminDeleteButton: FC = () => (
  <td class="w-8 text-center">
    <button
      type="button"
      class="color-[var(--color-error)] opacity-50 hover:opacity-100 transition-opacity"
      onclick="this.closest('tr').remove(); window.adminHasChanges = true;"
    >
      ✕
    </button>
  </td>
);

/**
 * Props for the AdminField component.
 */
export interface AdminFieldProps {
  /** Label for the field. */
  label: string;
  /** Input field name. */
  name: string;
  /** Current value. */
  value?: string | number;
  /** Input type (text, url, email, password, etc.). */
  type?: string;
  /** Optional placeholder text. */
  placeholder?: string;
  /** Optional helper text or element. */
  helper?: string | Child;
  /** Number of rows for textarea type. */
  rows?: number;
  /** Optional inline styles. */
  style?: any;
  /** Whether the field is required. */
  required?: boolean;
  /** Whether the field is read-only. */
  readonly?: boolean;
  /** Whether the field should autofocus. */
  autofocus?: boolean;
  /** Optional custom ID. */
  id?: string;
  /** Optional autocomplete hint. */
  autocomplete?: string;
  /** Minimum length for text inputs. */
  minlength?: number;
  /** Minimum value for number inputs. */
  min?: string | number;
  /** Maximum value for number inputs. */
  max?: string | number;
  /** Step increment. */
  step?: string | number;
}

/**
 * Component: AdminField
 * A versatile form field component that supports various input types and textareas.
 */
export const AdminField: FC<AdminFieldProps> = (props) => {
  const id = props.id || `inp-${props.name.replace(/\./g, "-")}`;
  const commonProps = {
    id,
    name: props.name,
    class: "admin-input",
    placeholder: props.placeholder,
    style: props.style,
    required: props.required,
    readonly: props.readonly,
    autofocus: props.autofocus,
    autocomplete: props.autocomplete,
    minlength: props.minlength,
    min: props.min,
    max: props.max,
    step: props.step,
    oninput: "window.adminHasChanges = true;",
  };

  return (
    <div class="admin-field">
      <label class="admin-label" for={id}>
        {props.label}
      </label>
      {props.type === "textarea" ? (
        <textarea {...commonProps} rows={props.rows || 3}>
          {props.value}
        </textarea>
      ) : (
        <input
          {...commonProps}
          type={props.type || "text"}
          value={props.value?.toString()}
        />
      )}
      {props.helper && <div class="admin-helper">{props.helper}</div>}
    </div>
  );
};

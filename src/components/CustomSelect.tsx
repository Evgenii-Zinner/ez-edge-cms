/** @jsxImportSource hono/jsx */
/**
 * @module CustomSelect
 * @description A futuristic, accessible dropdown component styled for the EZ EDGE design system.
 * Replaces standard HTML `<select>` elements with a CSS-driven custom dropdown
 * that maintains compatibility with native form submissions via a hidden input.
 */

import { raw } from "hono/html";

/**
 * Interface for an individual option within the custom select.
 */
export interface SelectOption {
  /** The internal value of the option. */
  value: string;
  /** The display label for the option. */
  label: string;
  /** Optional inline styles (e.g., for font previews). */
  style?: any;
}

/**
 * Props for the Head component.
 */
export interface CustomSelectProps {
  /** The 'name' attribute for the hidden input (for form submission). */
  name: string;
  /** The 'id' attribute for the hidden input. */
  id?: string;
  /** The list of selectable options. */
  options: SelectOption[];
  /** The currently selected value. */
  selectedValue: string;
  /** Fallback text if no option is selected. */
  placeholder?: string;
  /** Optional custom JavaScript to execute on selection change. */
  onChange?: string;
}

/**
 * Component: CustomSelect
 * Renders a CSS-based dropdown that uses the `:focus-within` selector for state management.
 * Utilizes a data-attribute pattern and a single script delegator to minimize HTML bloat.
 */
export const CustomSelect = ({
  name,
  id,
  options,
  selectedValue,
  placeholder,
  onChange,
}: CustomSelectProps) => {
  const selectedOption =
    options.find((o) => o.value === selectedValue) || options[0];

  return (
    <>
      <div
        class="relative group outline-none font-body custom-select-container"
        tabIndex={0}
        data-on-change={onChange || ""}
      >
        {/* Hidden input to hold the actual value */}
        <input
          type="hidden"
          name={name}
          id={id}
          value={selectedOption?.value || ""}
        />

        {/* Display and Toggle */}
        <div
          class="admin-input flex justify-between items-center w-full cursor-pointer transition-colors duration-300 group-focus-within:border-[var(--theme-accent)] custom-select-toggle"
          style={selectedOption?.style}
        >
          <span class="select-display">
            {selectedOption?.label || placeholder || "Select..."}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="transition-transform duration-300 group-focus-within:rotate-180"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        {/* Options Menu */}
        <div class="absolute left-0 top-full mt-1 w-full bg-[#0a1a1a] border border-solid border-[var(--theme-accent-glow)] shadow-[0_8px_16px_rgba(0,0,0,0.5)] opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-150 z-50 max-h-300px overflow-y-auto">
          {options.map((opt) => (
            <div
              class="custom-select-option block px-4 py-3 text-[var(--theme-text-main)] hover:bg-[var(--theme-accent-glow)] hover:text-[var(--theme-accent)] cursor-pointer transition-colors duration-200"
              style={opt.style}
              data-value={opt.value}
              data-label={opt.label}
            >
              {opt.label}
            </div>
          ))}
        </div>
      </div>

      {/* Initialize selection delegator if not already present */}
      {raw(`
        <script>
          if (!window.customSelectInitialized) {
            window.customSelectInitialized = true;
            
            document.addEventListener('mousedown', (e) => {
              const toggle = e.target.closest('.custom-select-toggle');
              if (toggle) {
                const container = toggle.closest('.custom-select-container');
                if (container.matches(':focus-within')) {
                  container.blur();
                  e.preventDefault();
                }
              }
              
              const option = e.target.closest('.custom-select-option');
              if (option) {
                e.preventDefault(); // Prevent blur before click processing
                const container = option.closest('.custom-select-container');
                const value = option.getAttribute('data-value');
                const label = option.getAttribute('data-label');
                const onChange = container.getAttribute('data-on-change');
                
                // Update internal state
                container.querySelector('input[type="hidden"]').value = value;
                container.querySelector('.select-display').innerText = label;
                
                // Update styling (font-family)
                const toggleBtn = container.querySelector('.custom-select-toggle');
                toggleBtn.style.fontFamily = option.style.fontFamily || '';
                
                // Close menu
                container.blur();
                
                // Dispatch events
                const input = container.querySelector('input[type="hidden"]');
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Handle optional callback
                if (onChange) {
                  try {
                    new Function(onChange).call(container);
                  } catch (err) {
                    console.error('CustomSelect onChange failed', err);
                  }
                }
              }
            });
          }
        </script>
      `)}
    </>
  );
};

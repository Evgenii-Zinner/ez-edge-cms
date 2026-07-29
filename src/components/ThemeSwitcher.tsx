/** @jsxImportSource hono/jsx */
/**
 * @module ThemeSwitcher
 * @description Theme Switcher toggle button with theme-tailored SVG icons.
 * Smoothly toggles between Light and Dark modes without page reloads.
 */

import type { FC } from "hono/jsx";
import { Button as RuriButton } from "ruri-ui";

export interface ThemeSwitcherProps {
  /** Theme connector style identifier ('ruri' | 'astryx' | 'default') */
  styleVariant?: "ruri" | "astryx" | "default";
  class?: string;
}

export const ThemeSwitcher: FC<ThemeSwitcherProps> = ({
  styleVariant = "default",
  class: className = "",
}) => {
  const icons = (
    <>
      {/* Sun Icon (shown in Dark mode -> click switches to light) */}
      <svg
        class="light-icon w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>

      {/* Moon Icon (shown in Light mode -> click switches to dark) */}
      <svg
        class="dark-icon w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </>
  );

  if (styleVariant === "ruri") {
    return (
      <RuriButton
        shape="icon"
        id="theme-toggle"
        class={className}
        onclick="if(window.toggleTheme){window.toggleTheme()}"
        aria-label="Toggle dark/light mode"
        title="Toggle dark/light mode"
      >
        {icons}
      </RuriButton>
    );
  }

  let buttonClasses = "";
  if (styleVariant === "astryx") {
    buttonClasses = `inline-flex items-center justify-center p-2 rounded-lg border border-solid border-[var(--astryx-border,#e2e8f0)] text-[var(--astryx-text-muted,#475569)] hover:text-[var(--astryx-primary,#1877f2)] hover:bg-[var(--astryx-surface-variant,#f8fafc)] transition-all cursor-pointer bg-transparent ${className}`.trim();
  } else {
    buttonClasses = `inline-flex items-center justify-center p-2 rounded-md border border-solid border-current opacity-80 hover:opacity-100 transition-all cursor-pointer bg-transparent ${className}`.trim();
  }

  return (
    <button
      type="button"
      id="theme-toggle"
      class={buttonClasses}
      onclick="if(window.toggleTheme){window.toggleTheme()}"
      aria-label="Toggle dark/light mode"
      title="Toggle dark/light mode"
    >
      {icons}
    </button>
  );
};

/** @jsxImportSource hono/jsx */
/**
 * @module ThemeComponents
 * @description Shared UI components for the Theme Styler.
 * Features an interactive live iframe preview panel with Dark/Light mode toggling
 * styled to match the Admin HUD design system.
 */

import type { FC } from "hono/jsx";
import { html } from "hono/html";

/**
 * Component: ThemePreview
 * Renders an iframe-based live preview container with an Admin HUD dark/light toolbar.
 *
 * @returns A JSX element containing the site preview.
 */
export const ThemePreview: FC = () => {
  return (
    <div class="flex flex-col h-full border border-solid border-[var(--theme-border,#1e2d4a)] rounded-xl overflow-hidden bg-[#090d16] shadow-xl">
      {/* ADMIN HUD PREVIEW TOOLBAR */}
      <div class="flex items-center justify-between px-4 py-2.5 bg-[#0d1527] border-b border-solid border-[#1e2d4a]">
        <div class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-[var(--theme-accent,#00c3ff)] animate-pulse"></span>
          <span class="text-xs font-mono text-[#94a3b8] tracking-widest uppercase font-semibold">
            Live Preview // Active System View
          </span>
        </div>

        {/* DARK / LIGHT MODE SWITCHER FOR PREVIEW */}
        <div class="flex items-center gap-1.5 bg-[#070a12] p-1 rounded-lg border border-[#1e2d4a]">
          <button
            type="button"
            id="preview-mode-dark"
            class="px-3 py-1 text-xs font-mono rounded transition-all bg-[var(--theme-accent,#00c3ff)]/20 text-[var(--theme-accent,#00c3ff)] font-bold cursor-pointer border-0"
            onclick="window.setPreviewMode('dark')"
          >
            🌙 DARK
          </button>
          <button
            type="button"
            id="preview-mode-light"
            class="px-3 py-1 text-xs font-mono rounded transition-all text-[#94a3b8] hover:text-white cursor-pointer border-0 bg-transparent"
            onclick="window.setPreviewMode('light')"
          >
            ☀️ LIGHT
          </button>
        </div>
      </div>

      {/* LIVE IFRAME CONTAINER */}
      <div class="flex-1 w-full h-full relative bg-[#02060c]">
        <iframe
          id="theme-preview-iframe"
          src="/admin/theme/preview-frame?styling_system=ruri&theme_mode=dark"
          class="w-full h-full border-0"
          title="Live Site Theme Preview"
        ></iframe>
      </div>
    </div>
  );
};

/**
 * Component: ThemePreviewScript
 * Injects the client-side logic for real-time CSS variable and iframe preview updates.
 *
 * @returns A Hono HTML template string.
 */
export const ThemePreviewScript = () => {
  return html`
    <script>
      (function () {
        const form = document.querySelector("#theme-form");
        const iframe = document.getElementById("theme-preview-iframe");
        let currentMode = "dark";

        window.setPreviewMode = function(mode) {
          currentMode = mode;
          const darkBtn = document.getElementById("preview-mode-dark");
          const lightBtn = document.getElementById("preview-mode-light");

          if (mode === "dark") {
            darkBtn.className = "px-3 py-1 text-xs font-mono rounded transition-all bg-[var(--theme-accent,#00c3ff)]/20 text-[var(--theme-accent,#00c3ff)] font-bold cursor-pointer border-0";
            lightBtn.className = "px-3 py-1 text-xs font-mono rounded transition-all text-[#94a3b8] hover:text-white cursor-pointer border-0 bg-transparent";
          } else {
            lightBtn.className = "px-3 py-1 text-xs font-mono rounded transition-all bg-[var(--theme-accent,#00c3ff)]/20 text-[var(--theme-accent,#00c3ff)] font-bold cursor-pointer border-0";
            darkBtn.className = "px-3 py-1 text-xs font-mono rounded transition-all text-[#94a3b8] hover:text-white cursor-pointer border-0 bg-transparent";
          }

          updateIframeSrc();
        };

        const updateIframeSrc = () => {
          if (!form || !iframe) return;
          const fd = new FormData(form);
          const vals = Object.fromEntries(fd.entries());

          const params = new URLSearchParams({
            styling_system: vals.styling_system || "ruri",
            font_header: vals.font_header || "Inter",
            font_nav: vals.font_nav || "Inter",
            font_body: vals.font_body || "Inter",
            font_mono: vals.font_mono || "monospace",
            theme_mode: currentMode
          });

          iframe.src = "/admin/theme/preview-frame?" + params.toString();
        };

        if (form) {
          form.addEventListener("input", updateIframeSrc);
          form.addEventListener("change", updateIframeSrc);
        }
      })();
    </script>
  `;
};

/**
 * Component: ThemeFontPreloader
 * Loads all available font options in bulk when the Theme Styler is opened.
 *
 * @param props - Component properties containing the array of font names.
 * @returns A JSX element containing the link tag.
 */
export const ThemeFontPreloader: FC<{ fonts: string[] }> = (props) => {
  const { fonts } = props;
  const uniqueFonts = [...new Set(fonts)];

  const fontUrl =
    "https://fonts.googleapis.com/css2?" +
    uniqueFonts
      .map((f) => "family=" + encodeURIComponent(f) + ":wght@400;600;700")
      .join("&") +
    "&display=swap";

  return <link rel="stylesheet" href={fontUrl} />;
};

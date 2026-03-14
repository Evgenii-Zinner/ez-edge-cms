import { ThemeConfig } from "@core/schema";

/**
 * Generates a string of CSS variable definitions based on the provided theme configuration.
 * These variables drive the HSL-based design system and futuristic UI effects.
 *
 * @param theme - The validated ThemeConfig object.
 * @returns A minified string of CSS variables defined within the :root scope.
 */
export const generateCssVariables = (theme: ThemeConfig): string => {
  const { values } = theme;

  return `
    :root {
      --theme-primary-hue: ${values.primary_hue};
      --theme-primary-sat: ${values.primary_sat};
      --theme-primary-light: ${values.primary_light};
      
      --theme-accent: hsl(var(--theme-primary-hue), var(--theme-primary-sat), var(--theme-primary-light));
      --theme-accent-glow: hsla(var(--theme-primary-hue), var(--theme-primary-sat), var(--theme-primary-light), 0.4);
      --theme-accent-dim: hsla(var(--theme-primary-hue), var(--theme-primary-sat), var(--theme-primary-light), 0.1);
      
      --theme-bg: hsl(var(--theme-primary-hue), ${values.bg_sat}, ${values.bg_light});
      --theme-surface: hsla(var(--theme-primary-hue), ${values.surface_sat}, ${values.surface_light}, ${values.surface_opacity});
      --theme-surface-solid: hsl(var(--theme-primary-hue), ${values.surface_sat}, ${values.surface_light});
      --theme-text-main: hsl(var(--theme-primary-hue), ${values.text_main_sat}, ${values.text_main_light});
      --theme-text-dim: hsl(var(--theme-primary-hue), ${values.text_dim_sat}, ${values.text_dim_light});
      
      --font-header: "${values.font_header}", sans-serif;
      --font-nav: "${values.font_nav}", sans-serif;
      --font-body: "${values.font_body}", sans-serif;
      --font-mono: "${values.font_mono}", "Consolas", "Monaco", "Lucida Console", "Liberation Mono", "Courier New", monospace;
      
      --ui-glow-spread: ${values.glow_spread};
      --ui-boot-speed: ${values.boot_speed};
      --ui-elevation: ${values.elevation};
    }
  `
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Generates a standard set of CSS variables for the administrative HUD.
 * This ensures the admin interface remains readable and consistent regardless
 * of the public-facing site's custom theme.
 *
 * @returns A minified string of administrative CSS variables.
 */
export const generateAdminCssVariables = (): string => {
  return `
    :root {
      --theme-primary-hue: 180;
      --theme-primary-sat: 70%;
      --theme-primary-light: 50%;
      
      --theme-accent: #00ffff;
      --theme-accent-glow: rgba(0, 255, 255, 0.4);
      --theme-accent-dim: rgba(0, 255, 255, 0.1);
      
      --theme-bg: #050a0a;
      --theme-surface: rgba(10, 26, 26, 0.7);
      --theme-surface-solid: #0a1a1a;
      --theme-text-main: #e0f2f2;
      --theme-text-dim: #a0baba;
      
      --font-header: "Orbitron", sans-serif;
      --font-nav: "Chakra Petch", sans-serif;
      --font-body: "Roboto", sans-serif;
      --font-mono: "Fira Code", "Consolas", "Monaco", "Lucida Console", "Liberation Mono", "Courier New", monospace;
      
      --ui-glow-spread: 10px;
      --ui-boot-speed: 0.8s;
      --ui-elevation: 20px;

      /* Semantic Status Colors */
      --color-success: #00ff00;
      --color-error: #ff4444;
      --color-warning: #ffcc00;
      --color-info: #00ccff;
    }
  `
    .replace(/\s+/g, " ")
    .trim();
};

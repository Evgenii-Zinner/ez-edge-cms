/** @jsxImportSource hono/jsx */
/**
 * @module BaseLayout
 * @description The primary layout wrapper for all public-facing pages.
 * Composes layout regions (Header, Nav, Main, Footer, Overlays) directly from
 * the active ThemeConnector specified by the theme settings.
 */

import type { FC } from "hono/jsx";
import { raw } from "hono/html";
import {
  ThemeConfig,
  NavConfig,
  SiteConfig,
  FooterConfig,
  PageConfig,
} from "@core/schema";
import { Head } from "@components/Head";
import { themeRegistry } from "@core/theme";

/**
 * Props for the BaseLayout component.
 */
export interface BaseLayoutProps {
  /** The browser title for the page. */
  title: string;
  /** The content to be rendered within the main area. */
  children: any;
  /** Global theme configuration. */
  theme: ThemeConfig;
  /** Primary navigation configuration. */
  nav: NavConfig;
  /** Global site identity and branding configuration. */
  site: SiteConfig;
  /** Global site footer configuration. */
  footer: FooterConfig;
  /** Optional page-specific configuration for SEO overrides. */
  page?: PageConfig;
  /** Optional meta description override. */
  description?: string;
  /** The base URL detected from the request context. */
  detectedUrl?: string;
  /** The current request path for active nav link highlighting (e.g. '/about'). */
  currentPath?: string;
}

/**
 * Component: BaseLayout
 * Provides the foundational HTML structure for the public site by delegating layout
 * composition to the active ThemeConnector (e.g. Default or Ruri UI).
 */
export const BaseLayout: FC<BaseLayoutProps> = (props) => {
  const {
    site,
    title,
    theme,
    page,
    detectedUrl,
    currentPath,
    nav,
    children,
    footer,
  } = props;

  const stylingSystem = theme?.values?.styling_system || "ruri";
  const connector = themeRegistry.get(stylingSystem);
  const ThemeUI = connector.components;

  return (
    <>
      {raw("<!DOCTYPE html>\n")}
      <html lang={site.language || "en"}>
        <Head
          title={title}
          theme={theme}
          site={site}
          page={page}
          detectedUrl={detectedUrl}
        />
        <body hx-boost="true">
          {/* Theme-defined Visual Overlays */}
          <ThemeUI.Overlays />

          {/* Standalone Mobile Nav Drawer (only for connectors that use a separate Nav) */}
          {!connector.selfContainedNav && ThemeUI.Nav && (
            <ThemeUI.Nav nav={nav} />
          )}

          {/* Site Header */}
          <ThemeUI.Header
            site={site}
            nav={nav}
            title={title}
            currentPath={currentPath}
          />

          {ThemeUI.Main ? (
            <ThemeUI.Main>{children}</ThemeUI.Main>
          ) : (
            <main id="main-content">{children}</main>
          )}

          {/* Site Footer */}
          <ThemeUI.Footer site={site} footer={footer} />

          {/*
           * Mobile nav toggle JS — only injected for connectors that use a
           * separate #main-nav drawer (selfContainedNav = false/undefined).
           * Connectors like Ruri handle mobile nav entirely in their Header.
           */}
          {!connector.selfContainedNav && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
          (function() {
            if (!window.navListenerAdded) {
              document.addEventListener('click', (e) => {
                const nav = document.getElementById('main-nav');
                const toggle = document.getElementById('mobile-menu-toggle');
                if (nav && nav.classList.contains('open') && !nav.contains(e.target) && e.target !== toggle) {
                  nav.classList.remove('open');
                  if (toggle) toggle.innerText = 'MENU';
                  document.body.style.overflow = '';
                }
              });
              window.navListenerAdded = true;
            }

            const initNav = () => {
              const toggle = document.getElementById('mobile-menu-toggle');
              const nav = document.getElementById('main-nav');

              if (toggle && nav) {
                toggle.onclick = (e) => {
                  e.stopPropagation();
                  const isOpen = nav.classList.toggle('open');
                  toggle.innerText = isOpen ? 'CLOSE' : 'MENU';
                  document.body.style.overflow = isOpen ? 'hidden' : '';
                };

                nav.querySelectorAll('a').forEach(link => {
                  link.onclick = () => {
                    nav.classList.remove('open');
                    toggle.innerText = 'MENU';
                    document.body.style.overflow = '';
                  };
                });
              }
            };

            initNav();
            document.addEventListener('htmx:afterSwap', initNav);
          })();
        `,
              }}
            />
          )}

          {/* Mouse tracking for interactive overlays */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
          if (!window.mouseListenerAdded) {
            var ticking = false;
            document.addEventListener('mousemove', function(e) {
              if (!ticking) {
                requestAnimationFrame(function() {
                  document.body.style.setProperty('--mouse-x', e.clientX + 'px');
                  document.body.style.setProperty('--mouse-y', e.clientY + 'px');
                  ticking = false;
                });
                ticking = true;
              }
            }, { passive: true });
            window.mouseListenerAdded = true;
          }
        `,
            }}
          />

          {/* Page-Specific Custom Script Injections */}
          {page?.seo?.customHeadScripts && raw(page.seo.customHeadScripts)}
        </body>
      </html>
    </>
  );
};

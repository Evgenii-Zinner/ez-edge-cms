/** @jsxImportSource hono/jsx */
/**
 * @module BaseLayout
 * @description The primary layout wrapper for all public-facing pages.
 * Handles the site's main structure, including the futuristic header,
 * responsive navigation, dynamic content area, and SEO-optimized footer.
 */

import { raw } from "hono/html";
import {
  ThemeConfig,
  NavConfig,
  SiteConfig,
  FooterConfig,
  PageConfig,
} from "@core/schema";
import { Head } from "@components/Head";

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
}

/**
 * Component: BaseLayout
 * Provides the foundational HTML structure for the public site.
 * Includes interactive UI overlays (scanlines, dots) and handles
 * responsive navigation logic via client-side scripts.
 */
export const BaseLayout = (props: BaseLayoutProps) => {
  const { site, title, theme, page, detectedUrl, nav, children, footer } =
    props;
  const siteTitle = site.title;

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
          {/* Futuristic visual overlays */}
          <div class="ui-overlay scanlines"></div>
          <div class="ui-overlay dots"></div>
          <div class="ui-overlay dots-interactive"></div>

          {/* Mobile Navigation Drawer (Moved outside header for reliable fixed positioning) */}
          <nav class="main-nav lg:hidden" id="main-nav">
            {nav.items.map((item) => (
              <a href={item.path} class="nav-link">
                {item.label}
              </a>
            ))}
          </nav>

          {/* Site Header */}
          <header class="main-header">
            <div class="header-content">
              <a href="/" class="logo flex items-center gap-2">
                {site.logoSvg && (
                  <img
                    src={`data:image/svg+xml,${encodeURIComponent(site.logoSvg)}`}
                    alt="Logo"
                    style={{
                      width: "32px",
                      height: "32px",
                      objectFit: "contain",
                      filter: "drop-shadow(0 0 5px var(--theme-accent))",
                    }}
                  />
                )}
                <div>{siteTitle}</div>
              </a>

              <button class="menu-toggle" id="mobile-menu-toggle">
                MENU
              </button>

              {/* Desktop Navigation (Hidden on mobile) */}
              <div class="max-lg:hidden flex gap-6 items-center">
                {nav.items.map((item) => (
                  <a href={item.path} class="nav-link">
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main id="main-content">{children}</main>

          {/* Site Footer */}
          <footer class="main-footer">
            <div class="footer-content px-8 flex flex-col gap-8">
              {/* Row 1: Logo & Links */}
              <div class="flex flex-wrap items-center justify-between gap-8">
                <a href="/" class="logo flex items-center gap-2 text-1.2rem">
                  {site.logoSvg && (
                    <img
                      src={`data:image/svg+xml,${encodeURIComponent(site.logoSvg)}`}
                      alt="Logo"
                      style={{
                        width: "24px",
                        height: "24px",
                        objectFit: "contain",
                        filter: "drop-shadow(0 0 3px var(--theme-accent))",
                      }}
                    />
                  )}
                  <div>{siteTitle}</div>
                </a>

                <div class="footer-links flex gap-6">
                  {footer.links.map((link) => (
                    <a href={link.path} class="footer-link">
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Row 2: Copyright & Status */}
              <div class="footer-bottom">
                <div
                  class="footer-copyright"
                  dangerouslySetInnerHTML={{
                    __html: site.copyright
                      ? site.copyright
                          .replace(
                            "{year}",
                            new Date().getFullYear().toString(),
                          )
                          .replace("{author}", site.author || "")
                      : "",
                  }}
                ></div>

                {site.showStatus && (
                  <div class="branding-wrapper">
                    <a
                      href="https://ez-edge-cms.ezinner.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="branding-link group"
                      style={{ border: "none", background: "none", padding: 0 }}
                    >
                      <span class="font-nav text-0.75rem tracking-2px text-[var(--theme-text-dim)] group-hover:text-[var(--theme-accent)] transition-colors uppercase">
                        POWERED BY EZ EDGE CMS
                      </span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </footer>

          {/* Client-side Navigation Logic */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
          (function() {
            // Global click listener added only once
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

                nav.querySelectorAll('.nav-link').forEach(link => {
                  link.onclick = () => {
                    nav.classList.remove('open');
                    toggle.innerText = 'MENU';
                    document.body.style.overflow = '';
                  };
                });
              }
            };

            // Run on load and after HTMX swaps
            initNav();
            document.addEventListener('htmx:afterSwap', initNav);

            // Interactive mouse tracking for dot overlay
            if (!window.mouseListenerAdded) {
              document.addEventListener('mousemove', (e) => {
                document.body.style.setProperty('--mouse-x', e.clientX + 'px');
                document.body.style.setProperty('--mouse-y', e.clientY + 'px');
              });
              window.mouseListenerAdded = true;
            }
          })();
        `,
            }}
          />

          {/* SVG Glow Filters */}
          <svg
            style={{ position: "absolute", width: 0, height: 0 }}
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <filter
                id="neon-glow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>

          {/* Page-Specific Custom Script Injections (Re-executed on HTMX navigation) */}
          {page?.seo?.customHeadScripts && raw(page.seo.customHeadScripts)}
        </body>
      </html>
    </>
  );
};

/** @jsxImportSource hono/jsx */
/**
 * @module AdminLayout
 * @description The primary layout wrapper for all Administrative HUD pages.
 * Handles the administrative sidebar, global overlays, toast notifications,
 * and advanced navigation logic, including unsaved changes detection.
 */

import { raw } from "hono/html";
import { ThemeConfig, SiteConfig } from "@core/schema";
import { Head } from "@components/Head";

/**
 * Props for the AdminLayout component.
 */
export interface AdminLayoutProps {
  /** The browser title for the page. */
  title: string;
  /** The content to be rendered within the main area. */
  children: any;
  /** Global theme configuration. */
  theme: ThemeConfig;
  /** Global site configuration. */
  site: SiteConfig;
  /** Global SEO configuration. */
  seo: SiteConfig["seo"];
  /** If true, injects Editor.js assets into the head. */
  isEditor?: boolean;
  /** If true, renders without the sidebar (used for auth/onboarding). */
  hideSidebar?: boolean;
}

/**
 * Component: AdminLayout
 * Provides the structure for the Administrative HUD. Includes logic for:
 * 1. Sidebar navigation with HTMX boosting.
 * 2. Unsaved changes detection via form tracking.
 * 3. Modal confirmations for potentially destructive navigation.
 */
export const AdminLayout = (props: AdminLayoutProps) => {
  return (
    <>
      {raw("<!DOCTYPE html>\n")}
      <html lang="en">
        <Head
          title={props.title}
          theme={props.theme}
          site={props.site}
          isAdmin={true}
          isEditor={props.isEditor}
        />
        <body class="admin-body">
          {/* Futuristic Background Overlays */}
          <div class="ui-overlay scanlines"></div>
          <div class="ui-overlay dots"></div>
          <div class="ui-overlay dots-interactive"></div>

          <div
            class={
              props.hideSidebar
                ? "flex min-h-screen bg-[var(--theme-bg)] color-[var(--theme-text-main)]"
                : "admin-shell"
            }
          >
            {/* Sidebar Navigation */}
            {!props.hideSidebar && (
              <aside
                class="admin-sidebar"
                hx-boost="true"
                hx-target="body"
                hx-swap="outerHTML"
              >
                <div class="logo mb-8 pl-2">EZ-ADMIN</div>
                <a href="/admin" class="nav-item">
                  DASHBOARD
                </a>
                <a href="/admin/pages" class="nav-item">
                  PAGES
                </a>
                <a href="/admin/navigation" class="nav-item">
                  NAVIGATION
                </a>
                <a href="/admin/theme" class="nav-item">
                  THEME STYLER
                </a>
                <a href="/admin/site" class="nav-item">
                  SITE SETTINGS
                </a>
                <a href="/admin/files" class="nav-item">
                  TEXT FILES
                </a>
                <div class="mt-auto flex flex-col gap-2">
                  <a
                    href="/admin/logout"
                    class="nav-item color-[var(--theme-text-dim)]"
                    hx-boost="false"
                  >
                    LOGOUT
                  </a>
                  <a href="/" class="nav-item" hx-boost="false">
                    BACK TO SITE
                  </a>
                </div>
              </aside>
            )}

            {/* Main Content Area */}
            <main
              class={
                props.hideSidebar
                  ? "ml-0 w-full p-3 flex justify-center items-center"
                  : "admin-content"
              }
              id="admin-main"
            >
              {props.children}
            </main>
          </div>

          {/* Global Confirmation Modal */}
          <div id="confirm-modal" class="modal-overlay">
            <div class="modal-content">
              <h2 id="confirm-title" class="mt-0 text-1.2rem">
                Confirm Action
              </h2>
              <p
                id="confirm-message"
                class="font-nav color-[var(--theme-text-dim)] mb-8"
              >
                Are you sure you want to proceed?
              </p>
              <div class="flex gap-4">
                <button
                  id="confirm-yes"
                  class="btn-primary border-[var(--color-error)] color-[var(--color-error)] flex-1"
                >
                  CONFIRM
                </button>
                <button id="confirm-no" class="btn-primary flex-1">
                  CANCEL
                </button>
              </div>
            </div>
          </div>

          {/* Global target for toast notifications */}
          <div id="global-toast" class="fixed bottom-8 right-8 z-9999"></div>

          {/* Admin Client-Side Logic */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
          (function() {
            window.adminHasChanges = false;
            let pendingAction = null;

            // Disable unsaved changes tracking on auth routes
            const isAuthRoute = window.location.pathname.startsWith("/admin/setup") || window.location.pathname.startsWith("/admin/login");

            if (!isAuthRoute) {
              // Track inputs to detect dirty state
              document.addEventListener('input', (e) => {
                if (e.target.closest('form') && !e.target.classList.contains('admin-radio')) {
                  window.adminHasChanges = true;
                }
              });

              // Reset dirty state after successful HTMX saves
              document.addEventListener('htmx:afterOnLoad', (e) => {
                 if (e.detail.xhr.status === 200 && (e.detail.pathInfo.requestPath.includes('save') || e.detail.pathInfo.requestPath.includes('publish'))) {
                   window.adminHasChanges = false;
                 }
              });
            }

            const modal = document.getElementById('confirm-modal');
            const confirmTitle = document.getElementById('confirm-title');
            const confirmMessage = document.getElementById('confirm-message');
            const yesBtn = document.getElementById('confirm-yes');
            const noBtn = document.getElementById('confirm-no');

            function showConfirm(title, message, yesText, action) {
              confirmTitle.innerText = title;
              confirmMessage.innerText = message;
              yesBtn.innerText = yesText;
              pendingAction = action;
              modal.classList.add('open');
            }

            yesBtn.onclick = () => {
              modal.classList.remove('open');
              if (pendingAction) {
                const action = pendingAction;
                pendingAction = null;
                action();
              }
            };

            noBtn.onclick = () => {
              modal.classList.remove('open');
              pendingAction = null;
            };

            // Intercept HTMX navigation if there are unsaved changes OR if data-confirm/hx-confirm is present
            document.addEventListener('htmx:confirm', (e) => {
              const elt = e.detail.elt;
              // Prevent double trigger when we manually issue the request after confirmation
              if (elt.hasAttribute('data-confirmed')) return;

              const question = elt.getAttribute('data-confirm') || e.detail.question;
              const path = e.detail.path || "";
              const isSaveOp = path.includes('save') || path.includes('publish') || path.includes('identity-fields') || path.includes('pages/create') || path.includes('reset') || path.includes('restore');
              
              // Case 1: data-confirm or hx-confirm is present
              if (question) {
                e.preventDefault();
                showConfirm('Confirm Action', question, 'PROCEED', () => {
                  elt.setAttribute('data-confirmed', 'true');
                  e.detail.issueRequest();
                  // Clean up after the request starts
                  setTimeout(() => elt.removeAttribute('data-confirmed'), 0);
                });
                return;
              }

              // Case 2: Unsaved changes
              if (window.adminHasChanges && !isSaveOp) {
                e.preventDefault();
                showConfirm('Unsaved Changes', 'You have unsaved changes on this page. Proceeding will discard them.', 'DISCARD & LEAVE', () => {
                  window.adminHasChanges = false;
                  elt.setAttribute('data-confirmed', 'true');
                  e.detail.issueRequest();
                  setTimeout(() => elt.removeAttribute('data-confirmed'), 0);
                });
              }
            });

            // Intercept standard link clicks if there are unsaved changes
            document.addEventListener('click', (e) => {
              const link = e.target.closest('a');
              // Ignore clicks inside the editor or on elements that are not real navigation links
              if (link && !link.hasAttribute('hx-post') && !link.hasAttribute('hx-get') && !link.closest('.codex-editor') && window.adminHasChanges) {
                const url = link.href;
                if (url && !url.includes(window.location.pathname) && !url.startsWith('javascript:')) {
                  e.preventDefault();
                  showConfirm('Unsaved Changes', 'You have unsaved changes on this page. Proceeding will discard them.', 'DISCARD & LEAVE', () => {
                    window.adminHasChanges = false;
                    window.location.href = url;
                  });
                }
              }
            });
          })();
        `,
            }}
          />
        </body>
      </html>
    </>
  );
};

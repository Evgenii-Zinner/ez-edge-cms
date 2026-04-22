/** @jsxImportSource hono/jsx */
/**
 * @module AdminAuthComponents
 * @description UI components for the administrative authentication flow.
 */

import type { FC } from "hono/jsx";

/**
 * Component: SetupForm
 * Renders the initial administrator creation form.
 *
 * @param props - Component properties.
 * @returns A JSX element representing the setup form.
 */
export const SetupForm: FC<{
  username?: string;
  error?: string;
}> = (props) => (
  <form
    id="setup-form"
    hx-post="/admin/setup"
    hx-target="#setup-form"
    hx-swap="outerHTML"
    class="flex flex-col gap-4 no-track"
  >
    {props.error && (
      <div class="color-[#ff4444] mb-4 text-0.9rem font-nav">{props.error}</div>
    )}
    <div class="admin-field">
      <label class="admin-label" for="setup-username">
        Username
      </label>
      <input
        type="text"
        name="username"
        id="setup-username"
        class="admin-input"
        autocomplete="username"
        required
        minlength={3}
        autofocus
        value={props.username || ""}
      />
    </div>

    <div class="admin-field">
      <label class="admin-label" for="setup-password">
        Password
      </label>
      <input
        type="password"
        name="password"
        id="setup-password"
        class="admin-input"
        autocomplete="new-password"
        required
        minlength={8}
      />
    </div>

    <div class="admin-field">
      <label class="admin-label" for="setup-repeat-password">
        Repeat Password
      </label>
      <input
        type="password"
        name="repeatPassword"
        id="setup-repeat-password"
        class="admin-input"
        autocomplete="new-password"
        required
        minlength={8}
      />
    </div>

    <button type="submit" class="btn-primary mt-4">
      CREATE ADMIN
    </button>
  </form>
);

/**
 * Component: LoginForm
 * Renders the secure login interface.
 *
 * @param props - Component properties.
 * @returns A JSX element representing the login form.
 */
export const LoginForm: FC<{
  username?: string;
  error?: string;
}> = (props) => (
  <form
    id="login-form"
    hx-post="/admin/login"
    hx-target="#login-form"
    hx-swap="outerHTML"
    class="flex flex-col gap-4 no-track"
  >
    {props.error && (
      <div class="color-[#ff4444] mb-4 text-0.9rem font-nav">{props.error}</div>
    )}
    <div class="admin-field">
      <label class="admin-label" for="login-username">
        Username
      </label>
      <input
        type="text"
        name="username"
        id="login-username"
        class="admin-input"
        autocomplete="username"
        required
        autofocus
        value={props.username || ""}
      />
    </div>

    <div class="admin-field">
      <label class="admin-label" for="login-password">
        Password
      </label>
      <input
        type="password"
        name="password"
        id="login-password"
        class="admin-input"
        autocomplete="current-password"
        required
      />
    </div>

    <button type="submit" class="btn-primary mt-4">
      AUTHORIZE
    </button>
  </form>
);

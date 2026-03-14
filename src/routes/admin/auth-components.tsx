/** @jsxImportSource hono/jsx */
/**
 * @module AdminAuthComponents
 * @description UI components for the administrative authentication flow.
 */

import { AdminField } from "@components/AdminUI";

/**
 * Component: SetupForm
 * Renders the initial administrator creation form.
 */
export const SetupForm = (props: { username?: string; error?: string }) => (
  <form
    id="setup-form"
    hx-post="/admin/setup"
    hx-target="#setup-form"
    hx-swap="outerHTML"
    class="flex flex-col gap-4"
  >
    {props.error && (
      <div class="color-[#ff4444] mb-4 text-0.9rem font-nav">{props.error}</div>
    )}
    <AdminField
      label="Username"
      name="username"
      id="setup-username"
      autocomplete="username"
      required
      minlength={3}
      autofocus
      value={props.username || ""}
    />

    <AdminField
      label="Password"
      name="password"
      id="setup-password"
      type="password"
      autocomplete="new-password"
      required
      minlength={8}
    />

    <AdminField
      label="Repeat Password"
      name="repeatPassword"
      id="setup-repeat-password"
      type="password"
      autocomplete="new-password"
      required
      minlength={8}
    />

    <button type="submit" class="btn-primary mt-4">
      CREATE ADMIN
    </button>
  </form>
);

/**
 * Component: LoginForm
 * Renders the secure login interface.
 */
export const LoginForm = (props: { username?: string; error?: string }) => (
  <form
    id="login-form"
    hx-post="/admin/login"
    hx-target="#login-form"
    hx-swap="outerHTML"
    class="flex flex-col gap-4"
  >
    {props.error && (
      <div class="color-[#ff4444] mb-4 text-0.9rem font-nav">{props.error}</div>
    )}
    <AdminField
      label="Username"
      name="username"
      id="login-username"
      autocomplete="username"
      required
      autofocus
      value={props.username || ""}
    />

    <AdminField
      label="Password"
      name="password"
      id="login-password"
      type="password"
      autocomplete="current-password"
      required
    />

    <button type="submit" class="btn-primary mt-4">
      AUTHORIZE
    </button>
  </form>
);

/**
 * @module AdminThemeModule
 * @description Entry point for the refactored Theme Styler module.
 */

import { Hono } from "hono";
import { GlobalConfigVariables } from "@core/middleware";
import views from "@routes/admin/theme/views";
import mutations from "@routes/admin/theme/mutations";

const theme = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();

theme.route("/", views);
theme.route("/", mutations);

export default theme;

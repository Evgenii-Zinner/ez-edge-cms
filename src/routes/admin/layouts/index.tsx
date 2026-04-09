import { Hono } from "hono";
import views from "@routes/admin/layouts/views";
import mutations from "@routes/admin/layouts/mutations";
import { GlobalConfigVariables } from "@core/middleware";

/**
 * @module AdminLayoutsRouter
 * @description Sub-router for managing ELS Layout blueprints.
 */
const layouts = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();

layouts.route("/", views);
layouts.route("/", mutations);

export default layouts;

/**
 * @module AdminSiteModule
 * @description Entry point for the refactored Site Settings module.
 */

import { Hono } from "hono";
import { GlobalConfigVariables } from "@core/middleware";
import views from "@routes/admin/site/views";
import mutations from "@routes/admin/site/mutations";

const site = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();

site.route("/", views);
site.route("/", mutations);

export default site;

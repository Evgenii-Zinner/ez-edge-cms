/**
 * @module AdminPagesModule
 * @description Entry point for the refactored Page Manager module.
 * Combines views (GET) and mutations (POST) into a single route handler.
 */

import { Hono } from "hono";
import { GlobalConfigVariables } from "@core/middleware";
import views from "@routes/admin/pages/views";
import mutations from "@routes/admin/pages/mutations";

const pages = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();

/**
 * Route Mapping:
 * GET  /admin/pages/           -> views.get("/")
 * GET  /admin/pages/edit/:slug -> views.get("/edit/:slug")
 * POST /admin/pages/create     -> mutations.post("/create")
 * ... and so on.
 */
pages.route("/", views);
pages.route("/", mutations);

export default pages;

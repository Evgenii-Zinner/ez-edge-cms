import { Hono } from "hono";
import views from "@routes/admin/shards/views";
import mutations from "@routes/admin/shards/mutations";
import { GlobalConfigVariables } from "@core/middleware";

/**
 * @module AdminShardsRouter
 * @description Sub-router for managing ELS Global Shards.
 */
const shards = new Hono<{ Bindings: Env; Variables: GlobalConfigVariables }>();

shards.route("/", views);
shards.route("/", mutations);

export default shards;

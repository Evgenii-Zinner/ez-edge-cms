/**
 * @module KVAuth
 * @description Logical domain for administrative authentication and session management.
 */

import { AdminUser } from "@core/schema";
import { KEYS } from "@core/kv/base";

/**
 * @description Retrieves the administrative user configuration from KV.
 *
 * @param env - Cloudflare Worker environment.
 * @returns Promise resolving to AdminUser or null.
 */
export const getAdminUser = async (env: Env): Promise<AdminUser | null> => {
  return await env.EZ_CONTENT.get(KEYS.ADMIN_USER, { type: "json" });
};

/**
 * @description Persists the administrative user configuration to KV.
 *
 * @param env - Cloudflare Worker environment.
 * @param user - AdminUser object to store.
 * @returns Promise resolving when the user is saved.
 */
export const saveAdminUser = async (
  env: Env,
  user: AdminUser,
): Promise<void> => {
  await env.EZ_CONTENT.put(KEYS.ADMIN_USER, JSON.stringify(user));
};

/**
 * @description Creates an active session for an authenticated user with a 24-hour expiration.
 *
 * @param env - Cloudflare Worker environment.
 * @param token - Unique session token.
 * @returns Promise resolving when the session is created.
 */
export const createSession = async (env: Env, token: string): Promise<void> => {
  await env.EZ_CONTENT.put(KEYS.SESSION(token), "1", { expirationTtl: 86400 });
};

/**
 * @description Verifies if a given session token is valid and active in KV.
 *
 * @param env - Cloudflare Worker environment.
 * @param token - Session token to verify.
 * @returns Promise resolving to true if the session exists.
 */
export const getSession = async (env: Env, token: string): Promise<boolean> => {
  const session = await env.EZ_CONTENT.get(KEYS.SESSION(token));
  return session !== null;
};

/**
 * @description Destroys an active session by removing its token from KV.
 *
 * @param env - Cloudflare Worker environment.
 * @param token - Session token to revoke.
 * @returns Promise resolving when the session is deleted.
 */
export const deleteSession = async (env: Env, token: string): Promise<void> => {
  await env.EZ_CONTENT.delete(KEYS.SESSION(token));
};

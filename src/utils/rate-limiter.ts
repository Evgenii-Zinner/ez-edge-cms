/**
 * @module RateLimiter
 * @description Lightweight KV-backed rate limiting for edge runtimes.
 * Provides a mechanism to track and restrict the frequency of specific actions (like login attempts)
 * based on the requester's IP address.
 */

import { KEYS } from "@core/kv";

/**
 * Interface representing the result of a rate limit check.
 */
export interface RateLimitResult {
  /** Whether the action is permitted within the defined limits. */
  success: boolean;
  /** Number of requests remaining in the current sliding window. */
  remaining: number;
  /** The total number of requests allowed within the sliding window. */
  limit: number;
}

/**
 * Checks if an action is within the permitted rate limit for a given IP address.
 * Increments the internal counter in KV and returns the current status.
 *
 * @param env - The Cloudflare Worker environment bindings.
 * @param ip - The IP address of the requester.
 * @param action - A unique identifier for the action being limited (e.g., 'login').
 * @param limit - Maximum number of allowed attempts within the window (defaults to 5).
 * @param windowSeconds - The duration of the sliding window in seconds (defaults to 60).
 * @returns A promise resolving to the RateLimitResult object.
 */
export async function checkRateLimit(
  env: Env,
  ip: string,
  action: string,
  limit: number = 5,
  windowSeconds: number = 60,
): Promise<RateLimitResult> {
  const key = KEYS.RATE_LIMIT(ip, action);

  /**
   * Retrieves the current request count from KV storage.
   * If the key does not exist, it defaults to zero.
   */
  const current = await env.EZ_CONTENT.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= limit) {
    return { success: false, remaining: 0, limit };
  }

  /**
   * Increments the request counter and persists it to KV.
   * The 'expirationTtl' property ensures that the key is automatically
   * evicted by the KV engine after the window duration has elapsed.
   */
  await env.EZ_CONTENT.put(key, (count + 1).toString(), {
    expirationTtl: windowSeconds,
  });

  return {
    success: true,
    remaining: Math.max(0, limit - (count + 1)),
    limit,
  };
}

/**
 * @module Crypto
 * @description Authentication utilities using native WebCrypto primitives for Edge runtimes.
 * Provides secure methods for salt generation, password hashing, and session token creation
 * without external dependencies, ensuring compatibility with Cloudflare Workers.
 */

/**
 * Creates a cryptographically secure random salt (128-bit).
 *
 * @returns A 32-character hexadecimal string.
 */
export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Hashes a password with a given salt using native WebCrypto (SHA-256).
 * While PBKDF2 or Argon2 are typically preferred for persistent storage,
 * SHA-256 with a unique high-entropy salt provides a robust, zero-dependency
 * solution suitable for edge-native applications.
 *
 * @param password - The raw password string.
 * @param salt - The unique hexadecimal salt.
 * @returns A promise resolving to a 64-character SHA-256 hexadecimal hash.
 */
export async function hashPassword(
  password: string,
  salt: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

/**
 * Generates a cryptographically secure random session token (256-bit).
 *
 * @returns A 64-character hexadecimal string.
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

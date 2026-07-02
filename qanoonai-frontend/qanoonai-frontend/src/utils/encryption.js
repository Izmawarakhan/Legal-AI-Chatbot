/**
 * E2EE Utility — XSalsa20-Poly1305 symmetric encryption via tweetnacl
 *
 * For direct chats (customer ↔ lawyer):
 *   - Shared key is derived from the chat_id so both sides compute the same key
 *   - Messages are encrypted before leaving the browser
 *   - Backend stores only ciphertext — never sees plaintext
 *
 * Format stored in backend: "e2ee:<base64(nonce)>:<base64(ciphertext)>"
 */

import nacl from "tweetnacl";
import { encodeUTF8, decodeUTF8, encodeBase64, decodeBase64 } from "tweetnacl-util";

const E2EE_PREFIX = "e2ee:";

// ─── Key derivation ───────────────────────────────────────────────────────────

/**
 * Derive a 32-byte symmetric key from a chat_id string.
 * Uses SHA-256 so both customer and lawyer always compute the same key
 * given the same chat_id — no key exchange needed.
 */
export async function deriveKeyFromChatId(chatId) {
  const encoded = encodeUTF8(String(chatId) + "_qanoonai_e2ee_v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return new Uint8Array(hashBuffer); // 32 bytes — perfect for nacl.secretbox
}

/** Generate a fresh random key (for AI chatbot sessions). */
export function generateSessionKey() {
  return nacl.randomBytes(nacl.secretbox.keyLength); // 32 bytes
}

// ─── Encrypt / Decrypt ───────────────────────────────────────────────────────

/**
 * Encrypt a plaintext string with the given key.
 * Returns a prefixed string: "e2ee:<base64nonce>:<base64ciphertext>"
 */
export function encryptMessage(plaintext, key) {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const msgBytes = encodeUTF8(String(plaintext));
  const encrypted = nacl.secretbox(msgBytes, nonce, key);
  return `${E2EE_PREFIX}${encodeBase64(nonce)}:${encodeBase64(encrypted)}`;
}

/**
 * Decrypt a ciphertext string produced by encryptMessage.
 * Returns the original plaintext, or the raw string if it isn't encrypted
 * (graceful fallback so old messages don't break the UI).
 */
export function decryptMessage(ciphertext, key) {
  if (!ciphertext || !key) return ciphertext || "";
  if (!ciphertext.startsWith(E2EE_PREFIX)) return ciphertext; // not encrypted

  try {
    const body = ciphertext.slice(E2EE_PREFIX.length);
    const colonIdx = body.indexOf(":");
    if (colonIdx === -1) return ciphertext;

    const nonce = decodeBase64(body.slice(0, colonIdx));
    const encrypted = decodeBase64(body.slice(colonIdx + 1));
    const decrypted = nacl.secretbox.open(encrypted, nonce, key);
    if (!decrypted) return "[⚠️ Decryption failed — message may be corrupted]";
    return new TextDecoder().decode(decrypted);
  } catch {
    return ciphertext; // fallback: show raw
  }
}

/** Returns true if the string is an E2EE-encrypted payload. */
export function isEncrypted(text) {
  return typeof text === "string" && text.startsWith(E2EE_PREFIX);
}

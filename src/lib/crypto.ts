"use client";

const ENCRYPTION_KEY = "tansi-motors-secure-key-123"; // Obfuscated key
const SALT = "tansi-salt-999";

/**
 * Checks if the browser environment supports the Web Crypto API.
 * Secure context (HTTPS or localhost) is required for window.crypto.subtle.
 */
const isSecureContext = () => {
  return typeof window !== "undefined" && !!window.crypto && !!window.crypto.subtle;
};

/**
 * Derives a cryptographic key from a simple string.
 */
async function getDerivedKey() {
  if (!isSecureContext()) return null;

  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(ENCRYPTION_KEY),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(SALT),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a string using AES-GCM and returns a base64 encoded string.
 * Falls back to simple base64 if not in a secure context.
 */
export async function encryptName(name: string): Promise<string> {
  if (!isSecureContext()) {
    // Fallback for non-secure contexts (e.g. 192.168.x.x without HTTPS)
    console.warn("Crypto: Not in a secure context. Falling back to simple encoding.");
    return `plaintext:${btoa(name)}`;
  }

  const enc = new TextEncoder();
  const key = await getDerivedKey();
  if (!key) return `plaintext:${btoa(name)}`;

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(name)
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a base64 encoded string using AES-GCM.
 */
export async function decryptName(encryptedBase64: string): Promise<string> {
  if (!encryptedBase64) return "";

  // Handle fallback encoding
  if (encryptedBase64.startsWith("plaintext:")) {
    try {
      return atob(encryptedBase64.replace("plaintext:", ""));
    } catch {
      return "";
    }
  }

  if (!isSecureContext()) return "";

  try {
    const combined = new Uint8Array(
      atob(encryptedBase64)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const key = await getDerivedKey();
    if (!key) return "";

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "";
  }
}

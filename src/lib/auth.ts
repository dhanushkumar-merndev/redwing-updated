/**
 * Generates a SHA-256 hash of a string with an optional salt using the Web Crypto API.
 * This is compatible with both the browser and Next.js common runtimes.
 */
export const hashPassword = async (password: string, salt = ""): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
};

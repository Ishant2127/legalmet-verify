/**
 * Canonical certificate seal.
 *
 * Every certificate is sealed over a deterministic payload:
 *   CERTIFICATE_NUMBER|SERIAL_NUMBER|ISSUED_AT_ISO
 *
 * The digest is re-computed in the browser at verification time and compared
 * with the seal stored in the registry. Any drift in the three source fields
 * produces a different digest, exposing tampering.
 */
export function canonicalCertificatePayload(input: {
  number: string;
  serial: string;
  issuedAt: string;
}) {
  const issuedAt = new Date(input.issuedAt).toISOString();
  return [
    input.number.trim().toUpperCase(),
    input.serial.trim().toUpperCase(),
    issuedAt,
  ].join("|");
}

export async function sha256Hex(value: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("Web Crypto is not available in this environment.");
  }
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function sealCertificate(input: {
  number: string;
  serial: string;
  issuedAt: string;
}) {
  return sha256Hex(canonicalCertificatePayload(input));
}

export function shortHash(hash: string, head = 12, tail = 8) {
  if (!hash) return "Generating seal…";
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

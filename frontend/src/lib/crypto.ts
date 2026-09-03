// lib/crypto.ts
import { argon2id } from "hash-wasm";

// OWASP-minimum-ish params for a browser context. Argon2id is expensive
// by design — this runs once per login/register, not per request.
const ARGON2_MEMORY_SIZE = 19456; // KiB (~19 MiB)
const ARGON2_ITERATIONS = 2;
const ARGON2_PARALLELISM = 1;
const ARGON2_HASH_LENGTH = 32; // 256-bit key, matches AES-256

// ---- base64 <-> ArrayBuffer helpers (for talking to the backend) ----

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBuf(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// ---- 1. Master password -> master key ----
// Salt = normalized email, per your design decision (deterministic,
// no extra DB column/round-trip). Non-extractable: this key should
// never need to leave the browser as raw bytes again after this call.
export async function deriveMasterKey(
  masterPassword: string,
  email: string,
): Promise<CryptoKey> {
  const salt = new TextEncoder().encode(email.trim().toLowerCase());

  const hashBytes = await argon2id({
    password: masterPassword,
    salt,
    parallelism: ARGON2_PARALLELISM,
    iterations: ARGON2_ITERATIONS,
    memorySize: ARGON2_MEMORY_SIZE,
    hashLength: ARGON2_HASH_LENGTH,
    outputType: "binary",
  });

  return crypto.subtle.importKey(
    "raw",
    new Uint8Array(hashBytes), // normalize to a fresh, non-shared ArrayBuffer-backed view
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

// ---- 2. Random AES-256 vault key ----
// Extractable = true, since we need to export it once to wrap it.
export async function generateVaultKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

// ---- 3. Wrap / unwrap the vault key with the master key ----

export async function wrapVaultKey(
  vaultKey: CryptoKey,
  masterKey: CryptoKey,
): Promise<{ encrypted_vault_key: string; vault_key_iv: string }> {
  const rawVaultKey = await crypto.subtle.exportKey("raw", vaultKey);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV, standard for GCM

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    masterKey,
    rawVaultKey,
  );

  return {
    encrypted_vault_key: bufToBase64(ciphertext),
    vault_key_iv: bufToBase64(iv.buffer),
  };
}

export async function unwrapVaultKey(
  encryptedVaultKey: string,
  vaultKeyIv: string,
  masterKey: CryptoKey,
): Promise<CryptoKey> {
  const ciphertext = base64ToBuf(encryptedVaultKey);
  const iv = base64ToBuf(vaultKeyIv);

  const rawVaultKey = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    masterKey,
    ciphertext,
  );

  return crypto.subtle.importKey(
    "raw",
    rawVaultKey,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"],
  );
}

// ---- 4. Item field encrypt/decrypt (title, data payload) ----

export async function encryptField(
  plaintext: string,
  vaultKey: CryptoKey,
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    vaultKey,
    encoded,
  );

  return {
    ciphertext: bufToBase64(ciphertext),
    iv: bufToBase64(iv.buffer),
  };
}

export async function decryptField(
  ciphertextB64: string,
  ivB64: string,
  vaultKey: CryptoKey,
): Promise<string> {
  const ciphertext = base64ToBuf(ciphertextB64);
  const iv = base64ToBuf(ivB64);

  const plaintextBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    vaultKey,
    ciphertext,
  );

  return new TextDecoder().decode(plaintextBuf);
}

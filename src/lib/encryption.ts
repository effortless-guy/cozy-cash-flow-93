import libsodium from 'libsodium-wrappers-sumo';

/**
 * Encrypts a string using a password.
 * Uses Libsodium's crypto_pwhash for key derivation (Argon2id)
 * and crypto_secretbox for encryption (XSalsa20-Poly1305).
 */
export async function encryptData(plaintext: string, password: string): Promise<string> {
  await libsodium.ready;
  
  const salt = libsodium.randombytes_buf(libsodium.crypto_pwhash_SALTBYTES);
  
  // Derive key using Argon2id
  const key = libsodium.crypto_pwhash(
    libsodium.crypto_secretbox_KEYBYTES,
    password,
    salt,
    libsodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    libsodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    libsodium.crypto_pwhash_ALG_ARGON2ID13
  );

  const nonce = libsodium.randombytes_buf(libsodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = libsodium.crypto_secretbox_easy(plaintext, nonce, key);

  // Combine salt + nonce + ciphertext and encode as base64
  const combined = new Uint8Array(salt.length + nonce.length + ciphertext.length);
  combined.set(salt);
  combined.set(nonce, salt.length);
  combined.set(ciphertext, salt.length + nonce.length);

  return libsodium.to_base64(combined);
}

/**
 * Decrypts a base64-encoded string using a password.
 */
export async function decryptData(encryptedBase64: string, password: string): Promise<string> {
  await libsodium.ready;
  
  const combined = libsodium.from_base64(encryptedBase64);
  
  const salt = combined.slice(0, libsodium.crypto_pwhash_SALTBYTES);
  const nonce = combined.slice(
    libsodium.crypto_pwhash_SALTBYTES,
    libsodium.crypto_pwhash_SALTBYTES + libsodium.crypto_secretbox_NONCEBYTES
  );
  const ciphertext = combined.slice(
    libsodium.crypto_pwhash_SALTBYTES + libsodium.crypto_secretbox_NONCEBYTES
  );

  const key = libsodium.crypto_pwhash(
    libsodium.crypto_secretbox_KEYBYTES,
    password,
    salt,
    libsodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    libsodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    libsodium.crypto_pwhash_ALG_ARGON2ID13
  );

  try {
    const decrypted = libsodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
    return libsodium.to_string(decrypted);
  } catch (e) {
    throw new Error("Invalid password or corrupted backup");
  }
}

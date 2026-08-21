import { describe, it, expect } from "vitest";
import { encryptData, decryptData } from "./encryption";

describe("encryption", () => {
  it("should encrypt and decrypt data correctly", async () => {
    const plaintext = JSON.stringify({ test: "data" });
    const password = "secure-password";
    
    const encrypted = await encryptData(plaintext, password);
    expect(encrypted).not.toBe(plaintext);
    
    const decrypted = await decryptData(encrypted, password);
    expect(decrypted).toBe(plaintext);
  });

  it("should throw error for incorrect password", async () => {
    const plaintext = "secret";
    const password = "right-password";
    const wrongPassword = "wrong-password";
    
    const encrypted = await encryptData(plaintext, password);
    await expect(decryptData(encrypted, wrongPassword)).rejects.toThrow("Invalid password or corrupted backup");
  });
});

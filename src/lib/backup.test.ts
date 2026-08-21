import { describe, it, expect } from "vitest";
import { validateBackup } from "./logic-helpers";

describe("validateBackup", () => {
  it("should return true for a valid backup", () => {
    const validBackup = {
      version: 2,
      data: {
        salary: { years: {} },
        settings: { currency: "₹" }
      }
    };
    expect(validateBackup(validBackup)).toBe(true);
  });

  it("should return false for missing data property", () => {
    const invalidBackup = { version: 2 };
    expect(validateBackup(invalidBackup)).toBe(false);
  });

  it("should return false for non-object data", () => {
    const invalidBackup = { version: 2, data: "invalid" };
    expect(validateBackup(invalidBackup)).toBe(false);
  });

  it("should return false if no core stores are present", () => {
    const emptyBackup = { version: 2, data: {} };
    expect(validateBackup(emptyBackup)).toBe(false);
  });
});

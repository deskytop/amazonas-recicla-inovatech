import { describe, it, expect } from "vitest";
import { hashBinKey, verifyBinKey, generateBinKey } from "./bin-key";

describe("generateBinKey", () => {
  it("retorna string com prefixo bink_", () => {
    expect(generateBinKey()).toMatch(/^bink_/);
  });

  it("retorna keys distintas em chamadas consecutivas", () => {
    expect(generateBinKey()).not.toBe(generateBinKey());
  });
});

describe("hashBinKey + verifyBinKey", () => {
  it("verifyBinKey retorna true com hash correto", async () => {
    const key = generateBinKey();
    const hash = await hashBinKey(key);
    expect(await verifyBinKey(key, hash)).toBe(true);
  });

  it("verifyBinKey retorna false com hash de outra key", async () => {
    const hash = await hashBinKey(generateBinKey());
    expect(await verifyBinKey(generateBinKey(), hash)).toBe(false);
  });

  it("verifyBinKey retorna false com hash invalido", async () => {
    expect(await verifyBinKey("qualquer", "nao-eh-hash-bcrypt")).toBe(false);
  });

  it("hashes diferentes para a mesma key (salt aleatorio)", async () => {
    const key = generateBinKey();
    const a = await hashBinKey(key);
    const b = await hashBinKey(key);
    expect(a).not.toBe(b);
    expect(await verifyBinKey(key, a)).toBe(true);
    expect(await verifyBinKey(key, b)).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { canAfford, INITIAL_REWARDS } from "./rewards";

describe("canAfford", () => {
  it("retorna true quando saldo igual ao custo", () => {
    expect(canAfford(100, 100)).toBe(true);
  });

  it("retorna true quando saldo maior que o custo", () => {
    expect(canAfford(500, 100)).toBe(true);
  });

  it("retorna false quando saldo insuficiente", () => {
    expect(canAfford(50, 100)).toBe(false);
  });

  it("retorna false para custo positivo com saldo zero", () => {
    expect(canAfford(0, 1)).toBe(false);
  });

  it("aceita custo zero (gratuita)", () => {
    expect(canAfford(0, 0)).toBe(true);
  });
});

describe("INITIAL_REWARDS", () => {
  it("tem 4 recompensas seed", () => {
    expect(INITIAL_REWARDS).toHaveLength(4);
  });

  it("cada recompensa tem custo positivo", () => {
    for (const reward of INITIAL_REWARDS) {
      expect(reward.costPoints).toBeGreaterThan(0);
    }
  });

  it("IPTU Verde Manaus tem metadata estrutural", () => {
    const iptu = INITIAL_REWARDS.find((r) => r.title.includes("IPTU"));
    expect(iptu?.metadata).toEqual({ program: "iptu_verde_manaus", percent: 5 });
  });
});

import { describe, it, expect } from "vitest";
import { pointsForMaterial, isValidMaterial } from "./materials";

describe("pointsForMaterial", () => {
  it("retorna 75 para plástico", () => {
    expect(pointsForMaterial("plastic")).toBe(75);
  });

  it("retorna 100 para metal", () => {
    expect(pointsForMaterial("metal")).toBe(100);
  });

  it("retorna 100 para vidro", () => {
    expect(pointsForMaterial("glass")).toBe(100);
  });

  it("retorna 50 para papel", () => {
    expect(pointsForMaterial("paper")).toBe(50);
  });
});

describe("isValidMaterial", () => {
  it("aceita os 4 materiais válidos", () => {
    expect(isValidMaterial("plastic")).toBe(true);
    expect(isValidMaterial("metal")).toBe(true);
    expect(isValidMaterial("glass")).toBe(true);
    expect(isValidMaterial("paper")).toBe(true);
  });

  it("rejeita strings desconhecidas", () => {
    expect(isValidMaterial("organic")).toBe(false);
    expect(isValidMaterial("")).toBe(false);
    expect(isValidMaterial("PLASTIC")).toBe(false);
  });
});

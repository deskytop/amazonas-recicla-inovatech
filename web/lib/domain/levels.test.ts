import { describe, it, expect } from "vitest";
import { levelForLifetimePoints, progressToNextLevel } from "./levels";

describe("levelForLifetimePoints", () => {
  it("usuário sem pontos é Semente", () => {
    expect(levelForLifetimePoints(0).name).toBe("Semente");
  });

  it("499 pts ainda é Semente", () => {
    expect(levelForLifetimePoints(499).name).toBe("Semente");
  });

  it("500 pts vira Broto", () => {
    expect(levelForLifetimePoints(500).name).toBe("Broto");
  });

  it("2000 pts é Folha", () => {
    expect(levelForLifetimePoints(2000).name).toBe("Folha");
  });

  it("acima de 10000 é Árvore", () => {
    expect(levelForLifetimePoints(50000).name).toBe("Árvore");
  });
});

describe("progressToNextLevel", () => {
  it("para 0 pts, próximo é Broto e faltam 500 pts", () => {
    const r = progressToNextLevel(0);
    expect(r.current.name).toBe("Semente");
    expect(r.next?.name).toBe("Broto");
    expect(r.pointsToNext).toBe(500);
  });

  it("para 250 pts, está em 50% do caminho para Broto", () => {
    const r = progressToNextLevel(250);
    expect(r.percentToNext).toBe(50);
  });

  it("para Árvore, não tem próximo", () => {
    const r = progressToNextLevel(20000);
    expect(r.next).toBe(null);
    expect(r.percentToNext).toBe(100);
  });
});

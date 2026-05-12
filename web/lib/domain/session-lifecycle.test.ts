import { describe, it, expect } from "vitest";
import {
  canTransition,
  assertTransition,
  SessionTransitionError,
  generateSessionToken,
  SESSION_TTL_SECONDS,
} from "./session-lifecycle";

describe("canTransition", () => {
  it("awaiting_material -> material_detected é válido", () => {
    expect(canTransition("awaiting_material", "material_detected")).toBe(true);
  });

  it("awaiting_material -> expired é válido", () => {
    expect(canTransition("awaiting_material", "expired")).toBe(true);
  });

  it("material_detected -> completed é válido", () => {
    expect(canTransition("material_detected", "completed")).toBe(true);
  });

  it("awaiting_material -> completed é inválido (pula classify)", () => {
    expect(canTransition("awaiting_material", "completed")).toBe(false);
  });

  it("completed é estado terminal — nenhuma saída", () => {
    expect(canTransition("completed", "expired")).toBe(false);
    expect(canTransition("completed", "failed")).toBe(false);
  });

  it("expired é estado terminal", () => {
    expect(canTransition("expired", "completed")).toBe(false);
  });
});

describe("assertTransition", () => {
  it("não lança para transição válida", () => {
    expect(() => assertTransition("awaiting_material", "expired")).not.toThrow();
  });

  it("lança SessionTransitionError para transição inválida", () => {
    expect(() => assertTransition("completed", "expired")).toThrow(SessionTransitionError);
  });

  it("erro inclui from e to", () => {
    try {
      assertTransition("awaiting_material", "completed");
    } catch (err) {
      expect(err).toBeInstanceOf(SessionTransitionError);
      expect((err as SessionTransitionError).from).toBe("awaiting_material");
      expect((err as SessionTransitionError).to).toBe("completed");
    }
  });
});

describe("generateSessionToken", () => {
  it("retorna string com prefixo sess_", () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^sess_/);
  });

  it("retorna tokens distintos em chamadas consecutivas", () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a).not.toBe(b);
  });

  it("tokens têm comprimento estável (~30 chars)", () => {
    const token = generateSessionToken();
    expect(token.length).toBeGreaterThanOrEqual(28);
    expect(token.length).toBeLessThanOrEqual(35);
  });
});

describe("SESSION_TTL_SECONDS", () => {
  it("é 60 (1 minuto)", () => {
    expect(SESSION_TTL_SECONDS).toBe(60);
  });
});

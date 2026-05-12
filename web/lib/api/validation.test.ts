import { describe, it, expect } from "vitest";
import {
  classifyRequestSchema,
  heartbeatRequestSchema,
  activeSessionResponseSchema,
} from "./validation";

describe("classifyRequestSchema", () => {
  it("aceita material valido + confidence em [0,1]", () => {
    const result = classifyRequestSchema.safeParse({ material: "plastic", confidence: 0.94 });
    expect(result.success).toBe(true);
  });

  it("rejeita material desconhecido", () => {
    const result = classifyRequestSchema.safeParse({ material: "organic", confidence: 0.9 });
    expect(result.success).toBe(false);
  });

  it("rejeita confidence > 1", () => {
    const result = classifyRequestSchema.safeParse({ material: "metal", confidence: 1.2 });
    expect(result.success).toBe(false);
  });

  it("rejeita confidence negativa", () => {
    const result = classifyRequestSchema.safeParse({ material: "metal", confidence: -0.1 });
    expect(result.success).toBe(false);
  });
});

describe("heartbeatRequestSchema", () => {
  it("aceita payload valido", () => {
    expect(heartbeatRequestSchema.safeParse({ fillLevelPercent: 42, firmwareVersion: "0.1.0" }).success).toBe(true);
  });

  it("rejeita fillLevelPercent > 100", () => {
    expect(heartbeatRequestSchema.safeParse({ fillLevelPercent: 101, firmwareVersion: "0.1.0" }).success).toBe(false);
  });

  it("rejeita firmwareVersion vazia", () => {
    expect(heartbeatRequestSchema.safeParse({ fillLevelPercent: 10, firmwareVersion: "" }).success).toBe(false);
  });
});

describe("activeSessionResponseSchema", () => {
  it("aceita active: false", () => {
    expect(activeSessionResponseSchema.safeParse({ active: false }).success).toBe(true);
  });

  it("aceita active: true com todos os campos", () => {
    const ok = activeSessionResponseSchema.safeParse({
      active: true,
      token: "sess_abc",
      userDisplayName: "Daniel",
      status: "awaiting_material",
      expiresAt: "2026-05-19T14:23:45.000Z",
    });
    expect(ok.success).toBe(true);
  });

  it("rejeita active: true sem token", () => {
    const fail = activeSessionResponseSchema.safeParse({
      active: true,
      userDisplayName: "Daniel",
      status: "awaiting_material",
      expiresAt: "2026-05-19T14:23:45.000Z",
    });
    expect(fail.success).toBe(false);
  });
});

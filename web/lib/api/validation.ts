import { z } from "zod";

// ============================================================================
// ESP32 → Backend
// ============================================================================

export const classifyRequestSchema = z.object({
  material: z.enum(["plastic", "metal", "glass", "paper"]),
  confidence: z.number().min(0).max(1),
});

export type ClassifyRequest = z.infer<typeof classifyRequestSchema>;

export const heartbeatRequestSchema = z.object({
  fillLevelPercent: z.number().int().min(0).max(100),
  firmwareVersion: z.string().min(1).max(64),
});

export type HeartbeatRequest = z.infer<typeof heartbeatRequestSchema>;

// ============================================================================
// Backend → Cliente (response shapes — útil para tipagem do front)
// ============================================================================

export const activeSessionResponseSchema = z.discriminatedUnion("active", [
  z.object({ active: z.literal(false) }),
  z.object({
    active: z.literal(true),
    token: z.string(),
    userDisplayName: z.string(),
    status: z.enum(["awaiting_material", "material_detected"]),
    expiresAt: z.string(),
  }),
]);

export type ActiveSessionResponse = z.infer<typeof activeSessionResponseSchema>;

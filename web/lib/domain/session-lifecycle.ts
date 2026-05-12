export type SessionStatus =
  | "awaiting_material"
  | "material_detected"
  | "completed"
  | "expired"
  | "failed";

const ALLOWED_TRANSITIONS: Record<SessionStatus, ReadonlyArray<SessionStatus>> = {
  awaiting_material: ["material_detected", "expired", "failed"],
  material_detected: ["completed", "expired", "failed"],
  completed: [],
  expired: [],
  failed: [],
};

export function canTransition(
  current: SessionStatus,
  next: SessionStatus,
): boolean {
  return ALLOWED_TRANSITIONS[current].includes(next);
}

export function assertTransition(
  current: SessionStatus,
  next: SessionStatus,
): void {
  if (!canTransition(current, next)) {
    throw new SessionTransitionError(current, next);
  }
}

export class SessionTransitionError extends Error {
  constructor(
    public readonly from: SessionStatus,
    public readonly to: SessionStatus,
  ) {
    super(`Transição inválida de '${from}' para '${to}'`);
    this.name = "SessionTransitionError";
  }
}

export const SESSION_TTL_SECONDS = 60;

export function generateSessionToken(): string {
  // 18 bytes de entropia em base64url — colisão praticamente impossível.
  // Crypto API nativa do Node 20+ (também disponível no Edge runtime).
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return `sess_${Buffer.from(bytes).toString("base64url")}`;
}

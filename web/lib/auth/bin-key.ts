import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 10;

export async function hashBinKey(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyBinKey(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/**
 * Gera uma bin key em formato `bink_<32_chars_base64url>`.
 * Mostrar ao usuario apenas uma vez no cadastro do bin — depois persistir apenas o hash.
 */
export function generateBinKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `bink_${Buffer.from(bytes).toString("base64url")}`;
}

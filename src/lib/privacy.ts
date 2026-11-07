// Defense in depth only: no pattern can recognize every possible secret.
export function containsLikelySecret(text: string) {
  return /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bsb_secret_[\w-]+|\b(?:sk[-_]|ollama_)[a-z0-9_-]{20,}|\bBearer\s+[a-z0-9._~-]{20,}/i.test(text)
}

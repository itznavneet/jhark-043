import { semanticEmbeddingDimensions } from "../types/matching.js";

const ignoredWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

export function createDevelopmentEmbedding(text: string): number[] {
  const tokens = (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(
    (token) => token.length > 1 && !ignoredWords.has(token),
  );
  const vector = Array.from({ length: semanticEmbeddingDimensions }, () => 0);

  tokens.forEach((token, index) => {
    vector[hashToken(token)] += 1;
    const next = tokens[index + 1];
    if (next) vector[hashToken(`${token}:${next}`)] += 0.5;
  });

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (norm === 0) {
    vector[0] = 1;
    return vector;
  }
  return vector.map((value) => value / norm);
}

function hashToken(token: string): number {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % semanticEmbeddingDimensions;
}

export function toVectorLiteral(vector: number[]): string {
  if (
    vector.length !== semanticEmbeddingDimensions ||
    vector.some((value) => !Number.isFinite(value))
  ) {
    throw new Error(
      `Embedding must contain ${semanticEmbeddingDimensions} finite dimensions`,
    );
  }
  return `[${vector.join(",")}]`;
}

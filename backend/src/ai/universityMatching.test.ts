import { describe, expect, it } from "vitest";
import { DevelopmentEmbeddingProvider } from "./developmentEmbedding.provider.js";
import { DevelopmentUniversityRankingProvider } from "./developmentUniversityRanking.provider.js";
import { parseUniversityRankingOutput } from "./universityRanking.schema.js";
import type { UniversityCandidate } from "../types/matching.js";

describe("university matching AI contracts", () => {
  it("creates deterministic development embeddings with the expected dimension", async () => {
    const provider = new DevelopmentEmbeddingProvider();
    const first = await provider.createEmbedding("rural water quality sensors");
    const second = await provider.createEmbedding(
      "rural water quality sensors",
    );

    expect(first.vector).toEqual(second.vector);
    expect(first.vector).toHaveLength(1536);
    expect(first.vector.some((value) => value !== 0)).toBe(true);
  });

  it("produces grounded development rankings using retrieved evidence IDs", async () => {
    const candidate: UniversityCandidate = {
      universityId: "00000000-0000-4000-8000-000000000016",
      universityName: "Synthetic Rural Engineering University",
      retrievalScore: 0.91,
      evidence: [
        {
          id: "00000000-0000-4000-8000-000000000017",
          universityId: "00000000-0000-4000-8000-000000000016",
          universityName: "Synthetic Rural Engineering University",
          sourceType: "RESEARCH_AREA",
          sourceId: "00000000-0000-4000-8000-000000000018",
          contentText: "Rural water infrastructure and community water systems",
          similarity: 0.91,
          metadata: {},
        },
      ],
    };
    const provider = new DevelopmentUniversityRankingProvider();
    const output = parseUniversityRankingOutput(
      await provider.rank("rural water challenge", [candidate]),
    );

    expect(output.rankings[0]).toMatchObject({
      universityId: candidate.universityId,
      evidenceSourceIds: [candidate.evidence[0].sourceId],
    });
  });

  it("rejects ranking output with an invalid evidence reference", () => {
    expect(() =>
      parseUniversityRankingOutput({
        rankings: [
          {
            universityId: "00000000-0000-4000-8000-000000000016",
            rank: 1,
            matchScore: 0.8,
            justification: "grounded",
            evidenceSourceIds: ["not-a-uuid"],
          },
        ],
      }),
    ).toThrow();
  });
});

import type {
  UniversityCandidate,
  UniversityRankingProvider,
} from "../types/matching.js";

export class DevelopmentUniversityRankingProvider implements UniversityRankingProvider {
  readonly modelName = "development-grounded-heuristic-ranker";

  async rank(_problemText: string, candidates: UniversityCandidate[]) {
    return {
      rankings: candidates.slice(0, 5).map((candidate, index) => ({
        universityId: candidate.universityId,
        rank: index + 1,
        matchScore: Math.min(1, Math.max(0, candidate.retrievalScore)),
        justification: buildGroundedJustification(candidate),
        evidenceSourceIds: candidate.evidence
          .slice(0, 5)
          .map((item) => item.sourceId),
      })),
    };
  }
}

function buildGroundedJustification(candidate: UniversityCandidate): string {
  const evidence = candidate.evidence
    .slice(0, 3)
    .map(
      (item) =>
        `${item.sourceType.replaceAll("_", " ").toLowerCase()}: ${item.contentText.slice(0, 220)}`,
    )
    .join("; ");
  return `Selected from retrieved university evidence (${evidence}).`;
}

import type { UniversityCandidate } from "../types/matching.js";

export const universityRankingPromptVersion = "phase7-university-ranking-v1";

export const universityRankingSystemPrompt = `You rank universities for a government societal innovation portal.

Use only the retrieved candidate evidence provided by the application. Select and rank up to five candidates. Every evidenceSourceIds value must exactly match an evidence sourceId supplied for that university. Do not invent faculty, research areas, laboratories, facilities, projects, scores, or claims. Ground each justification in the selected evidence. The result is advisory and does not approve, assign, or invite a university.`;

export function buildUniversityRankingUserPrompt(
  problemText: string,
  candidates: UniversityCandidate[],
): string {
  return JSON.stringify({
    problem: problemText,
    candidates: candidates.map((candidate) => ({
      universityId: candidate.universityId,
      universityName: candidate.universityName,
      retrievalScore: candidate.retrievalScore,
      evidence: candidate.evidence.map((item) => ({
        sourceId: item.sourceId,
        sourceType: item.sourceType,
        similarity: item.similarity,
        contentText: item.contentText.slice(0, 1500),
      })),
    })),
  });
}

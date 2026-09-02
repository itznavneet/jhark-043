import { describe, expect, it } from "vitest";
import { problemEvidenceSchema } from "./problem.validator.js";

const baseEvidence = {
  type: "DOCUMENT" as const,
  title: "Technical report",
};

describe("problem evidence validation", () => {
  it("accepts evidence backed by a storage key", () => {
    const result = problemEvidenceSchema.safeParse({
      ...baseEvidence,
      storageKey: "problems/example/report.pdf",
    });

    expect(result.success).toBe(true);
  });

  it("accepts evidence backed by an external URL", () => {
    const result = problemEvidenceSchema.safeParse({
      ...baseEvidence,
      externalUrl: "https://example.test/report.pdf",
    });

    expect(result.success).toBe(true);
  });

  it("rejects evidence that specifies both sources", () => {
    const result = problemEvidenceSchema.safeParse({
      ...baseEvidence,
      storageKey: "problems/example/report.pdf",
      externalUrl: "https://example.test/report.pdf",
    });

    expect(result.success).toBe(false);
  });
});

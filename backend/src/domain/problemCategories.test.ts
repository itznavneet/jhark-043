import { describe, expect, it } from "vitest";
import {
  canonicalizeProblemCategory,
  primaryProblemCategories,
} from "./problemCategories.js";

describe("problem category normalization", () => {
  it("exposes the primary Ministry categories", () => {
    expect(primaryProblemCategories).toEqual([
      "Education",
      "Healthcare",
      "Agriculture",
      "Water Management",
      "Sanitation",
      "Environment",
      "Rural Livelihoods",
      "Accessibility",
      "Urban Infrastructure",
      "Public Service Delivery",
    ]);
  });

  it.each([
    ["Water and Sanitation", "Water Management"],
    ["Agriculture and Rural Development", "Agriculture"],
    ["Waste Management and Sanitation", "Sanitation"],
    ["Energy and Healthcare Infrastructure", "Healthcare"],
  ])("maps %s to %s", (category, expected) => {
    expect(canonicalizeProblemCategory(category)).toBe(expected);
  });

  it("uses the complete problem context for a generic category", () => {
    expect(
      canonicalizeProblemCategory(
        "Digital and Embedded Systems",
        "Connected sensors will identify failures in public infrastructure.",
      ),
    ).toBe("Urban Infrastructure");
  });

  it("preserves a genuinely unmatched valid category as a fallback", () => {
    expect(canonicalizeProblemCategory("Coastal Heritage Preservation")).toBe(
      "Coastal Heritage Preservation",
    );
  });
});

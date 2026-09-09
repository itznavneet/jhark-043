export const primaryProblemCategories = [
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
] as const;

export type PrimaryProblemCategory = (typeof primaryProblemCategories)[number];

const categoryRules: Array<{
  category: PrimaryProblemCategory;
  terms: string[];
}> = [
  {
    category: "Education",
    terms: [
      "education",
      "school",
      "student",
      "learning",
      "literacy",
      "library",
      "teacher",
      "college",
    ],
  },
  {
    category: "Healthcare",
    terms: [
      "health",
      "healthcare",
      "hospital",
      "clinic",
      "medical",
      "patient",
      "vaccine",
      "diagnostic",
    ],
  },
  {
    category: "Agriculture",
    terms: [
      "agriculture",
      "farmer",
      "farming",
      "crop",
      "cultivation",
      "irrigation",
      "livestock",
      "horticulture",
    ],
  },
  {
    category: "Water Management",
    terms: [
      "water",
      "drinking water",
      "groundwater",
      "borewell",
      "hand pump",
      "water supply",
      "water quality",
    ],
  },
  {
    category: "Sanitation",
    terms: [
      "sanitation",
      "waste",
      "sewage",
      "sewer",
      "toilet",
      "solid waste",
      "drainage",
    ],
  },
  {
    category: "Environment",
    terms: [
      "environment",
      "climate",
      "pollution",
      "forest",
      "biodiversity",
      "conservation",
      "air quality",
    ],
  },
  {
    category: "Rural Livelihoods",
    terms: [
      "livelihood",
      "rural development",
      "employment",
      "self-help",
      "artisan",
      "income",
      "finance",
      "banking",
    ],
  },
  {
    category: "Accessibility",
    terms: [
      "accessibility",
      "accessible",
      "disability",
      "disabled",
      "assistive",
      "inclusion",
      "mobility",
      "barrier-free",
    ],
  },
  {
    category: "Urban Infrastructure",
    terms: [
      "urban",
      "infrastructure",
      "road",
      "transport",
      "street",
      "electricity",
      "power supply",
      "housing",
    ],
  },
  {
    category: "Public Service Delivery",
    terms: [
      "public service",
      "governance",
      "civic",
      "municipal",
      "citizen service",
      "administration",
      "government service",
    ],
  },
];

export function canonicalizeProblemCategory(
  category: string | null | undefined,
  context = "",
): string {
  const categoryText = normalize(category);
  const contextText = normalize(context);

  for (const rule of categoryRules) {
    if (rule.terms.some((term) => categoryText.includes(term))) {
      return rule.category;
    }
  }

  let best: { category: PrimaryProblemCategory; score: number } | null = null;
  for (const rule of categoryRules) {
    const score = rule.terms.reduce(
      (total, term) => total + (contextText.includes(term) ? 1 : 0),
      0,
    );
    if (score > (best?.score ?? 0)) best = { category: rule.category, score };
  }

  return best?.category ?? cleanCategory(category);
}

function normalize(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function cleanCategory(value: string | null | undefined): string {
  return value?.trim().replace(/\s+/g, " ") || "Uncategorized";
}

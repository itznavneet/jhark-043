import type {
  FundingStatus,
  FundingType,
  IndustrySupportType,
} from "@prisma/client";

export interface IndustryProposalQueryInput {
  domain?: string;
  technology?: string;
  universityId?: string;
  requiredExpertise?: string;
  minBudget?: number;
  maxBudget?: number;
  supportType?: IndustrySupportType;
}

export interface ExpressIndustryInterestInput {
  message?: string;
  supportType: IndustrySupportType;
}

export interface AcceptIndustryInterestInput {
  supportType: IndustrySupportType;
  supportSummary?: string;
  funding?: {
    fundingType: FundingType;
    amount?: number;
    currencyCode?: string;
    conditionsNotes?: string;
    status: FundingStatus;
  };
}

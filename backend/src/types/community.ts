import type { ProblemStatus } from "@prisma/client";

export interface CommunityProblemView {
  id: string;
  title: string;
  description: string;
  category: { id: string; name: string } | null;
  location: string | null;
  district: string | null;
  currentStatus: ProblemStatus;
  upvoteCount: number;
  hasUpvoted: boolean;
  isOwnProblem: boolean;
  submittedAt: string;
}

export interface CommunityProblemListView {
  problems: CommunityProblemView[];
  upvoteThreshold: number;
}

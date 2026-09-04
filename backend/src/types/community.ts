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
  downvoteCount?: number;
  hasUpvoted: boolean;
  userVote: "UPVOTE" | "DOWNVOTE" | null;
  isOwnProblem: boolean;
  submittedAt: string;
}

export interface CommunityProblemListView {
  problems: CommunityProblemView[];
  upvoteThreshold: number;
}

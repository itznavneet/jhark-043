import {
  CommunityRepository,
  type CommunityProblemRecord,
} from "../repositories/community.repository.js";
import type {
  CommunityProblemListView,
  CommunityProblemView,
} from "../types/community.js";

export class CommunityService {
  constructor(
    private readonly repository = new CommunityRepository(),
    private readonly upvoteThreshold = 3,
  ) {}

  async listProblems(userId: string): Promise<CommunityProblemListView> {
    const records = await this.repository.listValidatedProblems(userId);
    return {
      problems: records.map((record) => toView(record, userId)),
      upvoteThreshold: this.upvoteThreshold,
    };
  }

  async upvote(
    problemId: string,
    userId: string,
  ): Promise<CommunityProblemView> {
    return toView(
      await this.repository.upvote(problemId, userId, this.upvoteThreshold),
      userId,
    );
  }

  async downvote(
    problemId: string,
    userId: string,
  ): Promise<CommunityProblemView> {
    return toView(
      await this.repository.downvote(problemId, userId, this.upvoteThreshold),
      userId,
    );
  }
}

function toView(
  record: CommunityProblemRecord,
  userId: string,
): CommunityProblemView {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    category: record.category,
    location: record.geography,
    district: record.district,
    currentStatus: record.currentStatus,
    upvoteCount: record._count.upvotes,
    ...(record.submitter.userId === userId
      ? { downvoteCount: record._count.downvotes }
      : {}),
    hasUpvoted: record.upvotes.length > 0,
    userVote: record.upvotes.length
      ? "UPVOTE"
      : record.downvotes.length
        ? "DOWNVOTE"
        : null,
    isOwnProblem: record.submitter.userId === userId,
    submittedAt: record.submittedAt.toISOString(),
  };
}

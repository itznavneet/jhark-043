import { Prisma, type PrismaClient } from "@prisma/client";
import { database } from "../config/database.js";
import type {
  AnalyticsBucket,
  IndustryAnalyticsRow,
  MinistryOverviewMetrics,
  TimeSeriesPoint,
  UniversityAnalyticsRow,
} from "../types/analytics.js";

export class AnalyticsRepository {
  constructor(private readonly client: PrismaClient = database) {}

  async getOverview(): Promise<MinistryOverviewMetrics> {
    const [row] = await this.client.$queryRaw<
      Array<{
        totalProblems: bigint;
        totalUniversities: bigint;
        totalIndustries: bigint;
        totalSubmitters: bigint;
        problemsAwaitingReview: bigint;
        problemsAwaitingUniversityAcceptance: bigint;
        acceptedUniversityProjects: bigint;
        proposalsSubmitted: bigint;
        industryCollaborations: bigint;
        activeProjects: bigint;
        completedProjects: bigint;
      }>
    >(Prisma.sql`
      SELECT
        (SELECT COUNT(*) FROM "Problem") AS "totalProblems",
        (SELECT COUNT(*) FROM "University") AS "totalUniversities",
        (SELECT COUNT(*) FROM "Industry") AS "totalIndustries",
        (SELECT COUNT(*) FROM "User" WHERE "role" = 'SUBMITTER') AS "totalSubmitters",
        (SELECT COUNT(*) FROM "Problem" WHERE "currentStatus" = 'MINISTRY_REVIEW') AS "problemsAwaitingReview",
        (SELECT COUNT(*) FROM "Problem" WHERE "currentStatus" = 'INVITATIONS_SENT') AS "problemsAwaitingUniversityAcceptance",
        (SELECT COUNT(*) FROM "UniversityProblemAssignment" WHERE "status" = 'ACCEPTED') AS "acceptedUniversityProjects",
        (SELECT COUNT(*) FROM "Proposal" WHERE "submittedAt" IS NOT NULL) AS "proposalsSubmitted",
        (SELECT COUNT(*) FROM "IndustryCollaboration" WHERE "status" IN ('PROPOSED', 'ACCEPTED', 'CONFIRMED')) AS "industryCollaborations",
        (SELECT COUNT(*) FROM "Project" WHERE "status" NOT IN ('COMPLETED', 'CANCELLED')) AS "activeProjects",
        (SELECT COUNT(*) FROM "Project" WHERE "status" = 'COMPLETED') AS "completedProjects"
    `);
    return mapOverview(row);
  }

  getProblemsByStatus(): Promise<AnalyticsBucket[]> {
    return this.client
      .$queryRaw<Array<{ label: string; value: bigint }>>(
        Prisma.sql`
        SELECT "currentStatus"::text AS label, COUNT(*) AS value
        FROM "Problem"
        GROUP BY "currentStatus"
        ORDER BY value DESC, label ASC
      `,
      )
      .then(mapBuckets);
  }

  getProblemsByCategory(): Promise<AnalyticsBucket[]> {
    return this.client
      .$queryRaw<Array<{ label: string; value: bigint }>>(
        Prisma.sql`
        WITH eligible_problems AS (
          SELECT
            COALESCE(pc."name", '') AS category_name,
            LOWER(CONCAT_WS(' ',
              COALESCE(pc."name", ''),
              p."title",
              p."description",
              COALESCE(p."societalContext", ''),
              COALESCE(p."desiredOutcome", ''),
              COALESCE(p."supportingInformation", '')
            )) AS search_text
          FROM "Problem" p
          LEFT JOIN "ProblemCategory" pc ON pc."id" = p."categoryId"
          WHERE p."currentStatus" NOT IN ('SUBMITTED', 'AI_REJECTED', 'MINISTRY_REJECTED')
        ), classified_problems AS (
          SELECT CASE
            WHEN search_text ~ '(education|school|student|learning|literacy|library|teacher|college)' THEN 'Education'
            WHEN search_text ~ '(health|healthcare|hospital|clinic|medical|patient|vaccine|diagnostic)' THEN 'Healthcare'
            WHEN search_text ~ '(agriculture|farmer|farming|crop|cultivation|irrigation|livestock|horticulture)' THEN 'Agriculture'
            WHEN search_text ~ '(drinking water|groundwater|borewell|hand pump|water supply|water quality|water)' THEN 'Water Management'
            WHEN search_text ~ '(sanitation|waste|sewage|sewer|toilet|solid waste|drainage)' THEN 'Sanitation'
            WHEN search_text ~ '(environment|climate|pollution|forest|biodiversity|conservation|air quality)' THEN 'Environment'
            WHEN search_text ~ '(livelihood|rural development|employment|self-help|artisan|income|finance|banking)' THEN 'Rural Livelihoods'
            WHEN search_text ~ '(accessibility|accessible|disability|disabled|assistive|inclusion|mobility|barrier-free)' THEN 'Accessibility'
            WHEN search_text ~ '(urban|infrastructure|road|transport|street|electricity|power supply|housing)' THEN 'Urban Infrastructure'
            WHEN search_text ~ '(public service|governance|civic|municipal|citizen service|administration|government service)' THEN 'Public Service Delivery'
            ELSE NULLIF(TRIM(category_name), '')
          END AS label
          FROM eligible_problems
        )
        SELECT COALESCE(label, 'Uncategorized') AS label, COUNT(*) AS value
        FROM classified_problems
        GROUP BY COALESCE(label, 'Uncategorized')
        ORDER BY value DESC, label ASC
      `,
      )
      .then(mapBuckets);
  }

  getProblemsByDistrict(): Promise<AnalyticsBucket[]> {
    return this.client
      .$queryRaw<Array<{ label: string; value: bigint }>>(
        Prisma.sql`
        SELECT COALESCE(NULLIF(TRIM("district"), ''), 'Unspecified') AS label,
               COUNT(*) AS value
        FROM "Problem"
        GROUP BY COALESCE(NULLIF(TRIM("district"), ''), 'Unspecified')
        ORDER BY value DESC, label ASC
      `,
      )
      .then(mapBuckets);
  }

  getProblemsOverTime(): Promise<TimeSeriesPoint[]> {
    return this.client
      .$queryRaw<Array<{ period: string; value: bigint }>>(
        Prisma.sql`
        SELECT TO_CHAR(DATE_TRUNC('month', "submittedAt"), 'YYYY-MM') AS period,
               COUNT(*) AS value
        FROM "Problem"
        GROUP BY DATE_TRUNC('month', "submittedAt")
        ORDER BY period ASC
      `,
      )
      .then((rows) =>
        rows.map((row) => ({ ...row, value: Number(row.value) })),
      );
  }

  async getProblemDecisions(): Promise<{
    approved: number;
    rejected: number;
    awaitingDecision: number;
  }> {
    const [row] = await this.client.$queryRaw<
      Array<{ approved: bigint; rejected: bigint; awaitingDecision: bigint }>
    >(Prisma.sql`
      SELECT
        COUNT(*) FILTER (WHERE "currentStatus" = 'MINISTRY_APPROVED') AS approved,
        COUNT(*) FILTER (WHERE "currentStatus" = 'MINISTRY_REJECTED') AS rejected,
        COUNT(*) FILTER (WHERE "currentStatus" IN ('SUBMITTED', 'AI_VALIDATED', 'MINISTRY_REVIEW')) AS "awaitingDecision"
      FROM "Problem"
    `);
    return {
      approved: Number(row.approved),
      rejected: Number(row.rejected),
      awaitingDecision: Number(row.awaitingDecision),
    };
  }

  async getUniversityAcceptance(): Promise<{
    invited: number;
    accepted: number;
    rate: number | null;
  }> {
    const [row] = await this.client.$queryRaw<
      Array<{ invited: bigint; accepted: bigint }>
    >(Prisma.sql`
      SELECT
        COUNT(*) FILTER (WHERE "status" IN ('INVITED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED')) AS invited,
        COUNT(*) FILTER (WHERE "status" = 'ACCEPTED') AS accepted
      FROM "UniversityProblemAssignment"
    `);
    const invited = Number(row.invited);
    const accepted = Number(row.accepted);
    return { invited, accepted, rate: invited ? accepted / invited : null };
  }

  getUniversities(): Promise<UniversityAnalyticsRow[]> {
    return this.client
      .$queryRaw<
        Array<{
          id: string;
          name: string;
          shortName: string | null;
          active: boolean;
          problemsAssigned: bigint;
          problemsAccepted: bigint;
          proposalsSubmitted: bigint;
          projectsActive: bigint;
          projectsCompleted: bigint;
        }>
      >(
        Prisma.sql`
        SELECT
          u."id",
          u."name",
          u."shortName",
          u."isApproved" AS active,
          COUNT(DISTINCT a."problemId") AS "problemsAssigned",
          COUNT(DISTINCT a."problemId") FILTER (WHERE a."status" = 'ACCEPTED') AS "problemsAccepted",
          COUNT(DISTINCT p."id") FILTER (WHERE p."submittedAt" IS NOT NULL) AS "proposalsSubmitted",
          COUNT(DISTINCT pr."id") FILTER (WHERE pr."status" NOT IN ('COMPLETED', 'CANCELLED')) AS "projectsActive",
          COUNT(DISTINCT pr."id") FILTER (WHERE pr."status" = 'COMPLETED') AS "projectsCompleted"
        FROM "University" u
        LEFT JOIN "UniversityProblemAssignment" a ON a."universityId" = u."id"
        LEFT JOIN "Proposal" p ON p."universityId" = u."id"
        LEFT JOIN "Project" pr ON pr."proposalId" = p."id"
        GROUP BY u."id", u."name", u."shortName", u."isApproved"
        ORDER BY u."name" ASC
      `,
      )
      .then((rows) =>
        rows.map((row) => ({
          ...row,
          problemsAssigned: Number(row.problemsAssigned),
          problemsAccepted: Number(row.problemsAccepted),
          proposalsSubmitted: Number(row.proposalsSubmitted),
          projectsActive: Number(row.projectsActive),
          projectsCompleted: Number(row.projectsCompleted),
        })),
      );
  }

  getIndustries(): Promise<IndustryAnalyticsRow[]> {
    return this.client
      .$queryRaw<
        Array<{
          id: string;
          name: string;
          active: boolean;
          proposalsViewed: bigint;
          proposalsInterested: bigint;
          collaborations: bigint;
          fundingRecords: bigint;
        }>
      >(
        Prisma.sql`
        SELECT
          i."id",
          i."name",
          i."isApproved" AS active,
          COUNT(DISTINCT view."proposalId") AS "proposalsViewed",
          COUNT(DISTINCT interest."proposalId") AS "proposalsInterested",
          COUNT(DISTINCT collaboration."id") AS collaborations,
          COUNT(DISTINCT funding."id") AS "fundingRecords"
        FROM "Industry" i
        LEFT JOIN "IndustryProposalView" view ON view."industryId" = i."id"
        LEFT JOIN "IndustryProposalInterest" interest ON interest."industryId" = i."id"
        LEFT JOIN "IndustryCollaboration" collaboration ON collaboration."industryId" = i."id"
        LEFT JOIN "IndustryFunding" funding ON funding."collaborationId" = collaboration."id"
        GROUP BY i."id", i."name", i."isApproved"
        ORDER BY i."name" ASC
      `,
      )
      .then((rows) =>
        rows.map((row) => ({
          ...row,
          proposalsViewed: Number(row.proposalsViewed),
          proposalsInterested: Number(row.proposalsInterested),
          collaborations: Number(row.collaborations),
          fundingRecords: Number(row.fundingRecords),
        })),
      );
  }

  getProjectStages(): Promise<AnalyticsBucket[]> {
    return this.client
      .$queryRaw<Array<{ label: string; value: bigint }>>(
        Prisma.sql`
        SELECT "status"::text AS label, COUNT(*) AS value
        FROM "Project"
        GROUP BY "status"
        ORDER BY value DESC, label ASC
      `,
      )
      .then(mapBuckets);
  }

  async getProjectMetrics(): Promise<{
    active: number;
    delayedMilestones: number;
    completed: number;
    averageProgress: number | null;
  }> {
    const [row] = await this.client.$queryRaw<
      Array<{
        active: bigint;
        delayedMilestones: bigint;
        completed: bigint;
        averageProgress: number | null;
      }>
    >(Prisma.sql`
      SELECT
        (SELECT COUNT(*) FROM "Project" WHERE "status" NOT IN ('COMPLETED', 'CANCELLED')) AS active,
        (SELECT COUNT(*) FROM "ProjectMilestone" WHERE "dueDate" < NOW() AND "status" NOT IN ('COMPLETED', 'CANCELLED')) AS "delayedMilestones",
        (SELECT COUNT(*) FROM "Project" WHERE "status" = 'COMPLETED') AS completed,
        (SELECT AVG("completionPercentage") FROM "ProjectMilestone") AS "averageProgress"
    `);
    return {
      active: Number(row.active),
      delayedMilestones: Number(row.delayedMilestones),
      completed: Number(row.completed),
      averageProgress:
        row.averageProgress === null ? null : Number(row.averageProgress),
    };
  }

  async getImpactMetrics(): Promise<{
    peopleBenefited: number;
    locationsCovered: number;
    completedImplementations: number;
    measuredOutcomes: number;
  }> {
    const [row] = await this.client.$queryRaw<
      Array<{
        peopleBenefited: bigint | null;
        locationsCovered: bigint | null;
        completedImplementations: bigint;
        measuredOutcomes: bigint;
      }>
    >(Prisma.sql`
      SELECT
        COALESCE(SUM("peopleBenefited"), 0) AS "peopleBenefited",
        COALESCE(SUM("locationsCovered"), 0) AS "locationsCovered",
        (SELECT COUNT(*) FROM "Project" WHERE "status" = 'COMPLETED') AS "completedImplementations",
        COUNT(*) FILTER (WHERE "actual" IS NOT NULL OR "measuredAt" IS NOT NULL) AS "measuredOutcomes"
      FROM "ImpactMeasurement"
    `);
    return {
      peopleBenefited: Number(row.peopleBenefited ?? 0),
      locationsCovered: Number(row.locationsCovered ?? 0),
      completedImplementations: Number(row.completedImplementations),
      measuredOutcomes: Number(row.measuredOutcomes),
    };
  }
}

function mapOverview(row: {
  totalProblems: bigint;
  totalUniversities: bigint;
  totalIndustries: bigint;
  totalSubmitters: bigint;
  problemsAwaitingReview: bigint;
  problemsAwaitingUniversityAcceptance: bigint;
  acceptedUniversityProjects: bigint;
  proposalsSubmitted: bigint;
  industryCollaborations: bigint;
  activeProjects: bigint;
  completedProjects: bigint;
}): MinistryOverviewMetrics {
  return {
    totalProblems: Number(row.totalProblems),
    totalUniversities: Number(row.totalUniversities),
    totalIndustries: Number(row.totalIndustries),
    totalSubmitters: Number(row.totalSubmitters),
    problemsAwaitingReview: Number(row.problemsAwaitingReview),
    problemsAwaitingUniversityAcceptance: Number(
      row.problemsAwaitingUniversityAcceptance,
    ),
    acceptedUniversityProjects: Number(row.acceptedUniversityProjects),
    proposalsSubmitted: Number(row.proposalsSubmitted),
    industryCollaborations: Number(row.industryCollaborations),
    activeProjects: Number(row.activeProjects),
    completedProjects: Number(row.completedProjects),
  };
}

function mapBuckets(rows: Array<{ label: string; value: bigint }>) {
  return rows.map((row) => ({ label: row.label, value: Number(row.value) }));
}

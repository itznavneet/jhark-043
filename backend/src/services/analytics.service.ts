import { AnalyticsRepository } from "../repositories/analytics.repository.js";
import type { MinistryAnalytics } from "../types/analytics.js";

export interface AnalyticsServiceContract {
  getMinistryAnalytics(): Promise<MinistryAnalytics>;
}

export class AnalyticsService implements AnalyticsServiceContract {
  constructor(private readonly repository = new AnalyticsRepository()) {}

  async getMinistryAnalytics(): Promise<MinistryAnalytics> {
    const [
      overview,
      byStatus,
      byCategory,
      byDistrict,
      overTime,
      decisions,
      universityAcceptance,
      universities,
      industries,
      projectStages,
      projectMetrics,
      impact,
    ] = await Promise.all([
      this.repository.getOverview(),
      this.repository.getProblemsByStatus(),
      this.repository.getProblemsByCategory(),
      this.repository.getProblemsByDistrict(),
      this.repository.getProblemsOverTime(),
      this.repository.getProblemDecisions(),
      this.repository.getUniversityAcceptance(),
      this.repository.getUniversities(),
      this.repository.getIndustries(),
      this.repository.getProjectStages(),
      this.repository.getProjectMetrics(),
      this.repository.getImpactMetrics(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      overview,
      problems: {
        byStatus,
        byCategory,
        byDistrict,
        overTime,
        decisions,
        universityAcceptance,
      },
      universities: {
        total: universities.length,
        active: universities.filter((item) => item.active).length,
        rows: universities,
      },
      industries: {
        total: industries.length,
        active: industries.filter((item) => item.active).length,
        proposalsViewed: industries.reduce(
          (total, item) => total + item.proposalsViewed,
          0,
        ),
        proposalViewsTracked: true,
        proposalsInterested: industries.reduce(
          (total, item) => total + item.proposalsInterested,
          0,
        ),
        collaborations: industries.reduce(
          (total, item) => total + item.collaborations,
          0,
        ),
        fundingRecords: industries.reduce(
          (total, item) => total + item.fundingRecords,
          0,
        ),
        rows: industries,
      },
      projects: {
        ...projectMetrics,
        byStage: projectStages,
      },
      impact,
    };
  }
}

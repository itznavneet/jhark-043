export interface AnalyticsBucket {
  label: string;
  value: number;
}

export interface TimeSeriesPoint {
  period: string;
  value: number;
}

export interface MinistryOverviewMetrics {
  totalProblems: number;
  totalUniversities: number;
  totalIndustries: number;
  totalSubmitters: number;
  problemsAwaitingReview: number;
  problemsAwaitingUniversityAcceptance: number;
  acceptedUniversityProjects: number;
  proposalsSubmitted: number;
  industryCollaborations: number;
  activeProjects: number;
  completedProjects: number;
}

export interface UniversityAnalyticsRow {
  id: string;
  name: string;
  shortName: string | null;
  active: boolean;
  problemsAssigned: number;
  problemsAccepted: number;
  proposalsSubmitted: number;
  projectsActive: number;
  projectsCompleted: number;
}

export interface IndustryAnalyticsRow {
  id: string;
  name: string;
  active: boolean;
  proposalsViewed: number;
  proposalsInterested: number;
  collaborations: number;
  fundingRecords: number;
}

export interface MinistryAnalytics {
  generatedAt: string;
  overview: MinistryOverviewMetrics;
  problems: {
    byStatus: AnalyticsBucket[];
    byCategory: AnalyticsBucket[];
    byDistrict: AnalyticsBucket[];
    overTime: TimeSeriesPoint[];
    decisions: {
      approved: number;
      rejected: number;
      awaitingDecision: number;
    };
    universityAcceptance: {
      invited: number;
      accepted: number;
      rate: number | null;
    };
  };
  universities: {
    total: number;
    active: number;
    rows: UniversityAnalyticsRow[];
  };
  industries: {
    total: number;
    active: number;
    proposalsViewed: number;
    proposalViewsTracked: boolean;
    proposalsInterested: number;
    collaborations: number;
    fundingRecords: number;
    rows: IndustryAnalyticsRow[];
  };
  projects: {
    active: number;
    byStage: AnalyticsBucket[];
    delayedMilestones: number;
    completed: number;
    averageProgress: number | null;
  };
  impact: {
    peopleBenefited: number;
    locationsCovered: number;
    completedImplementations: number;
    measuredOutcomes: number;
  };
}

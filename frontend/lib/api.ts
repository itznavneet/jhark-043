export interface PublicUser {
  id: string;
  email: string;
  role: string;
  displayName: string;
  mustChangePassword: boolean;
  mustCompleteProfile: boolean;
  profile: {
    type?: string;
    organizationId?: string;
    organizationName?: string;
    name?: string;
  } | null;
}

export interface AuthPayload {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: PublicUser;
}

export type LoginAccountType =
  "SUBMITTER" | "UNIVERSITY" | "INDUSTRY" | "MINISTRY_ADMIN";

export interface RegistrationApplication {
  id: string;
  targetType: "UNIVERSITY" | "INDUSTRY";
  organizationName: string;
  registrationNumber: string | null;
  status: string;
  applicationData: Record<string, unknown>;
  applicantUserId: string;
  applicant: {
    id: string;
    email: string;
    displayName: string;
    role: string;
  };
  reviewedAt: string | null;
  reviewReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemEvidence {
  id?: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
  title: string;
  description?: string;
  fileName?: string;
  storageKey?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  externalUrl?: string;
  createdAt?: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  category: { id: string; name: string; description: string | null } | null;
  location: string | null;
  district: string | null;
  block: string | null;
  villageLocality: string | null;
  latitude: number | null;
  longitude: number | null;
  priority: string | null;
  societalContext?: string | null;
  desiredOutcome?: string | null;
  supportingInformation?: string | null;
  currentStatus: string;
  evidenceCount: number;
  evidence?: ProblemEvidence[];
  timeline?: TimelineEntry[];
  submitter: {
    type: string;
    displayName: string;
    organizationName: string | null;
  };
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityProblem {
  id: string;
  title: string;
  description: string;
  category: { id: string; name: string } | null;
  priority: string | null;
  location: string | null;
  district: string | null;
  submitter: {
    type: string;
    displayName: string;
    organizationName: string | null;
  };
  currentStatus: string;
  upvoteCount: number;
  downvoteCount?: number;
  hasUpvoted: boolean;
  userVote: "UPVOTE" | "DOWNVOTE" | null;
  isOwnProblem: boolean;
  submittedAt: string;
}

export interface CommunityProblemList {
  problems: CommunityProblem[];
  upvoteThreshold: number;
}

export interface TimelineEntry {
  id: string;
  previousStatus: string | null;
  newStatus: string;
  actor: { id: string; displayName: string; role: string } | null;
  reason: string | null;
  createdAt: string;
}

export interface ProblemAnalysis {
  id: string;
  problemId: string;
  processingStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  validationDecision: "VALID" | "INVALID" | "NEEDS_REVIEW" | null;
  isSocietalProblem: boolean | null;
  reason: string | null;
  category: { id: string; name: string } | null;
  summary: string | null;
  keywords: string[];
  requiredExpertise: string[];
  requiredFacilities: string[];
  potentialSolutionAreas: string[];
  priority: string | null;
  confidence: number | null;
  modelName: string | null;
  promptVersion: string | null;
  failureReason: string | null;
  generatedAt: string;
  processedAt: string | null;
}

export interface ProblemAnalysisCollection {
  problemId: string;
  latest: ProblemAnalysis | null;
  attempts: ProblemAnalysis[];
}

export interface MatchEvidence {
  sourceType: string;
  sourceId: string;
  contentText: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

export interface UniversityRecommendation {
  id: string;
  university: { id: string; name: string; shortName: string | null };
  rank: number;
  matchScore: number;
  decision: "RECOMMENDED" | "APPROVED" | "REMOVED";
  justification: string;
  evidence: MatchEvidence[];
  generatedAt: string;
  approvedAt: string | null;
  removedAt: string | null;
}

export interface MatchingResult {
  problemId: string;
  latestRun: {
    id: string;
    problemId: string;
    processingStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
    embeddingModel: string;
    rankingModel: string;
    candidateCount: number;
    failureReason: string | null;
    generatedAt: string;
    processedAt: string | null;
  } | null;
  recommendations: UniversityRecommendation[];
}

export interface AvailableUniversity {
  id: string;
  name: string;
  shortName: string | null;
}

export interface UniversityAssignment {
  id: string;
  status:
    "PENDING" | "INVITED" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "EXPIRED";
  invitedAt: string | null;
  respondedAt: string | null;
  responseNote: string | null;
  projectContextId: string | null;
  problem: {
    id: string;
    title: string;
    description: string;
    currentStatus: string;
    category: { id: string; name: string } | null;
    location: string | null;
    district: string | null;
    block: string | null;
    desiredOutcome: string | null;
  };
  university: { id: string; name: string; shortName: string | null };
}

export interface UniversityTeam {
  id: string;
  name: string;
  description: string | null;
  formedAt: string;
  members: Array<{
    id: string;
    name: string;
    memberType: string;
    roleTitle: string | null;
    department: string | null;
    email: string | null;
  }>;
}

export interface UniversityProposal {
  id: string;
  problemId: string;
  universityId: string;
  teamId: string | null;
  title: string;
  problemUnderstanding: string;
  solutionSummary: string;
  technicalApproach: string | null;
  innovation: string | null;
  expectedOutcomes: string | null;
  requiredResources: string | null;
  estimatedBudget: number | null;
  timeline: string | null;
  prototypePlan: string | null;
  pilotPlan: string | null;
  implementationPlan: string | null;
  expectedSocialImpact: string | null;
  requestedSupport: string | null;
  requestedSupportTypes: IndustrySupportType[];
  industryCollaborations: Array<{
    id: string;
    industry: {
      id: string;
      name: string;
      website: string | null;
      city: string | null;
      state: string | null;
      users: Array<{ displayName: string; email: string }>;
    };
    supportType: IndustrySupportType;
    status: string;
    supportSummary: string | null;
    confirmedAt: string | null;
    createdAt: string;
    fundingRecords: IndustryFunding[];
  }>;
  status: "DRAFT" | "SUBMITTED" | "UNDER_INDUSTRY_REVIEW" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type IndustrySupportType =
  | "FUNDING"
  | "MENTORSHIP"
  | "TECHNICAL_SUPPORT"
  | "INFRASTRUCTURE"
  | "PILOT_SUPPORT"
  | "OTHER";

export interface IndustryProposal {
  id: string;
  title: string;
  problemUnderstanding: string;
  solutionSummary: string;
  technicalApproach: string | null;
  innovation: string | null;
  expectedOutcomes: string | null;
  requiredResources: string | null;
  estimatedBudget: number | null;
  timeline: string | null;
  prototypePlan: string | null;
  pilotPlan: string | null;
  implementationPlan: string | null;
  expectedSocialImpact: string | null;
  requestedSupport: string | null;
  requestedSupportTypes: IndustrySupportType[];
  status: string;
  submittedAt: string | null;
  problem: {
    id: string;
    title: string;
    description: string;
    currentStatus: string;
    category: { id: string; name: string } | null;
  };
  university: {
    id: string;
    name: string;
    shortName: string | null;
    description: string | null;
    city: string | null;
    state: string | null;
  };
  team: {
    id: string;
    name: string;
    description: string | null;
    members: Array<{
      id: string;
      name: string;
      memberType: string;
      roleTitle: string | null;
      department: string | null;
    }>;
  } | null;
}

export interface IndustryInterest {
  id: string;
  proposalId: string;
  industryId: string;
  supportType: IndustrySupportType;
  status: string;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  proposal: IndustryProposal;
  industry: { id: string; name: string };
}

export interface IndustryFunding {
  id: string;
  fundingType: string;
  status: string;
  amount: number | null;
  currencyCode: string | null;
  conditionsNotes: string | null;
  committedAt?: string | null;
  receivedAt?: string | null;
}

export interface IndustryCollaboration {
  id: string;
  proposalId: string;
  industryId: string;
  projectId: string | null;
  supportType: IndustrySupportType;
  status: string;
  supportSummary: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  proposal: IndustryProposal;
  industry: { id: string; name: string };
  project: {
    id: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
  } | null;
  fundingRecords: IndustryFunding[];
}

export interface IndustryProject {
  id: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  proposal: {
    id: string;
    title: string;
    status: string;
    problem: { id: string; title: string; currentStatus: string };
    university: { id: string; name: string; shortName: string | null };
    team: { id: string; name: string } | null;
  };
  collaborations: Array<{
    id: string;
    industryId: string;
    supportType: IndustrySupportType;
    status: string;
    supportSummary: string | null;
    fundingRecords: IndustryFunding[];
  }>;
}

export type ProjectStatus =
  | "COLLABORATION_CONFIRMED"
  | "INITIATED"
  | "PROTOTYPE_DEVELOPMENT"
  | "FIELD_PILOT"
  | "IMPLEMENTATION"
  | "IMPACT_MEASURED"
  | "COMPLETED"
  | "ON_HOLD"
  | "CANCELLED";

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string | null;
  sequence: number;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
  dueDate: string | null;
  completionPercentage: number;
  deliverables: string[];
  completedAt: string | null;
}

export interface ProjectDocument {
  id: string;
  type: string;
  title: string;
  storageKey: string | null;
  externalUrl: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  createdAt: string;
}

export interface ProjectUpdate {
  id: string;
  title: string;
  content: string;
  progressPercentage: number | null;
  createdAt: string;
  milestone: { id: string; title: string } | null;
  documents: ProjectDocument[];
}

export interface ProjectImpactMeasurement {
  id: string;
  metricName: string;
  description: string | null;
  baseline: number | null;
  target: number | null;
  actual: number | null;
  peopleBenefited: number | null;
  locationsCovered: number | null;
  unit: string | null;
  measuredAt: string | null;
  evidence: string | null;
  notes: string | null;
}

export interface ProjectStatusHistory {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  reason: string | null;
  createdAt: string;
  actor: { id: string; displayName: string; role: string } | null;
}

export interface Project {
  id: string;
  status: ProjectStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  proposal: {
    id: string;
    title: string;
    status: string;
    problem: { id: string; title: string; currentStatus: string };
    university: { id: string; name: string; shortName: string | null };
    team: { id: string; name: string } | null;
  };
  industry: { id: string; name: string } | null;
  milestones: ProjectMilestone[];
  updates: ProjectUpdate[];
  documents: ProjectDocument[];
  impactMeasures: ProjectImpactMeasurement[];
  statusHistory: ProjectStatusHistory[];
}

export interface SubmitterProject {
  id: string;
  status: ProjectStatus;
  startedAt: string | null;
  completedAt: string | null;
  problem: { id: string; title: string };
  university: { id: string; name: string; shortName: string | null };
  milestones: Pick<
    ProjectMilestone,
    "id" | "title" | "status" | "completionPercentage" | "dueDate"
  >[];
  updates: Pick<
    ProjectUpdate,
    "id" | "title" | "createdAt" | "progressPercentage"
  >[];
  statusHistory: ProjectStatusHistory[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface AnalyticsBucket {
  label: string;
  value: number;
}

export interface MinistryAnalytics {
  generatedAt: string;
  overview: {
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
  };
  problems: {
    byStatus: AnalyticsBucket[];
    byCategory: AnalyticsBucket[];
    byDistrict: AnalyticsBucket[];
    overTime: Array<{ period: string; value: number }>;
    decisions: { approved: number; rejected: number; awaitingDecision: number };
    universityAcceptance: {
      invited: number;
      accepted: number;
      rate: number | null;
    };
  };
  universities: {
    total: number;
    active: number;
    rows: Array<{
      id: string;
      name: string;
      shortName: string | null;
      active: boolean;
      problemsAssigned: number;
      problemsAccepted: number;
      proposalsSubmitted: number;
      projectsActive: number;
      projectsCompleted: number;
    }>;
  };
  industries: {
    total: number;
    active: number;
    proposalsViewed: number;
    proposalViewsTracked: boolean;
    proposalsInterested: number;
    collaborations: number;
    fundingRecords: number;
    rows: Array<{
      id: string;
      name: string;
      active: boolean;
      proposalsViewed: number;
      proposalsInterested: number;
      collaborations: number;
      fundingRecords: number;
    }>;
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

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
    details?: Array<{ field?: string; message?: string }>;
  };
}

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  const envelope = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    const detail = envelope.error?.details?.[0]?.message;
    throw new ApiError(
      detail ?? envelope.error?.message ?? "Request failed",
      response.status,
    );
  }
  return envelope.data;
}

export async function login(
  email: string,
  password: string,
  accountType: LoginAccountType,
): Promise<AuthPayload> {
  return apiRequest<AuthPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, accountType }),
  });
}

export async function registerSubmitter(input: {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  submitterType: "INDIVIDUAL_CITIZEN" | "PANCHAYATI_RAJ" | "ORGANIZATION";
  organizationName?: string;
  description?: string;
}): Promise<PublicUser> {
  const result = await apiRequest<{ user: PublicUser }>(
    "/auth/register/submitter",
    { method: "POST", body: JSON.stringify(input) },
  );
  return result.user;
}

export async function submitOrganizationApplication(
  input: unknown,
): Promise<RegistrationApplication> {
  return apiRequest<RegistrationApplication>(
    "/registrations/public-applications",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function listRegistrationApplications(
  accessToken: string,
  status = "PENDING",
): Promise<RegistrationApplication[]> {
  return apiRequest<RegistrationApplication[]>(
    `/registrations/applications?status=${encodeURIComponent(status)}`,
    undefined,
    accessToken,
  );
}

export async function approveRegistrationApplication(
  applicationId: string,
  accessToken: string,
): Promise<RegistrationApplication> {
  return apiRequest<RegistrationApplication>(
    `/registrations/applications/${applicationId}/approve`,
    { method: "POST" },
    accessToken,
  );
}

export async function rejectRegistrationApplication(
  applicationId: string,
  reason: string,
  accessToken: string,
): Promise<RegistrationApplication> {
  return apiRequest<RegistrationApplication>(
    `/registrations/applications/${applicationId}/reject`,
    { method: "POST", body: JSON.stringify({ reason }) },
    accessToken,
  );
}

export async function refresh(): Promise<AuthPayload> {
  return apiRequest<AuthPayload>("/auth/refresh", { method: "POST" });
}

export async function logout(): Promise<void> {
  await apiRequest("/auth/logout", { method: "POST" });
}

export async function updateProfile(
  displayName: string,
  accessToken: string,
): Promise<PublicUser> {
  const result = await apiRequest<{ user: PublicUser }>(
    "/auth/me",
    { method: "PATCH", body: JSON.stringify({ displayName }) },
    accessToken,
  );
  return result.user;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  accessToken: string,
): Promise<PublicUser> {
  const result = await apiRequest<{ user: PublicUser }>(
    "/auth/change-password",
    { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) },
    accessToken,
  );
  return result.user;
}

export async function listIndustryProposals(
  query: Record<string, string | number | undefined>,
  accessToken: string,
): Promise<IndustryProposal[]> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<IndustryProposal[]>(
    `/collaboration/industry/proposals${suffix}`,
    undefined,
    accessToken,
  );
}

export async function expressIndustryInterest(
  proposalId: string,
  input: { message?: string; supportType: IndustrySupportType },
  accessToken: string,
): Promise<IndustryInterest> {
  return apiRequest<IndustryInterest>(
    `/collaboration/industry/proposals/${proposalId}/interests`,
    { method: "POST", body: JSON.stringify(input) },
    accessToken,
  );
}

export async function listIndustryInterests(
  accessToken: string,
): Promise<IndustryInterest[]> {
  return apiRequest<IndustryInterest[]>(
    "/collaboration/industry/interests",
    undefined,
    accessToken,
  );
}

export async function acceptIndustryInterest(
  interestId: string,
  input: {
    supportType: IndustrySupportType;
    supportSummary?: string;
    funding?: {
      fundingType?: string;
      amount?: number;
      currencyCode?: string;
      conditionsNotes?: string;
      status?: string;
    };
  },
  accessToken: string,
): Promise<IndustryCollaboration> {
  return apiRequest<IndustryCollaboration>(
    `/collaboration/industry/interests/${interestId}/accept`,
    { method: "POST", body: JSON.stringify(input) },
    accessToken,
  );
}

export async function listIndustryCollaborations(
  accessToken: string,
): Promise<IndustryCollaboration[]> {
  return apiRequest<IndustryCollaboration[]>(
    "/collaboration/industry/collaborations",
    undefined,
    accessToken,
  );
}

export async function listIndustryProjects(
  accessToken: string,
): Promise<IndustryProject[]> {
  return apiRequest<IndustryProject[]>(
    "/collaboration/industry/projects",
    undefined,
    accessToken,
  );
}

export async function listProjects(
  accessToken: string,
): Promise<Array<Project | SubmitterProject>> {
  return apiRequest<Array<Project | SubmitterProject>>(
    "/projects",
    undefined,
    accessToken,
  );
}

export async function getProject(
  projectId: string,
  accessToken: string,
): Promise<Project | SubmitterProject> {
  return apiRequest<Project | SubmitterProject>(
    `/projects/${projectId}`,
    undefined,
    accessToken,
  );
}

export async function transitionProject(
  projectId: string,
  input: { status: ProjectStatus; reason?: string },
  accessToken: string,
): Promise<Project> {
  return apiRequest<Project>(
    `/projects/${projectId}/status`,
    { method: "POST", body: JSON.stringify(input) },
    accessToken,
  );
}

export async function createProjectMilestone(
  projectId: string,
  input: {
    title: string;
    description?: string;
    dueDate?: string;
    status?: ProjectMilestone["status"];
    completionPercentage?: number;
    deliverables?: string[];
  },
  accessToken: string,
): Promise<ProjectMilestone> {
  return apiRequest<ProjectMilestone>(
    `/projects/${projectId}/milestones`,
    { method: "POST", body: JSON.stringify(input) },
    accessToken,
  );
}

export async function createProjectUpdate(
  projectId: string,
  input: {
    title: string;
    description: string;
    progressPercentage?: number;
    milestoneId?: string;
    documents?: Omit<ProjectDocument, "id" | "createdAt" | "fileSizeBytes"> &
      { fileSizeBytes?: number }[];
  },
  accessToken: string,
): Promise<ProjectUpdate> {
  return apiRequest<ProjectUpdate>(
    `/projects/${projectId}/updates`,
    { method: "POST", body: JSON.stringify(input) },
    accessToken,
  );
}

export async function upsertProjectImpact(
  projectId: string,
  input: {
    metricName: string;
    currentValue?: number;
    peopleBenefited?: number;
    locationsCovered?: number;
    unit?: string;
    evidence?: string;
    notes?: string;
  },
  accessToken: string,
): Promise<ProjectImpactMeasurement> {
  return apiRequest<ProjectImpactMeasurement>(
    `/projects/${projectId}/impact`,
    { method: "PUT", body: JSON.stringify(input) },
    accessToken,
  );
}

export async function listNotifications(
  accessToken: string,
  unreadOnly = false,
): Promise<Notification[]> {
  return apiRequest<Notification[]>(
    `/notifications?unreadOnly=${unreadOnly ? "true" : "false"}`,
    undefined,
    accessToken,
  );
}

export async function getUnreadNotificationCount(
  accessToken: string,
): Promise<number> {
  const result = await apiRequest<{ unreadCount: number }>(
    "/notifications/unread-count",
    undefined,
    accessToken,
  );
  return result.unreadCount;
}

export async function markNotificationRead(
  notificationId: string,
  accessToken: string,
): Promise<Notification> {
  return apiRequest<Notification>(
    `/notifications/${notificationId}/read`,
    { method: "PATCH" },
    accessToken,
  );
}

export async function markAllNotificationsRead(
  accessToken: string,
): Promise<{ count: number }> {
  return apiRequest<{ count: number }>(
    "/notifications/read-all",
    { method: "POST" },
    accessToken,
  );
}

export async function getMinistryAnalytics(
  accessToken: string,
): Promise<MinistryAnalytics> {
  return apiRequest<MinistryAnalytics>(
    "/analytics/ministry",
    undefined,
    accessToken,
  );
}

export async function listCommunityProblems(
  accessToken: string,
): Promise<CommunityProblemList> {
  return apiRequest<CommunityProblemList>(
    "/community/problems",
    undefined,
    accessToken,
  );
}

export async function upvoteCommunityProblem(
  problemId: string,
  accessToken: string,
): Promise<CommunityProblem> {
  return apiRequest<CommunityProblem>(
    `/community/problems/${problemId}/upvote`,
    { method: "POST" },
    accessToken,
  );
}

export async function voteCommunityProblem(
  problemId: string,
  vote: "UPVOTE" | "DOWNVOTE",
  accessToken: string,
): Promise<CommunityProblem> {
  return apiRequest<CommunityProblem>(
    `/community/problems/${problemId}/${vote === "UPVOTE" ? "upvote" : "downvote"}`,
    { method: "POST" },
    accessToken,
  );
}

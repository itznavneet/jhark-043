import {
  PrismaClient,
  ProblemStatus,
  SubmitterType,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const seedIds = {
  ministryAdmin: "00000000-0000-4000-8000-000000000001",
  submitterUser: "00000000-0000-4000-8000-000000000002",
  submitterProfile: "00000000-0000-4000-8000-000000000003",
  university: "00000000-0000-4000-8000-000000000004",
  universityUser: "00000000-0000-4000-8000-000000000005",
  industry: "00000000-0000-4000-8000-000000000006",
  industryUser: "00000000-0000-4000-8000-000000000007",
  category: "00000000-0000-4000-8000-000000000008",
  problem: "00000000-0000-4000-8000-000000000009",
  statusHistory: "00000000-0000-4000-8000-000000000010",
  faculty: "00000000-0000-4000-8000-000000000011",
  researchArea: "00000000-0000-4000-8000-000000000012",
  facility: "00000000-0000-4000-8000-000000000013",
  expertise: "00000000-0000-4000-8000-000000000014",
  interestArea: "00000000-0000-4000-8000-000000000015",
  matchingUniversityOne: "00000000-0000-4000-8000-000000000016",
  matchingUniversityTwo: "00000000-0000-4000-8000-000000000017",
  matchingFacultyOne: "00000000-0000-4000-8000-000000000018",
  matchingFacultyTwo: "00000000-0000-4000-8000-000000000019",
  matchingResearchOne: "00000000-0000-4000-8000-000000000020",
  matchingResearchTwo: "00000000-0000-4000-8000-000000000021",
  matchingLabOne: "00000000-0000-4000-8000-000000000022",
  matchingLabTwo: "00000000-0000-4000-8000-000000000023",
  matchingFacilityOne: "00000000-0000-4000-8000-000000000024",
  matchingFacilityTwo: "00000000-0000-4000-8000-000000000025",
  matchingProjectOne: "00000000-0000-4000-8000-000000000026",
  matchingProjectTwo: "00000000-0000-4000-8000-000000000027",
  matchingProblem: "00000000-0000-4000-8000-000000000028",
  matchingProblemSubmittedHistory: "00000000-0000-4000-8000-000000000029",
  matchingProblemReviewHistory: "00000000-0000-4000-8000-000000000030",
  matchingProblemApprovalHistory: "00000000-0000-4000-8000-000000000031",
  collaborationProblem: "00000000-0000-4000-8000-000000000032",
  collaborationSubmittedHistory: "00000000-0000-4000-8000-000000000033",
  collaborationReviewHistory: "00000000-0000-4000-8000-000000000034",
  collaborationApprovalHistory: "00000000-0000-4000-8000-000000000035",
  collaborationMatchedHistory: "00000000-0000-4000-8000-000000000036",
  collaborationRecommendedHistory: "00000000-0000-4000-8000-000000000037",
  collaborationApprovedUniversitiesHistory:
    "00000000-0000-4000-8000-000000000038",
  collaborationInvitedHistory: "00000000-0000-4000-8000-000000000039",
  collaborationMatchOne: "00000000-0000-4000-8000-000000000040",
  collaborationMatchTwo: "00000000-0000-4000-8000-000000000041",
  collaborationAssignmentOne: "00000000-0000-4000-8000-000000000042",
  collaborationAssignmentTwo: "00000000-0000-4000-8000-000000000043",
  analyticsReviewProblem: "00000000-0000-4000-8000-000000000044",
  analyticsRejectedProblem: "00000000-0000-4000-8000-000000000045",
  analyticsCompletedProblem: "00000000-0000-4000-8000-000000000046",
  analyticsCompletedSubmittedHistory: "00000000-0000-4000-8000-000000000047",
  analyticsCompletedReviewHistory: "00000000-0000-4000-8000-000000000048",
  analyticsCompletedApprovalHistory: "00000000-0000-4000-8000-000000000049",
  analyticsCompletedMatchedHistory: "00000000-0000-4000-8000-000000000050",
  analyticsCompletedRecommendedHistory: "00000000-0000-4000-8000-000000000051",
  analyticsCompletedApprovedUniversitiesHistory:
    "00000000-0000-4000-8000-000000000052",
  analyticsCompletedInvitedHistory: "00000000-0000-4000-8000-000000000053",
  analyticsCompletedAcceptedHistory: "00000000-0000-4000-8000-000000000054",
  analyticsCompletedTeamHistory: "00000000-0000-4000-8000-000000000055",
  analyticsCompletedProposalHistory: "00000000-0000-4000-8000-000000000056",
  analyticsCompletedIndustryReviewHistory:
    "00000000-0000-4000-8000-000000000057",
  analyticsCompletedIndustryAcceptedHistory:
    "00000000-0000-4000-8000-000000000058",
  analyticsCompletedCollaborationHistory:
    "00000000-0000-4000-8000-000000000059",
  analyticsCompletedPrototypeHistory: "00000000-0000-4000-8000-000000000060",
  analyticsCompletedPilotHistory: "00000000-0000-4000-8000-000000000061",
  analyticsCompletedImplementationHistory:
    "00000000-0000-4000-8000-000000000062",
  analyticsCompletedImpactHistory: "00000000-0000-4000-8000-000000000063",
  analyticsCompletedHistory: "00000000-0000-4000-8000-000000000064",
  analyticsCompletedMatch: "00000000-0000-4000-8000-000000000065",
  analyticsCompletedAssignment: "00000000-0000-4000-8000-000000000066",
  analyticsCompletedContext: "00000000-0000-4000-8000-000000000067",
  analyticsCompletedTeam: "00000000-0000-4000-8000-000000000068",
  analyticsCompletedTeamMember: "00000000-0000-4000-8000-000000000069",
  analyticsCompletedProposal: "00000000-0000-4000-8000-000000000070",
  analyticsCompletedInterest: "00000000-0000-4000-8000-000000000071",
  analyticsCompletedCollaboration: "00000000-0000-4000-8000-000000000072",
  analyticsCompletedFunding: "00000000-0000-4000-8000-000000000073",
  analyticsCompletedProject: "00000000-0000-4000-8000-000000000074",
  analyticsCompletedMilestone: "00000000-0000-4000-8000-000000000075",
  analyticsCompletedUpdate: "00000000-0000-4000-8000-000000000076",
  analyticsCompletedDocument: "00000000-0000-4000-8000-000000000077",
  analyticsCompletedImpact: "00000000-0000-4000-8000-000000000078",
  analyticsCompletedProjectHistory: "00000000-0000-4000-8000-000000000079",
  analyticsActiveProblem: "00000000-0000-4000-8000-000000000082",
  analyticsActiveProblemHistory: "00000000-0000-4000-8000-000000000083",
  analyticsActiveMatch: "00000000-0000-4000-8000-000000000084",
  analyticsActiveAssignment: "00000000-0000-4000-8000-000000000085",
  analyticsActiveContext: "00000000-0000-4000-8000-000000000086",
  analyticsActiveProposal: "00000000-0000-4000-8000-000000000087",
  analyticsActiveInterest: "00000000-0000-4000-8000-000000000088",
  analyticsActiveCollaboration: "00000000-0000-4000-8000-000000000089",
  analyticsActiveProject: "00000000-0000-4000-8000-000000000090",
  analyticsActiveMilestone: "00000000-0000-4000-8000-000000000091",
  analyticsActiveProjectHistory: "00000000-0000-4000-8000-000000000092",
  analyticsCompletedProposalView: "00000000-0000-4000-8000-000000000093",
  analyticsActiveProposalView: "00000000-0000-4000-8000-000000000094",
  analyticsDiscoveryProblem: "00000000-0000-4000-8000-000000000095",
  analyticsDiscoveryProblemHistory: "00000000-0000-4000-8000-000000000096",
  analyticsDiscoveryProposal: "00000000-0000-4000-8000-000000000097",
};

const developmentPassword = "DevOnly-Portal-123!";

async function main() {
  const passwordHash = await bcrypt.hash(developmentPassword, 10);

  const ministryAdmin = await prisma.user.upsert({
    where: { id: seedIds.ministryAdmin },
    update: {
      email: "ministry.admin@example.test",
      passwordHash,
      role: UserRole.MINISTRY_ADMIN,
      displayName: "Demo Ministry Administrator",
      isActive: true,
      mustChangePassword: false,
      mustCompleteProfile: false,
    },
    create: {
      id: seedIds.ministryAdmin,
      email: "ministry.admin@example.test",
      passwordHash,
      role: UserRole.MINISTRY_ADMIN,
      displayName: "Demo Ministry Administrator",
    },
  });

  const submitterUser = await prisma.user.upsert({
    where: { id: seedIds.submitterUser },
    update: {
      email: "citizen.submitter@example.test",
      passwordHash,
      role: UserRole.SUBMITTER,
      displayName: "Demo Citizen Submitter",
      isActive: true,
      mustChangePassword: false,
      mustCompleteProfile: false,
    },
    create: {
      id: seedIds.submitterUser,
      email: "citizen.submitter@example.test",
      passwordHash,
      role: UserRole.SUBMITTER,
      displayName: "Demo Citizen Submitter",
    },
  });

  const submitterProfile = await prisma.submitterProfile.upsert({
    where: { id: seedIds.submitterProfile },
    update: {
      userId: submitterUser.id,
      type: SubmitterType.CITIZEN,
      displayName: "Demo Citizen Submitter",
      organizationName: null,
      description: "Synthetic development submitter profile.",
    },
    create: {
      id: seedIds.submitterProfile,
      userId: submitterUser.id,
      type: SubmitterType.CITIZEN,
      displayName: "Demo Citizen Submitter",
      description: "Synthetic development submitter profile.",
    },
  });

  const category = await prisma.problemCategory.upsert({
    where: { id: seedIds.category },
    update: {
      name: "Community Infrastructure",
      description: "Synthetic category for local infrastructure challenges.",
    },
    create: {
      id: seedIds.category,
      name: "Community Infrastructure",
      description: "Synthetic category for local infrastructure challenges.",
    },
  });

  const university = await prisma.university.upsert({
    where: { id: seedIds.university },
    update: {
      name: "Demo Institute of Applied Innovation",
      shortName: "DIAI",
      registrationNumber: "DEV-UNIVERSITY-001",
      description: "Synthetic university profile for local development.",
      website: "https://university.example.test",
      city: "Ranchi",
      state: "Jharkhand",
      country: "India",
      isApproved: true,
      approvedById: ministryAdmin.id,
      approvedAt: new Date("2026-01-01T00:00:00.000Z"),
      createdById: ministryAdmin.id,
    },
    create: {
      id: seedIds.university,
      name: "Demo Institute of Applied Innovation",
      shortName: "DIAI",
      registrationNumber: "DEV-UNIVERSITY-001",
      description: "Synthetic university profile for local development.",
      website: "https://university.example.test",
      city: "Ranchi",
      state: "Jharkhand",
      country: "India",
      isApproved: true,
      approvedById: ministryAdmin.id,
      approvedAt: new Date("2026-01-01T00:00:00.000Z"),
      createdById: ministryAdmin.id,
    },
  });

  const universityUser = await prisma.user.upsert({
    where: { id: seedIds.universityUser },
    update: {
      email: "university.contact@example.test",
      passwordHash,
      role: UserRole.UNIVERSITY,
      displayName: "Demo University Contact",
      universityId: university.id,
      isActive: true,
      mustChangePassword: false,
      mustCompleteProfile: false,
    },
    create: {
      id: seedIds.universityUser,
      email: "university.contact@example.test",
      passwordHash,
      role: UserRole.UNIVERSITY,
      displayName: "Demo University Contact",
      universityId: university.id,
    },
  });

  await prisma.universityFaculty.upsert({
    where: { id: seedIds.faculty },
    update: {
      universityId: university.id,
      name: "Demo Faculty Mentor",
      title: "Associate Professor",
      department: "Sustainable Systems",
      profile: "Synthetic faculty profile for local development.",
      researchFocus: "Community infrastructure and applied sensing.",
    },
    create: {
      id: seedIds.faculty,
      universityId: university.id,
      name: "Demo Faculty Mentor",
      title: "Associate Professor",
      department: "Sustainable Systems",
      profile: "Synthetic faculty profile for local development.",
      researchFocus: "Community infrastructure and applied sensing.",
    },
  });

  await prisma.universityResearchArea.upsert({
    where: { id: seedIds.researchArea },
    update: {
      universityId: university.id,
      name: "Rural Water Systems",
      description: "Synthetic research area for development matching examples.",
    },
    create: {
      id: seedIds.researchArea,
      universityId: university.id,
      name: "Rural Water Systems",
      description: "Synthetic research area for development matching examples.",
    },
  });

  await prisma.universityFacility.upsert({
    where: { id: seedIds.facility },
    update: {
      universityId: university.id,
      name: "Demo Field Testing Facility",
      type: "FIELD_SITE",
      description: "Synthetic facility for local development.",
      capabilities: ["sensor testing", "community pilots"],
    },
    create: {
      id: seedIds.facility,
      universityId: university.id,
      name: "Demo Field Testing Facility",
      type: "FIELD_SITE",
      description: "Synthetic facility for local development.",
      capabilities: ["sensor testing", "community pilots"],
    },
  });

  const industry = await prisma.industry.upsert({
    where: { id: seedIds.industry },
    update: {
      name: "Demo Social Technology Works",
      registrationNumber: "DEV-INDUSTRY-001",
      description: "Synthetic industry profile for local development.",
      website: "https://industry.example.test",
      sector: "Social technology",
      city: "Ranchi",
      state: "Jharkhand",
      country: "India",
      isApproved: true,
      approvedById: ministryAdmin.id,
      approvedAt: new Date("2026-01-01T00:00:00.000Z"),
      createdById: ministryAdmin.id,
    },
    create: {
      id: seedIds.industry,
      name: "Demo Social Technology Works",
      registrationNumber: "DEV-INDUSTRY-001",
      description: "Synthetic industry profile for local development.",
      website: "https://industry.example.test",
      sector: "Social technology",
      city: "Ranchi",
      state: "Jharkhand",
      country: "India",
      isApproved: true,
      approvedById: ministryAdmin.id,
      approvedAt: new Date("2026-01-01T00:00:00.000Z"),
      createdById: ministryAdmin.id,
    },
  });

  const industryUser = await prisma.user.upsert({
    where: { id: seedIds.industryUser },
    update: {
      email: "industry.contact@example.test",
      passwordHash,
      role: UserRole.INDUSTRY,
      displayName: "Demo Industry Contact",
      industryId: industry.id,
      isActive: true,
      mustChangePassword: false,
      mustCompleteProfile: false,
    },
    create: {
      id: seedIds.industryUser,
      email: "industry.contact@example.test",
      passwordHash,
      role: UserRole.INDUSTRY,
      displayName: "Demo Industry Contact",
      industryId: industry.id,
    },
  });

  await prisma.industryExpertise.upsert({
    where: { id: seedIds.expertise },
    update: {
      industryId: industry.id,
      name: "Community deployment",
      description: "Synthetic expertise for local development.",
    },
    create: {
      id: seedIds.expertise,
      industryId: industry.id,
      name: "Community deployment",
      description: "Synthetic expertise for local development.",
    },
  });

  await prisma.industryInterestArea.upsert({
    where: { id: seedIds.interestArea },
    update: {
      industryId: industry.id,
      name: "Water access",
    },
    create: {
      id: seedIds.interestArea,
      industryId: industry.id,
      name: "Water access",
    },
  });

  const matchingUniversities = [
    {
      id: seedIds.matchingUniversityOne,
      name: "Demo Institute of Rural Engineering",
      shortName: "DIRE",
      registrationNumber: "DEV-UNIVERSITY-002",
      description:
        "Synthetic university focused on water systems and rural engineering.",
      faculty: {
        id: seedIds.matchingFacultyOne,
        name: "Dr. Asha Rao",
        title: "Professor",
        department: "Civil and Environmental Engineering",
        researchFocus:
          "Rural water infrastructure, groundwater monitoring, and low-cost sensors.",
      },
      researchArea: {
        id: seedIds.matchingResearchOne,
        name: "Rural Water Infrastructure",
        description:
          "Community water points, groundwater quality, and resilient village infrastructure.",
      },
      lab: {
        id: seedIds.matchingLabOne,
        name: "Water Quality and Sensing Lab",
        description:
          "Synthetic laboratory for field-ready water monitoring prototypes.",
        capabilities: [
          "water quality testing",
          "IoT sensors",
          "field validation",
        ],
      },
      facility: {
        id: seedIds.matchingFacilityOne,
        name: "Rural Field Demonstration Site",
        type: "FIELD_SITE" as const,
        description: "Synthetic village test site for community water pilots.",
        capabilities: ["community pilots", "sensor deployment", "field trials"],
      },
      project: {
        id: seedIds.matchingProjectOne,
        title: "Community Water Point Monitoring",
        summary:
          "Synthetic project using low-cost sensing to identify water point failures.",
        domains: ["water access", "rural infrastructure", "IoT"],
        outcomes: "Improved maintenance response for village water points.",
      },
    },
    {
      id: seedIds.matchingUniversityTwo,
      name: "Demo University of Public Health Technology",
      shortName: "DUPHT",
      registrationNumber: "DEV-UNIVERSITY-003",
      description:
        "Synthetic university focused on public health, sanitation, and community data.",
      faculty: {
        id: seedIds.matchingFacultyTwo,
        name: "Dr. Kabir Sen",
        title: "Associate Professor",
        department: "Public Health and Data Science",
        researchFocus:
          "Community health surveillance, sanitation, and participatory data systems.",
      },
      researchArea: {
        id: seedIds.matchingResearchTwo,
        name: "Community Health and Sanitation",
        description:
          "Public health services, sanitation behavior, and rural health data systems.",
      },
      lab: {
        id: seedIds.matchingLabTwo,
        name: "Community Health Analytics Lab",
        description:
          "Synthetic lab for public health analytics and participatory technology.",
        capabilities: ["health dashboards", "survey design", "community data"],
      },
      facility: {
        id: seedIds.matchingFacilityTwo,
        name: "Public Health Innovation Center",
        type: "INNOVATION_CENTER" as const,
        description:
          "Synthetic center for health and sanitation solution prototyping.",
        capabilities: ["service design", "health pilots", "impact evaluation"],
      },
      project: {
        id: seedIds.matchingProjectTwo,
        title: "Village Sanitation Reporting Network",
        summary:
          "Synthetic project connecting community sanitation reports to local response teams.",
        domains: ["sanitation", "public health", "service delivery"],
        outcomes: "Faster identification of sanitation service gaps.",
      },
    },
  ];

  for (const item of matchingUniversities) {
    const matchingUniversity = await prisma.university.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        shortName: item.shortName,
        registrationNumber: item.registrationNumber,
        description: item.description,
        city: "Ranchi",
        state: "Jharkhand",
        country: "India",
        isApproved: true,
        approvedById: ministryAdmin.id,
        approvedAt: new Date("2026-01-01T00:00:00.000Z"),
        createdById: ministryAdmin.id,
      },
      create: {
        id: item.id,
        name: item.name,
        shortName: item.shortName,
        registrationNumber: item.registrationNumber,
        description: item.description,
        city: "Ranchi",
        state: "Jharkhand",
        country: "India",
        isApproved: true,
        approvedById: ministryAdmin.id,
        approvedAt: new Date("2026-01-01T00:00:00.000Z"),
        createdById: ministryAdmin.id,
      },
    });

    await prisma.universityFaculty.upsert({
      where: { id: item.faculty.id },
      update: { ...item.faculty, universityId: matchingUniversity.id },
      create: { ...item.faculty, universityId: matchingUniversity.id },
    });
    await prisma.universityResearchArea.upsert({
      where: { id: item.researchArea.id },
      update: { ...item.researchArea, universityId: matchingUniversity.id },
      create: { ...item.researchArea, universityId: matchingUniversity.id },
    });
    await prisma.universityLab.upsert({
      where: { id: item.lab.id },
      update: { ...item.lab, universityId: matchingUniversity.id },
      create: { ...item.lab, universityId: matchingUniversity.id },
    });
    await prisma.universityFacility.upsert({
      where: { id: item.facility.id },
      update: { ...item.facility, universityId: matchingUniversity.id },
      create: { ...item.facility, universityId: matchingUniversity.id },
    });
    await prisma.universityPreviousProject.upsert({
      where: { id: item.project.id },
      update: { ...item.project, universityId: matchingUniversity.id },
      create: { ...item.project, universityId: matchingUniversity.id },
    });
  }

  const problem = await prisma.problem.upsert({
    where: { id: seedIds.problem },
    update: {
      submitterId: submitterProfile.id,
      categoryId: category.id,
      title: "Demo community water access challenge",
      description:
        "Synthetic societal challenge for local database development.",
      societalContext: "Synthetic development context only.",
      geography: "Demo Block, Jharkhand",
      desiredOutcome: "Improve reliable access to community water points.",
      currentStatus: ProblemStatus.SUBMITTED,
    },
    create: {
      id: seedIds.problem,
      submitterId: submitterProfile.id,
      categoryId: category.id,
      title: "Demo community water access challenge",
      description:
        "Synthetic societal challenge for local database development.",
      societalContext: "Synthetic development context only.",
      geography: "Demo Block, Jharkhand",
      desiredOutcome: "Improve reliable access to community water points.",
      currentStatus: ProblemStatus.SUBMITTED,
    },
  });

  await prisma.problemStatusHistory.upsert({
    where: { id: seedIds.statusHistory },
    update: {
      problemId: problem.id,
      actorUserId: submitterUser.id,
      oldStatus: null,
      newStatus: ProblemStatus.SUBMITTED,
      reason: "Initial synthetic development submission.",
      metadata: { source: "development-seed" },
    },
    create: {
      id: seedIds.statusHistory,
      problemId: problem.id,
      actorUserId: submitterUser.id,
      newStatus: ProblemStatus.SUBMITTED,
      reason: "Initial synthetic development submission.",
      metadata: { source: "development-seed" },
    },
  });

  const matchingProblem = await prisma.problem.upsert({
    where: { id: seedIds.matchingProblem },
    update: {
      submitterId: submitterProfile.id,
      categoryId: category.id,
      title: "Demo rural water quality monitoring challenge",
      description:
        "Synthetic approved challenge: villages need an affordable way to monitor drinking water quality and identify unsafe community water points.",
      societalContext:
        "Synthetic development problem affecting multiple rural communities.",
      geography: "Demo District, Jharkhand",
      district: "Demo District",
      block: "Demo Block",
      villageLocality: "Demo Village Cluster",
      desiredOutcome:
        "Enable timely water quality alerts and maintenance decisions for community water points.",
      currentStatus: ProblemStatus.MINISTRY_APPROVED,
    },
    create: {
      id: seedIds.matchingProblem,
      submitterId: submitterProfile.id,
      categoryId: category.id,
      title: "Demo rural water quality monitoring challenge",
      description:
        "Synthetic approved challenge: villages need an affordable way to monitor drinking water quality and identify unsafe community water points.",
      societalContext:
        "Synthetic development problem affecting multiple rural communities.",
      geography: "Demo District, Jharkhand",
      district: "Demo District",
      block: "Demo Block",
      villageLocality: "Demo Village Cluster",
      desiredOutcome:
        "Enable timely water quality alerts and maintenance decisions for community water points.",
      currentStatus: ProblemStatus.MINISTRY_APPROVED,
    },
  });

  await prisma.problemStatusHistory.upsert({
    where: { id: seedIds.matchingProblemSubmittedHistory },
    update: {
      problemId: matchingProblem.id,
      actorUserId: submitterUser.id,
      oldStatus: null,
      newStatus: ProblemStatus.SUBMITTED,
      reason: "Initial synthetic matching sample submission.",
    },
    create: {
      id: seedIds.matchingProblemSubmittedHistory,
      problemId: matchingProblem.id,
      actorUserId: submitterUser.id,
      newStatus: ProblemStatus.SUBMITTED,
      reason: "Initial synthetic matching sample submission.",
    },
  });
  await prisma.problemStatusHistory.upsert({
    where: { id: seedIds.matchingProblemReviewHistory },
    update: {
      problemId: matchingProblem.id,
      actorUserId: ministryAdmin.id,
      oldStatus: ProblemStatus.SUBMITTED,
      newStatus: ProblemStatus.MINISTRY_REVIEW,
      reason: "Synthetic Ministry review transition.",
    },
    create: {
      id: seedIds.matchingProblemReviewHistory,
      problemId: matchingProblem.id,
      actorUserId: ministryAdmin.id,
      oldStatus: ProblemStatus.SUBMITTED,
      newStatus: ProblemStatus.MINISTRY_REVIEW,
      reason: "Synthetic Ministry review transition.",
    },
  });
  await prisma.problemStatusHistory.upsert({
    where: { id: seedIds.matchingProblemApprovalHistory },
    update: {
      problemId: matchingProblem.id,
      actorUserId: ministryAdmin.id,
      oldStatus: ProblemStatus.MINISTRY_REVIEW,
      newStatus: ProblemStatus.MINISTRY_APPROVED,
      reason: "Synthetic Ministry approval for matching verification.",
    },
    create: {
      id: seedIds.matchingProblemApprovalHistory,
      problemId: matchingProblem.id,
      actorUserId: ministryAdmin.id,
      oldStatus: ProblemStatus.MINISTRY_REVIEW,
      newStatus: ProblemStatus.MINISTRY_APPROVED,
      reason: "Synthetic Ministry approval for matching verification.",
    },
  });

  const collaborationProblem = await prisma.problem.upsert({
    where: { id: seedIds.collaborationProblem },
    update: {
      submitterId: submitterProfile.id,
      categoryId: category.id,
      title: "Demo village cold-chain access challenge",
      description:
        "Synthetic invited challenge: remote health centres need reliable low-cost cold-chain monitoring for temperature-sensitive medicines.",
      societalContext:
        "Synthetic development problem affecting multiple health centres.",
      geography: "Demo District, Jharkhand",
      district: "Demo District",
      block: "Demo Block",
      villageLocality: "Demo Health Centre Cluster",
      desiredOutcome:
        "Reduce medicine spoilage through reliable monitoring and alerts.",
      currentStatus: ProblemStatus.INVITATIONS_SENT,
    },
    create: {
      id: seedIds.collaborationProblem,
      submitterId: submitterProfile.id,
      categoryId: category.id,
      title: "Demo village cold-chain access challenge",
      description:
        "Synthetic invited challenge: remote health centres need reliable low-cost cold-chain monitoring for temperature-sensitive medicines.",
      societalContext:
        "Synthetic development problem affecting multiple health centres.",
      geography: "Demo District, Jharkhand",
      district: "Demo District",
      block: "Demo Block",
      villageLocality: "Demo Health Centre Cluster",
      desiredOutcome:
        "Reduce medicine spoilage through reliable monitoring and alerts.",
      currentStatus: ProblemStatus.INVITATIONS_SENT,
    },
  });

  const collaborationTransitions = [
    [
      null,
      ProblemStatus.SUBMITTED,
      seedIds.collaborationSubmittedHistory,
      submitterUser.id,
      "Initial synthetic collaboration sample submission.",
    ],
    [
      ProblemStatus.SUBMITTED,
      ProblemStatus.MINISTRY_REVIEW,
      seedIds.collaborationReviewHistory,
      ministryAdmin.id,
      "Synthetic Ministry review transition.",
    ],
    [
      ProblemStatus.MINISTRY_REVIEW,
      ProblemStatus.MINISTRY_APPROVED,
      seedIds.collaborationApprovalHistory,
      ministryAdmin.id,
      "Synthetic Ministry approval transition.",
    ],
    [
      ProblemStatus.MINISTRY_APPROVED,
      ProblemStatus.AI_UNIVERSITY_MATCHED,
      seedIds.collaborationMatchedHistory,
      null,
      "Synthetic AI university matching transition.",
    ],
    [
      ProblemStatus.AI_UNIVERSITY_MATCHED,
      ProblemStatus.UNIVERSITIES_RECOMMENDED,
      seedIds.collaborationRecommendedHistory,
      null,
      "Synthetic university recommendation transition.",
    ],
    [
      ProblemStatus.UNIVERSITIES_RECOMMENDED,
      ProblemStatus.MINISTRY_APPROVED_UNIVERSITIES,
      seedIds.collaborationApprovedUniversitiesHistory,
      ministryAdmin.id,
      "Synthetic Ministry university approval transition.",
    ],
    [
      ProblemStatus.MINISTRY_APPROVED_UNIVERSITIES,
      ProblemStatus.INVITATIONS_SENT,
      seedIds.collaborationInvitedHistory,
      ministryAdmin.id,
      "Synthetic Ministry invitation dispatch.",
    ],
  ] as const;
  for (const [
    oldStatus,
    newStatus,
    id,
    actorUserId,
    reason,
  ] of collaborationTransitions) {
    await prisma.problemStatusHistory.upsert({
      where: { id },
      update: {
        problemId: collaborationProblem.id,
        actorUserId,
        oldStatus,
        newStatus,
        reason,
      },
      create: {
        id,
        problemId: collaborationProblem.id,
        actorUserId,
        oldStatus,
        newStatus,
        reason,
      },
    });
  }

  const collaborationMatches = [
    {
      id: seedIds.collaborationMatchOne,
      universityId: seedIds.matchingUniversityOne,
      rank: 1,
      matchScore: 0.91,
      justification:
        "Synthetic approved recommendation for cold-chain monitoring expertise.",
    },
    {
      id: seedIds.collaborationMatchTwo,
      universityId: seedIds.matchingUniversityTwo,
      rank: 2,
      matchScore: 0.84,
      justification:
        "Synthetic approved recommendation for remote health technology expertise.",
    },
  ];
  for (const match of collaborationMatches) {
    await prisma.problemUniversityMatch.upsert({
      where: { id: match.id },
      update: {
        problemId: collaborationProblem.id,
        universityId: match.universityId,
        matchScore: match.matchScore,
        rank: match.rank,
        decision: "APPROVED",
        justification: match.justification,
        matchingRunId: null,
        evidence: [],
      },
      create: {
        id: match.id,
        problemId: collaborationProblem.id,
        universityId: match.universityId,
        matchScore: match.matchScore,
        rank: match.rank,
        decision: "APPROVED",
        justification: match.justification,
        evidence: [],
      },
    });
  }

  const collaborationAssignments = [
    {
      id: seedIds.collaborationAssignmentOne,
      universityId: seedIds.matchingUniversityOne,
      matchId: seedIds.collaborationMatchOne,
    },
    {
      id: seedIds.collaborationAssignmentTwo,
      universityId: seedIds.matchingUniversityTwo,
      matchId: seedIds.collaborationMatchTwo,
    },
  ];
  for (const assignment of collaborationAssignments) {
    await prisma.universityProblemAssignment.upsert({
      where: { id: assignment.id },
      update: {
        problemId: collaborationProblem.id,
        universityId: assignment.universityId,
        matchId: assignment.matchId,
        status: "INVITED",
        invitedAt: new Date("2026-01-01T00:00:00.000Z"),
        respondedAt: null,
        responseNote: null,
      },
      create: {
        id: assignment.id,
        problemId: collaborationProblem.id,
        universityId: assignment.universityId,
        matchId: assignment.matchId,
        status: "INVITED",
        invitedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    });
  }

  const analyticsReviewProblem = await prisma.problem.upsert({
    where: { id: seedIds.analyticsReviewProblem },
    update: {
      submitterId: submitterProfile.id,
      categoryId: category.id,
      title: "Demo district waste collection review item",
      description: "Synthetic review-stage problem for the Ministry dashboard.",
      district: "Ranchi District",
      currentStatus: ProblemStatus.MINISTRY_REVIEW,
    },
    create: {
      id: seedIds.analyticsReviewProblem,
      submitterId: submitterProfile.id,
      categoryId: category.id,
      title: "Demo district waste collection review item",
      description: "Synthetic review-stage problem for the Ministry dashboard.",
      district: "Ranchi District",
      currentStatus: ProblemStatus.MINISTRY_REVIEW,
    },
  });
  await prisma.problemStatusHistory.upsert({
    where: { id: "00000000-0000-4000-8000-000000000080" },
    update: {
      problemId: analyticsReviewProblem.id,
      actorUserId: ministryAdmin.id,
      oldStatus: ProblemStatus.SUBMITTED,
      newStatus: ProblemStatus.MINISTRY_REVIEW,
      reason: "Synthetic dashboard review item.",
    },
    create: {
      id: "00000000-0000-4000-8000-000000000080",
      problemId: analyticsReviewProblem.id,
      actorUserId: ministryAdmin.id,
      oldStatus: ProblemStatus.SUBMITTED,
      newStatus: ProblemStatus.MINISTRY_REVIEW,
      reason: "Synthetic dashboard review item.",
    },
  });

  const analyticsRejectedProblem = await prisma.problem.upsert({
    where: { id: seedIds.analyticsRejectedProblem },
    update: {
      submitterId: submitterProfile.id,
      categoryId: category.id,
      title: "Demo resolved private request",
      description:
        "Synthetic Ministry-rejected item for dashboard decision metrics.",
      district: "Jamshedpur District",
      currentStatus: ProblemStatus.MINISTRY_REJECTED,
    },
    create: {
      id: seedIds.analyticsRejectedProblem,
      submitterId: submitterProfile.id,
      categoryId: category.id,
      title: "Demo resolved private request",
      description:
        "Synthetic Ministry-rejected item for dashboard decision metrics.",
      district: "Jamshedpur District",
      currentStatus: ProblemStatus.MINISTRY_REJECTED,
    },
  });
  await prisma.problemStatusHistory.upsert({
    where: { id: "00000000-0000-4000-8000-000000000081" },
    update: {
      problemId: analyticsRejectedProblem.id,
      actorUserId: ministryAdmin.id,
      oldStatus: ProblemStatus.MINISTRY_REVIEW,
      newStatus: ProblemStatus.MINISTRY_REJECTED,
      reason: "Synthetic dashboard rejected item.",
    },
    create: {
      id: "00000000-0000-4000-8000-000000000081",
      problemId: analyticsRejectedProblem.id,
      actorUserId: ministryAdmin.id,
      oldStatus: ProblemStatus.MINISTRY_REVIEW,
      newStatus: ProblemStatus.MINISTRY_REJECTED,
      reason: "Synthetic dashboard rejected item.",
    },
  });

  const analyticsCompletedProblem = await prisma.problem.upsert({
    where: { id: seedIds.analyticsCompletedProblem },
    update: {
      submitterId: submitterProfile.id,
      categoryId: category.id,
      title: "Demo completed village health logistics project",
      description:
        "Synthetic completed project for Ministry analytics verification.",
      district: "Hazaribagh District",
      block: "Demo Health Block",
      villageLocality: "Demo Health Villages",
      currentStatus: ProblemStatus.COMPLETED,
    },
    create: {
      id: seedIds.analyticsCompletedProblem,
      submitterId: submitterProfile.id,
      categoryId: category.id,
      title: "Demo completed village health logistics project",
      description:
        "Synthetic completed project for Ministry analytics verification.",
      district: "Hazaribagh District",
      block: "Demo Health Block",
      villageLocality: "Demo Health Villages",
      currentStatus: ProblemStatus.COMPLETED,
    },
  });

  const completedTransitions = [
    [
      null,
      ProblemStatus.SUBMITTED,
      seedIds.analyticsCompletedSubmittedHistory,
      submitterUser.id,
    ],
    [
      ProblemStatus.SUBMITTED,
      ProblemStatus.MINISTRY_REVIEW,
      seedIds.analyticsCompletedReviewHistory,
      ministryAdmin.id,
    ],
    [
      ProblemStatus.MINISTRY_REVIEW,
      ProblemStatus.MINISTRY_APPROVED,
      seedIds.analyticsCompletedApprovalHistory,
      ministryAdmin.id,
    ],
    [
      ProblemStatus.MINISTRY_APPROVED,
      ProblemStatus.AI_UNIVERSITY_MATCHED,
      seedIds.analyticsCompletedMatchedHistory,
      null,
    ],
    [
      ProblemStatus.AI_UNIVERSITY_MATCHED,
      ProblemStatus.UNIVERSITIES_RECOMMENDED,
      seedIds.analyticsCompletedRecommendedHistory,
      null,
    ],
    [
      ProblemStatus.UNIVERSITIES_RECOMMENDED,
      ProblemStatus.MINISTRY_APPROVED_UNIVERSITIES,
      seedIds.analyticsCompletedApprovedUniversitiesHistory,
      ministryAdmin.id,
    ],
    [
      ProblemStatus.MINISTRY_APPROVED_UNIVERSITIES,
      ProblemStatus.INVITATIONS_SENT,
      seedIds.analyticsCompletedInvitedHistory,
      ministryAdmin.id,
    ],
    [
      ProblemStatus.INVITATIONS_SENT,
      ProblemStatus.UNIVERSITY_ACCEPTED,
      seedIds.analyticsCompletedAcceptedHistory,
      null,
    ],
    [
      ProblemStatus.UNIVERSITY_ACCEPTED,
      ProblemStatus.TEAM_FORMED,
      seedIds.analyticsCompletedTeamHistory,
      null,
    ],
    [
      ProblemStatus.TEAM_FORMED,
      ProblemStatus.PROPOSAL_SUBMITTED,
      seedIds.analyticsCompletedProposalHistory,
      null,
    ],
    [
      ProblemStatus.PROPOSAL_SUBMITTED,
      ProblemStatus.INDUSTRY_REVIEW,
      seedIds.analyticsCompletedIndustryReviewHistory,
      industryUser.id,
    ],
    [
      ProblemStatus.INDUSTRY_REVIEW,
      ProblemStatus.INDUSTRY_ACCEPTED,
      seedIds.analyticsCompletedIndustryAcceptedHistory,
      industryUser.id,
    ],
    [
      ProblemStatus.INDUSTRY_ACCEPTED,
      ProblemStatus.COLLABORATION_CONFIRMED,
      seedIds.analyticsCompletedCollaborationHistory,
      industryUser.id,
    ],
    [
      ProblemStatus.COLLABORATION_CONFIRMED,
      ProblemStatus.PROTOTYPE_DEVELOPMENT,
      seedIds.analyticsCompletedPrototypeHistory,
      universityUser.id,
    ],
    [
      ProblemStatus.PROTOTYPE_DEVELOPMENT,
      ProblemStatus.FIELD_PILOT,
      seedIds.analyticsCompletedPilotHistory,
      universityUser.id,
    ],
    [
      ProblemStatus.FIELD_PILOT,
      ProblemStatus.IMPLEMENTATION,
      seedIds.analyticsCompletedImplementationHistory,
      universityUser.id,
    ],
    [
      ProblemStatus.IMPLEMENTATION,
      ProblemStatus.IMPACT_MEASURED,
      seedIds.analyticsCompletedImpactHistory,
      universityUser.id,
    ],
    [
      ProblemStatus.IMPACT_MEASURED,
      ProblemStatus.COMPLETED,
      seedIds.analyticsCompletedHistory,
      universityUser.id,
    ],
  ] as const;
  for (const [oldStatus, newStatus, id, actorUserId] of completedTransitions) {
    await prisma.problemStatusHistory.upsert({
      where: { id },
      update: {
        problemId: analyticsCompletedProblem.id,
        actorUserId,
        oldStatus,
        newStatus,
        reason: "Synthetic completed project lifecycle.",
      },
      create: {
        id,
        problemId: analyticsCompletedProblem.id,
        actorUserId,
        oldStatus,
        newStatus,
        reason: "Synthetic completed project lifecycle.",
      },
    });
  }

  await prisma.problemUniversityMatch.upsert({
    where: { id: seedIds.analyticsCompletedMatch },
    update: {
      problemId: analyticsCompletedProblem.id,
      universityId: seedIds.matchingUniversityOne,
      matchScore: 0.94,
      rank: 1,
      decision: "APPROVED",
      justification: "Synthetic dashboard project recommendation.",
    },
    create: {
      id: seedIds.analyticsCompletedMatch,
      problemId: analyticsCompletedProblem.id,
      universityId: seedIds.matchingUniversityOne,
      matchScore: 0.94,
      rank: 1,
      decision: "APPROVED",
      justification: "Synthetic dashboard project recommendation.",
    },
  });
  await prisma.universityProblemAssignment.upsert({
    where: { id: seedIds.analyticsCompletedAssignment },
    update: {
      problemId: analyticsCompletedProblem.id,
      universityId: seedIds.matchingUniversityOne,
      matchId: seedIds.analyticsCompletedMatch,
      status: "ACCEPTED",
      invitedAt: new Date("2026-01-01T00:00:00.000Z"),
      respondedAt: new Date("2026-01-03T00:00:00.000Z"),
    },
    create: {
      id: seedIds.analyticsCompletedAssignment,
      problemId: analyticsCompletedProblem.id,
      universityId: seedIds.matchingUniversityOne,
      matchId: seedIds.analyticsCompletedMatch,
      status: "ACCEPTED",
      invitedAt: new Date("2026-01-01T00:00:00.000Z"),
      respondedAt: new Date("2026-01-03T00:00:00.000Z"),
    },
  });
  await prisma.universityProjectContext.upsert({
    where: { id: seedIds.analyticsCompletedContext },
    update: {
      problemId: analyticsCompletedProblem.id,
      universityId: seedIds.matchingUniversityOne,
      assignmentId: seedIds.analyticsCompletedAssignment,
    },
    create: {
      id: seedIds.analyticsCompletedContext,
      problemId: analyticsCompletedProblem.id,
      universityId: seedIds.matchingUniversityOne,
      assignmentId: seedIds.analyticsCompletedAssignment,
    },
  });
  await prisma.projectTeam.upsert({
    where: { id: seedIds.analyticsCompletedTeam },
    update: {
      problemId: analyticsCompletedProblem.id,
      universityId: seedIds.matchingUniversityOne,
      projectContextId: seedIds.analyticsCompletedContext,
      name: "Synthetic Health Logistics Team",
      description: "Synthetic team for dashboard data.",
    },
    create: {
      id: seedIds.analyticsCompletedTeam,
      problemId: analyticsCompletedProblem.id,
      universityId: seedIds.matchingUniversityOne,
      projectContextId: seedIds.analyticsCompletedContext,
      name: "Synthetic Health Logistics Team",
      description: "Synthetic team for dashboard data.",
    },
  });
  await prisma.teamMember.upsert({
    where: { id: seedIds.analyticsCompletedTeamMember },
    update: {
      teamId: seedIds.analyticsCompletedTeam,
      memberType: "FACULTY_MENTOR",
      name: "Dr. Synthetic Mentor",
      roleTitle: "Faculty mentor",
      department: "Public Health",
    },
    create: {
      id: seedIds.analyticsCompletedTeamMember,
      teamId: seedIds.analyticsCompletedTeam,
      memberType: "FACULTY_MENTOR",
      name: "Dr. Synthetic Mentor",
      roleTitle: "Faculty mentor",
      department: "Public Health",
    },
  });
  await prisma.proposal.upsert({
    where: { id: seedIds.analyticsCompletedProposal },
    update: {
      problemId: analyticsCompletedProblem.id,
      universityId: seedIds.matchingUniversityOne,
      projectContextId: seedIds.analyticsCompletedContext,
      teamId: seedIds.analyticsCompletedTeam,
      title: "Synthetic health logistics proposal",
      problemUnderstanding: "Synthetic understanding of the challenge.",
      solutionSummary:
        "A low-cost community logistics and monitoring solution.",
      technicalApproach: "Synthetic sensor and service workflow.",
      expectedOutcomes: "Better delivery reliability.",
      estimatedBudget: 125000,
      timeline: "12 months",
      requestedSupport: "Funding and pilot support",
      requestedSupportTypes: ["FUNDING", "PILOT_SUPPORT"],
      status: "SUBMITTED",
      submittedAt: new Date("2026-01-10T00:00:00.000Z"),
    },
    create: {
      id: seedIds.analyticsCompletedProposal,
      problemId: analyticsCompletedProblem.id,
      universityId: seedIds.matchingUniversityOne,
      projectContextId: seedIds.analyticsCompletedContext,
      teamId: seedIds.analyticsCompletedTeam,
      title: "Synthetic health logistics proposal",
      problemUnderstanding: "Synthetic understanding of the challenge.",
      solutionSummary:
        "A low-cost community logistics and monitoring solution.",
      technicalApproach: "Synthetic sensor and service workflow.",
      expectedOutcomes: "Better delivery reliability.",
      estimatedBudget: 125000,
      timeline: "12 months",
      requestedSupport: "Funding and pilot support",
      requestedSupportTypes: ["FUNDING", "PILOT_SUPPORT"],
      status: "SUBMITTED",
      submittedAt: new Date("2026-01-10T00:00:00.000Z"),
    },
  });
  await prisma.industryProposalInterest.upsert({
    where: { id: seedIds.analyticsCompletedInterest },
    update: {
      proposalId: seedIds.analyticsCompletedProposal,
      industryId: industry.id,
      supportType: "FUNDING",
      status: "ACCEPTED",
      message: "Synthetic dashboard interest.",
    },
    create: {
      id: seedIds.analyticsCompletedInterest,
      proposalId: seedIds.analyticsCompletedProposal,
      industryId: industry.id,
      supportType: "FUNDING",
      status: "ACCEPTED",
      message: "Synthetic dashboard interest.",
    },
  });
  await prisma.industryCollaboration.upsert({
    where: { id: seedIds.analyticsCompletedCollaboration },
    update: {
      proposalId: seedIds.analyticsCompletedProposal,
      industryId: industry.id,
      projectId: null,
      supportType: "FUNDING",
      status: "CONFIRMED",
      supportSummary: "Synthetic funding support.",
      confirmedAt: new Date("2026-01-15T00:00:00.000Z"),
    },
    create: {
      id: seedIds.analyticsCompletedCollaboration,
      proposalId: seedIds.analyticsCompletedProposal,
      industryId: industry.id,
      projectId: null,
      supportType: "FUNDING",
      status: "CONFIRMED",
      supportSummary: "Synthetic funding support.",
      confirmedAt: new Date("2026-01-15T00:00:00.000Z"),
    },
  });
  await prisma.industryFunding.upsert({
    where: { id: seedIds.analyticsCompletedFunding },
    update: {
      collaborationId: seedIds.analyticsCompletedCollaboration,
      fundingType: "CSR_GRANT",
      status: "RECEIVED",
      amount: 125000,
      currencyCode: "INR",
      description: "Synthetic dashboard funding record",
      committedAt: new Date("2026-01-15T00:00:00.000Z"),
      receivedAt: new Date("2026-02-01T00:00:00.000Z"),
    },
    create: {
      id: seedIds.analyticsCompletedFunding,
      collaborationId: seedIds.analyticsCompletedCollaboration,
      fundingType: "CSR_GRANT",
      status: "RECEIVED",
      amount: 125000,
      currencyCode: "INR",
      description: "Synthetic dashboard funding record",
      committedAt: new Date("2026-01-15T00:00:00.000Z"),
      receivedAt: new Date("2026-02-01T00:00:00.000Z"),
    },
  });
  await prisma.project.upsert({
    where: { id: seedIds.analyticsCompletedProject },
    update: {
      proposalId: seedIds.analyticsCompletedProposal,
      industryId: industry.id,
      status: "COMPLETED",
      startedAt: new Date("2026-01-20T00:00:00.000Z"),
      completedAt: new Date("2026-08-01T00:00:00.000Z"),
    },
    create: {
      id: seedIds.analyticsCompletedProject,
      proposalId: seedIds.analyticsCompletedProposal,
      industryId: industry.id,
      status: "COMPLETED",
      startedAt: new Date("2026-01-20T00:00:00.000Z"),
      completedAt: new Date("2026-08-01T00:00:00.000Z"),
    },
  });
  await prisma.industryCollaboration.update({
    where: { id: seedIds.analyticsCompletedCollaboration },
    data: { projectId: seedIds.analyticsCompletedProject },
  });
  await prisma.projectMilestone.upsert({
    where: { id: seedIds.analyticsCompletedMilestone },
    update: {
      projectId: seedIds.analyticsCompletedProject,
      title: "Synthetic field rollout",
      sequence: 1,
      status: "COMPLETED",
      dueDate: new Date("2026-06-01T00:00:00.000Z"),
      completionPercentage: 100,
      deliverables: ["Pilot report", "Deployment checklist"],
      completedAt: new Date("2026-06-01T00:00:00.000Z"),
    },
    create: {
      id: seedIds.analyticsCompletedMilestone,
      projectId: seedIds.analyticsCompletedProject,
      title: "Synthetic field rollout",
      sequence: 1,
      status: "COMPLETED",
      dueDate: new Date("2026-06-01T00:00:00.000Z"),
      completionPercentage: 100,
      deliverables: ["Pilot report", "Deployment checklist"],
      completedAt: new Date("2026-06-01T00:00:00.000Z"),
    },
  });
  await prisma.projectUpdate.upsert({
    where: { id: seedIds.analyticsCompletedUpdate },
    update: {
      projectId: seedIds.analyticsCompletedProject,
      title: "Synthetic completion update",
      content: "Synthetic project completion evidence.",
      progressPercentage: 100,
      createdAt: new Date("2026-07-15T00:00:00.000Z"),
    },
    create: {
      id: seedIds.analyticsCompletedUpdate,
      projectId: seedIds.analyticsCompletedProject,
      title: "Synthetic completion update",
      content: "Synthetic project completion evidence.",
      progressPercentage: 100,
      createdAt: new Date("2026-07-15T00:00:00.000Z"),
    },
  });
  await prisma.projectDocument.upsert({
    where: { id: seedIds.analyticsCompletedDocument },
    update: {
      projectId: seedIds.analyticsCompletedProject,
      type: "IMPACT_EVIDENCE",
      title: "Synthetic impact evidence",
      externalUrl: "https://example.test/synthetic-impact-evidence",
    },
    create: {
      id: seedIds.analyticsCompletedDocument,
      projectId: seedIds.analyticsCompletedProject,
      type: "IMPACT_EVIDENCE",
      title: "Synthetic impact evidence",
      externalUrl: "https://example.test/synthetic-impact-evidence",
    },
  });
  await prisma.impactMeasurement.upsert({
    where: { id: seedIds.analyticsCompletedImpact },
    update: {
      projectId: seedIds.analyticsCompletedProject,
      metricName: "People reached",
      description: "Synthetic beneficiary metric.",
      actual: 4200,
      peopleBenefited: 4200,
      locationsCovered: 12,
      unit: "people",
      measuredAt: new Date("2026-07-20T00:00:00.000Z"),
      evidence: "Synthetic evaluation record.",
      notes: "Development seed only.",
    },
    create: {
      id: seedIds.analyticsCompletedImpact,
      projectId: seedIds.analyticsCompletedProject,
      metricName: "People reached",
      description: "Synthetic beneficiary metric.",
      actual: 4200,
      peopleBenefited: 4200,
      locationsCovered: 12,
      unit: "people",
      measuredAt: new Date("2026-07-20T00:00:00.000Z"),
      evidence: "Synthetic evaluation record.",
      notes: "Development seed only.",
    },
  });
  await prisma.projectStatusHistory.upsert({
    where: { id: seedIds.analyticsCompletedProjectHistory },
    update: {
      projectId: seedIds.analyticsCompletedProject,
      actorUserId: universityUser.id,
      oldStatus: "IMPACT_MEASURED",
      newStatus: "COMPLETED",
      reason: "Synthetic completed project.",
    },
    create: {
      id: seedIds.analyticsCompletedProjectHistory,
      projectId: seedIds.analyticsCompletedProject,
      actorUserId: universityUser.id,
      oldStatus: "IMPACT_MEASURED",
      newStatus: "COMPLETED",
      reason: "Synthetic completed project.",
    },
  });

  const analyticsActiveProblem = await prisma.problem.upsert({
    where: { id: seedIds.analyticsActiveProblem },
    update: {
      submitterId: submitterProfile.id,
      categoryId: category.id,
      title: "Demo active rural diagnostics project",
      description:
        "Synthetic active project for Ministry analytics verification.",
      district: "Bokaro District",
      currentStatus: ProblemStatus.PROTOTYPE_DEVELOPMENT,
    },
    create: {
      id: seedIds.analyticsActiveProblem,
      submitterId: submitterProfile.id,
      categoryId: category.id,
      title: "Demo active rural diagnostics project",
      description:
        "Synthetic active project for Ministry analytics verification.",
      district: "Bokaro District",
      currentStatus: ProblemStatus.PROTOTYPE_DEVELOPMENT,
    },
  });
  await prisma.problemStatusHistory.upsert({
    where: { id: seedIds.analyticsActiveProblemHistory },
    update: {
      problemId: analyticsActiveProblem.id,
      actorUserId: universityUser.id,
      oldStatus: ProblemStatus.COLLABORATION_CONFIRMED,
      newStatus: ProblemStatus.PROTOTYPE_DEVELOPMENT,
      reason: "Synthetic active project lifecycle.",
    },
    create: {
      id: seedIds.analyticsActiveProblemHistory,
      problemId: analyticsActiveProblem.id,
      actorUserId: universityUser.id,
      oldStatus: ProblemStatus.COLLABORATION_CONFIRMED,
      newStatus: ProblemStatus.PROTOTYPE_DEVELOPMENT,
      reason: "Synthetic active project lifecycle.",
    },
  });
  await prisma.problemUniversityMatch.upsert({
    where: { id: seedIds.analyticsActiveMatch },
    update: {
      problemId: analyticsActiveProblem.id,
      universityId: seedIds.matchingUniversityTwo,
      matchScore: 0.87,
      rank: 1,
      decision: "APPROVED",
      justification: "Synthetic active project recommendation.",
    },
    create: {
      id: seedIds.analyticsActiveMatch,
      problemId: analyticsActiveProblem.id,
      universityId: seedIds.matchingUniversityTwo,
      matchScore: 0.87,
      rank: 1,
      decision: "APPROVED",
      justification: "Synthetic active project recommendation.",
    },
  });
  await prisma.universityProblemAssignment.upsert({
    where: { id: seedIds.analyticsActiveAssignment },
    update: {
      problemId: analyticsActiveProblem.id,
      universityId: seedIds.matchingUniversityTwo,
      matchId: seedIds.analyticsActiveMatch,
      status: "ACCEPTED",
      invitedAt: new Date("2026-02-01T00:00:00.000Z"),
      respondedAt: new Date("2026-02-03T00:00:00.000Z"),
    },
    create: {
      id: seedIds.analyticsActiveAssignment,
      problemId: analyticsActiveProblem.id,
      universityId: seedIds.matchingUniversityTwo,
      matchId: seedIds.analyticsActiveMatch,
      status: "ACCEPTED",
      invitedAt: new Date("2026-02-01T00:00:00.000Z"),
      respondedAt: new Date("2026-02-03T00:00:00.000Z"),
    },
  });
  await prisma.universityProjectContext.upsert({
    where: { id: seedIds.analyticsActiveContext },
    update: {
      problemId: analyticsActiveProblem.id,
      universityId: seedIds.matchingUniversityTwo,
      assignmentId: seedIds.analyticsActiveAssignment,
    },
    create: {
      id: seedIds.analyticsActiveContext,
      problemId: analyticsActiveProblem.id,
      universityId: seedIds.matchingUniversityTwo,
      assignmentId: seedIds.analyticsActiveAssignment,
    },
  });
  await prisma.proposal.upsert({
    where: { id: seedIds.analyticsActiveProposal },
    update: {
      problemId: analyticsActiveProblem.id,
      universityId: seedIds.matchingUniversityTwo,
      projectContextId: seedIds.analyticsActiveContext,
      title: "Synthetic rural diagnostics proposal",
      problemUnderstanding: "Synthetic understanding of the active challenge.",
      solutionSummary:
        "A community diagnostics workflow with low-cost data collection.",
      technicalApproach: "Synthetic mobile reporting and field validation.",
      expectedOutcomes: "Faster rural service response.",
      estimatedBudget: 80000,
      timeline: "9 months",
      requestedSupport: "Technical support",
      requestedSupportTypes: ["TECHNICAL_SUPPORT"],
      status: "SUBMITTED",
      submittedAt: new Date("2026-02-10T00:00:00.000Z"),
    },
    create: {
      id: seedIds.analyticsActiveProposal,
      problemId: analyticsActiveProblem.id,
      universityId: seedIds.matchingUniversityTwo,
      projectContextId: seedIds.analyticsActiveContext,
      title: "Synthetic rural diagnostics proposal",
      problemUnderstanding: "Synthetic understanding of the active challenge.",
      solutionSummary:
        "A community diagnostics workflow with low-cost data collection.",
      technicalApproach: "Synthetic mobile reporting and field validation.",
      expectedOutcomes: "Faster rural service response.",
      estimatedBudget: 80000,
      timeline: "9 months",
      requestedSupport: "Technical support",
      requestedSupportTypes: ["TECHNICAL_SUPPORT"],
      status: "SUBMITTED",
      submittedAt: new Date("2026-02-10T00:00:00.000Z"),
    },
  });
  await prisma.industryProposalInterest.upsert({
    where: { id: seedIds.analyticsActiveInterest },
    update: {
      proposalId: seedIds.analyticsActiveProposal,
      industryId: industry.id,
      supportType: "TECHNICAL_SUPPORT",
      status: "ACCEPTED",
      message: "Synthetic active project interest.",
    },
    create: {
      id: seedIds.analyticsActiveInterest,
      proposalId: seedIds.analyticsActiveProposal,
      industryId: industry.id,
      supportType: "TECHNICAL_SUPPORT",
      status: "ACCEPTED",
      message: "Synthetic active project interest.",
    },
  });
  await prisma.industryCollaboration.upsert({
    where: { id: seedIds.analyticsActiveCollaboration },
    update: {
      proposalId: seedIds.analyticsActiveProposal,
      industryId: industry.id,
      projectId: null,
      supportType: "TECHNICAL_SUPPORT",
      status: "CONFIRMED",
      supportSummary: "Synthetic technical support.",
      confirmedAt: new Date("2026-02-15T00:00:00.000Z"),
    },
    create: {
      id: seedIds.analyticsActiveCollaboration,
      proposalId: seedIds.analyticsActiveProposal,
      industryId: industry.id,
      projectId: null,
      supportType: "TECHNICAL_SUPPORT",
      status: "CONFIRMED",
      supportSummary: "Synthetic technical support.",
      confirmedAt: new Date("2026-02-15T00:00:00.000Z"),
    },
  });
  await prisma.project.upsert({
    where: { id: seedIds.analyticsActiveProject },
    update: {
      proposalId: seedIds.analyticsActiveProposal,
      industryId: industry.id,
      status: "PROTOTYPE_DEVELOPMENT",
      startedAt: new Date("2026-02-20T00:00:00.000Z"),
      completedAt: null,
    },
    create: {
      id: seedIds.analyticsActiveProject,
      proposalId: seedIds.analyticsActiveProposal,
      industryId: industry.id,
      status: "PROTOTYPE_DEVELOPMENT",
      startedAt: new Date("2026-02-20T00:00:00.000Z"),
    },
  });
  await prisma.industryCollaboration.update({
    where: { id: seedIds.analyticsActiveCollaboration },
    data: { projectId: seedIds.analyticsActiveProject },
  });
  await prisma.projectMilestone.upsert({
    where: { id: seedIds.analyticsActiveMilestone },
    update: {
      projectId: seedIds.analyticsActiveProject,
      title: "Synthetic prototype validation",
      sequence: 1,
      status: "IN_PROGRESS",
      dueDate: new Date("2026-12-01T00:00:00.000Z"),
      completionPercentage: 45,
      deliverables: ["Prototype", "Validation notes"],
    },
    create: {
      id: seedIds.analyticsActiveMilestone,
      projectId: seedIds.analyticsActiveProject,
      title: "Synthetic prototype validation",
      sequence: 1,
      status: "IN_PROGRESS",
      dueDate: new Date("2026-12-01T00:00:00.000Z"),
      completionPercentage: 45,
      deliverables: ["Prototype", "Validation notes"],
    },
  });
  await prisma.projectStatusHistory.upsert({
    where: { id: seedIds.analyticsActiveProjectHistory },
    update: {
      projectId: seedIds.analyticsActiveProject,
      actorUserId: universityUser.id,
      oldStatus: "COLLABORATION_CONFIRMED",
      newStatus: "PROTOTYPE_DEVELOPMENT",
      reason: "Synthetic active project.",
    },
    create: {
      id: seedIds.analyticsActiveProjectHistory,
      projectId: seedIds.analyticsActiveProject,
      actorUserId: universityUser.id,
      oldStatus: "COLLABORATION_CONFIRMED",
      newStatus: "PROTOTYPE_DEVELOPMENT",
      reason: "Synthetic active project.",
    },
  });
  await prisma.industryProposalView.upsert({
    where: { id: seedIds.analyticsCompletedProposalView },
    update: {
      proposalId: seedIds.analyticsCompletedProposal,
      industryId: industry.id,
      viewedAt: new Date("2026-01-12T00:00:00.000Z"),
    },
    create: {
      id: seedIds.analyticsCompletedProposalView,
      proposalId: seedIds.analyticsCompletedProposal,
      industryId: industry.id,
      viewedAt: new Date("2026-01-12T00:00:00.000Z"),
    },
  });
  await prisma.industryProposalView.upsert({
    where: { id: seedIds.analyticsActiveProposalView },
    update: {
      proposalId: seedIds.analyticsActiveProposal,
      industryId: industry.id,
      viewedAt: new Date("2026-02-12T00:00:00.000Z"),
    },
    create: {
      id: seedIds.analyticsActiveProposalView,
      proposalId: seedIds.analyticsActiveProposal,
      industryId: industry.id,
      viewedAt: new Date("2026-02-12T00:00:00.000Z"),
    },
  });
  const analyticsDiscoveryProblem = await prisma.problem.upsert({
    where: { id: seedIds.analyticsDiscoveryProblem },
    update: {
      submitterId: submitterProfile.id,
      categoryId: category.id,
      title: "Demo community nutrition information challenge",
      description: "Synthetic submitted proposal discovery item.",
      district: "Deoghar District",
      currentStatus: ProblemStatus.PROPOSAL_SUBMITTED,
    },
    create: {
      id: seedIds.analyticsDiscoveryProblem,
      submitterId: submitterProfile.id,
      categoryId: category.id,
      title: "Demo community nutrition information challenge",
      description: "Synthetic submitted proposal discovery item.",
      district: "Deoghar District",
      currentStatus: ProblemStatus.PROPOSAL_SUBMITTED,
    },
  });
  await prisma.problemStatusHistory.upsert({
    where: { id: seedIds.analyticsDiscoveryProblemHistory },
    update: {
      problemId: analyticsDiscoveryProblem.id,
      actorUserId: universityUser.id,
      oldStatus: ProblemStatus.PROPOSAL_DRAFT,
      newStatus: ProblemStatus.PROPOSAL_SUBMITTED,
      reason: "Synthetic proposal discovery item.",
    },
    create: {
      id: seedIds.analyticsDiscoveryProblemHistory,
      problemId: analyticsDiscoveryProblem.id,
      actorUserId: universityUser.id,
      oldStatus: ProblemStatus.PROPOSAL_DRAFT,
      newStatus: ProblemStatus.PROPOSAL_SUBMITTED,
      reason: "Synthetic proposal discovery item.",
    },
  });
  await prisma.proposal.upsert({
    where: { id: seedIds.analyticsDiscoveryProposal },
    update: {
      problemId: analyticsDiscoveryProblem.id,
      universityId: seedIds.university,
      title: "Synthetic community nutrition proposal",
      problemUnderstanding: "Synthetic understanding for industry discovery.",
      solutionSummary: "A community-led nutrition information service.",
      technicalApproach: "Synthetic mobile and outreach workflow.",
      expectedOutcomes: "Improved access to nutrition guidance.",
      estimatedBudget: 50000,
      timeline: "6 months",
      requestedSupportTypes: ["MENTORSHIP"],
      status: "SUBMITTED",
      submittedAt: new Date("2026-03-10T00:00:00.000Z"),
    },
    create: {
      id: seedIds.analyticsDiscoveryProposal,
      problemId: analyticsDiscoveryProblem.id,
      universityId: seedIds.university,
      title: "Synthetic community nutrition proposal",
      problemUnderstanding: "Synthetic understanding for industry discovery.",
      solutionSummary: "A community-led nutrition information service.",
      technicalApproach: "Synthetic mobile and outreach workflow.",
      expectedOutcomes: "Improved access to nutrition guidance.",
      estimatedBudget: 50000,
      timeline: "6 months",
      requestedSupportTypes: ["MENTORSHIP"],
      status: "SUBMITTED",
      submittedAt: new Date("2026-03-10T00:00:00.000Z"),
    },
  });
  await prisma.industryProposalView.upsert({
    where: {
      id: "00000000-0000-4000-8000-000000000098",
    },
    update: {
      proposalId: seedIds.analyticsDiscoveryProposal,
      industryId: industry.id,
      viewedAt: new Date("2026-03-12T00:00:00.000Z"),
    },
    create: {
      id: "00000000-0000-4000-8000-000000000098",
      proposalId: seedIds.analyticsDiscoveryProposal,
      industryId: industry.id,
      viewedAt: new Date("2026-03-12T00:00:00.000Z"),
    },
  });

  console.info("Seeded synthetic development data.");
  console.info(
    `Development password for all seeded accounts: ${developmentPassword}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import {
  PrismaClient,
  ProblemPriority,
  ProblemStatus,
  SubmitterType,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const developmentPassword = "DevOnly-Portal-123!";
const baseDate = new Date("2026-01-01T00:00:00.000Z");

const ids = {
  ministry: "00000000-0000-4000-8000-000000001001",
  rahul: "00000000-0000-4000-8000-000000001002",
  barkagaon: "00000000-0000-4000-8000-000000001003",
  jrdf: "00000000-0000-4000-8000-000000001004",
  jiwt: "00000000-0000-4000-8000-000000001011",
  jcai: "00000000-0000-4000-8000-000000001012",
  jeisi: "00000000-0000-4000-8000-000000001013",
  aqua: "00000000-0000-4000-8000-000000001021",
  green: "00000000-0000-4000-8000-000000001022",
  digital: "00000000-0000-4000-8000-000000001023",
  rahulProfile: "00000000-0000-4000-8000-000000001031",
  barkagaonProfile: "00000000-0000-4000-8000-000000001032",
  jrdfProfile: "00000000-0000-4000-8000-000000001033",
  waterCategory: "00000000-0000-4000-8000-000000001041",
  agricultureCategory: "00000000-0000-4000-8000-000000001042",
  embeddedCategory: "00000000-0000-4000-8000-000000001043",
  waterProblem: "00000000-0000-4000-8000-000000001051",
  agricultureProblem: "00000000-0000-4000-8000-000000001052",
  embeddedProblem: "00000000-0000-4000-8000-000000001053",
};

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "The deterministic development seed cannot run in production",
    );
  }

  const passwordHash = await bcrypt.hash(developmentPassword, 12);
  await clearDevelopmentDatabase();

  const ministry = await prisma.user.create({
    data: {
      id: ids.ministry,
      email: "ministry.admin@example.test",
      passwordHash,
      role: UserRole.MINISTRY_ADMIN,
      displayName: "Ministry Innovation Administrator",
    },
  });

  const submitters = await Promise.all([
    createSubmitter(
      {
        id: ids.rahul,
        profileId: ids.rahulProfile,
        email: "citizen.rahul@example.test",
        displayName: "Rahul Kumar",
        type: SubmitterType.INDIVIDUAL_CITIZEN,
      },
      passwordHash,
    ),
    createSubmitter(
      {
        id: ids.barkagaon,
        profileId: ids.barkagaonProfile,
        email: "panchayat.barkagaon@example.test",
        displayName: "Barkagaon Gram Panchayat",
        type: SubmitterType.PANCHAYATI_RAJ,
        organizationName: "Barkagaon Gram Panchayat",
      },
      passwordHash,
    ),
    createSubmitter(
      {
        id: ids.jrdf,
        profileId: ids.jrdfProfile,
        email: "org.jrdf@example.test",
        displayName: "Jharkhand Rural Development Foundation",
        type: SubmitterType.ORGANIZATION,
        organizationName: "Jharkhand Rural Development Foundation",
      },
      passwordHash,
    ),
  ]);

  const universities = await seedUniversities(ministry.id, passwordHash);
  await seedIndustries(ministry.id, passwordHash);
  const categories = await Promise.all([
    prisma.problemCategory.create({
      data: {
        id: ids.waterCategory,
        name: "Water and Sanitation",
        description:
          "Water access, quality, and community sanitation challenges.",
      },
    }),
    prisma.problemCategory.create({
      data: {
        id: ids.agricultureCategory,
        name: "Agriculture and Rural Development",
        description:
          "Agricultural productivity and rural livelihood challenges.",
      },
    }),
    prisma.problemCategory.create({
      data: {
        id: ids.embeddedCategory,
        name: "Digital and Embedded Systems",
        description:
          "Connected devices, monitoring, and public infrastructure.",
      },
    }),
  ]);
  await seedApprovedProblems(ministry.id, submitters, categories);

  console.info("Seeded clean synthetic development data.");
  console.info(
    "Authenticated users: 10 (3 submitters, 1 Ministry, 3 universities, 3 industries)",
  );
  console.info(
    `Universities: ${universities.map((item) => item.name).join("; ")}`,
  );
  console.info(
    `Development password for all seeded accounts: ${developmentPassword}`,
  );
}

async function clearDevelopmentDatabase(): Promise<void> {
  // Development-only reset. Explicitly list every application table so old
  // synthetic users, organizations, and dependent records cannot survive.
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE
    "Notification", "ImpactMeasurement", "ProjectDocument", "ProjectUpdate",
    "ProjectMilestone", "ProjectStatusHistory", "Project", "IndustryFunding",
    "IndustryCollaboration", "IndustryProposalView", "IndustryProposalInterest",
    "ProposalDocument", "Proposal", "TeamMember", "ProjectTeam",
    "UniversityProjectContext", "UniversityProblemAssignment", "ProblemUniversityMatch",
    "UniversityMatchingRun", "UniversityKnowledgeEmbedding", "ProblemEmbedding",
    "ProblemAIAnalysis", "ProblemEvidence", "ProblemStatusHistory", "Problem",
    "ProblemCategory", "RegistrationApplicationDocument", "RegistrationApplication",
    "IndustrySupportCapability", "IndustryInterestArea", "IndustryExpertise", "Industry",
    "UniversityPreviousProject", "UniversityFacility", "UniversityLab",
    "UniversityResearchArea", "UniversityFaculty", "University", "SubmitterProfile",
    "RefreshSession", "User" CASCADE`);
}

async function createSubmitter(
  input: {
    id: string;
    profileId: string;
    email: string;
    displayName: string;
    type: SubmitterType;
    organizationName?: string;
  },
  passwordHash: string,
) {
  const user = await prisma.user.create({
    data: {
      id: input.id,
      email: input.email,
      passwordHash,
      role: UserRole.SUBMITTER,
      displayName: input.displayName,
      submitterProfile: {
        create: {
          id: input.profileId,
          type: input.type,
          displayName: input.displayName,
          organizationName: input.organizationName ?? null,
          description: "Synthetic development submitter profile.",
        },
      },
    },
  });
  return { id: user.id, profileId: input.profileId };
}

async function seedUniversities(ministryId: string, passwordHash: string) {
  const data = [
    {
      id: ids.jiwt,
      userSuffix: "2001",
      email: "university.water@example.test",
      name: "Jharkhand Institute of Water Technology",
      code: "JIWT",
      city: "Ranchi",
      faculty: "Dr. Ananya Singh",
      expertise: [
        "IoT",
        "Water Quality",
        "Sensor Networks",
        "Smart Water Systems",
      ],
      research: [
        "Rural Water Management",
        "Water Quality Monitoring",
        "IoT",
        "Environmental Sensors",
        "Smart Infrastructure",
        "Embedded Systems",
      ],
      labs: [
        "Smart Water Systems Lab",
        "IoT and Sensor Networks Lab",
        "Environmental Monitoring Lab",
      ],
      projects: [
        "Low-Cost Rural Water Monitoring System",
        "IoT-Based Water Tank Monitoring",
        "Sensor-Based Groundwater Quality Monitoring",
      ],
    },
    {
      id: ids.jcai,
      userSuffix: "2002",
      email: "university.agri@example.test",
      name: "Jharkhand Centre for Agricultural Innovation",
      code: "JCAI",
      city: "Ranchi",
      faculty: "Dr. Vivek Prasad",
      expertise: ["Remote Sensing", "GIS", "IoT", "Agricultural Technology"],
      research: [
        "Precision Agriculture",
        "Remote Sensing",
        "GIS",
        "IoT",
        "Crop Monitoring",
        "Rural Development",
      ],
      labs: [
        "Precision Agriculture Lab",
        "Remote Sensing Lab",
        "Rural Technology Lab",
      ],
      projects: [
        "IoT-Based Crop Monitoring",
        "Remote Sensing for Crop Health",
        "Smart Irrigation Pilot",
      ],
    },
    {
      id: ids.jeisi,
      userSuffix: "2003",
      email: "university.embedded@example.test",
      name: "Jharkhand Embedded and Intelligent Systems Institute",
      code: "JEISI",
      city: "Dhanbad",
      faculty: "Dr. Arjun Mehta",
      expertise: ["Embedded Systems", "Sensors", "IoT", "AI"],
      research: [
        "Embedded Systems",
        "IoT",
        "Artificial Intelligence",
        "Sensor Networks",
        "Electronics",
        "Data Analytics",
      ],
      labs: [
        "Embedded Systems Lab",
        "IoT Research Lab",
        "Intelligent Systems Lab",
      ],
      projects: [
        "Low-Cost IoT Sensor Node",
        "Wireless Sensor Network",
        "Intelligent Infrastructure Monitoring",
      ],
    },
  ];
  const universities = [];
  for (const item of data) {
    const university = await prisma.university.create({
      data: {
        id: item.id,
        name: item.name,
        shortName: item.code,
        registrationNumber: `DEV-${item.code}`,
        description: `${item.name} is a synthetic development partner focused on ${item.research.slice(0, 3).join(", ")}.`,
        city: item.city,
        state: "Jharkhand",
        country: "India",
        isApproved: true,
        approvedById: ministryId,
        approvedAt: baseDate,
        createdById: ministryId,
      },
    });
    await prisma.user.create({
      data: {
        id: deterministicUserId(item.id, item.userSuffix),
        email: item.email,
        passwordHash,
        role: UserRole.UNIVERSITY,
        displayName: `${item.name} Administrator`,
        universityId: university.id,
      },
    });
    await prisma.universityFaculty.create({
      data: {
        universityId: university.id,
        name: item.faculty,
        title: "Faculty mentor",
        department: "Applied Innovation",
        researchFocus: item.expertise.join(", "),
      },
    });
    await prisma.universityResearchArea.createMany({
      data: item.research.map((name) => ({
        universityId: university.id,
        name,
        description: `Research capability in ${name}.`,
      })),
    });
    await prisma.universityLab.createMany({
      data: item.labs.map((name) => ({
        universityId: university.id,
        name,
        capabilities: item.expertise,
      })),
    });
    await prisma.universityFacility.create({
      data: {
        universityId: university.id,
        name: `${item.code} Innovation and Field Facility`,
        type: "INNOVATION_CENTER",
        description: "Synthetic facility for prototyping and field validation.",
        capabilities: item.expertise,
      },
    });
    await prisma.universityPreviousProject.createMany({
      data: item.projects.map((title) => ({
        universityId: university.id,
        title,
        summary: `Synthetic ${item.code} project demonstrating ${item.expertise[0]} capability.`,
        domains: item.research.slice(0, 3),
        outcomes: "Synthetic development outcome.",
      })),
    });
    universities.push(university);
  }
  return universities;
}

async function seedIndustries(ministryId: string, passwordHash: string) {
  const data = [
    {
      id: ids.aqua,
      userSuffix: "3001",
      email: "industry.aqua@example.test",
      name: "AquaTech Solutions Pvt. Ltd.",
      type: "STARTUP",
      city: "Ranchi",
      sector: "Water Technology",
      capabilities: [
        "IoT Hardware",
        "Water Sensors",
        "Embedded Systems",
        "Cloud Platforms",
        "Field Deployment",
        "Rural Technology",
      ],
    },
    {
      id: ids.green,
      userSuffix: "3002",
      email: "industry.green@example.test",
      name: "Green Rural Technologies",
      type: "STARTUP",
      city: "Jamshedpur",
      sector: "Rural Technology and Sustainability",
      capabilities: [
        "Environmental Sensors",
        "Rural Infrastructure",
        "Field Deployment",
        "Sustainability",
        "IoT",
      ],
    },
    {
      id: ids.digital,
      userSuffix: "3003",
      email: "industry.digital@example.test",
      name: "Digital Systems India Pvt. Ltd.",
      type: "INDUSTRY",
      city: "Jamshedpur",
      sector: "AI and Digital Systems",
      capabilities: [
        "Artificial Intelligence",
        "Data Analytics",
        "Cloud Computing",
        "Software Development",
        "Government Technology",
        "Digital Platforms",
      ],
    },
  ];
  for (const item of data) {
    const industry = await prisma.industry.create({
      data: {
        id: item.id,
        name: item.name,
        registrationNumber: `DEV-${item.type}-${item.id.slice(-3)}`,
        description: `${item.name} is a synthetic industry partner for local demonstration.`,
        sector: item.sector,
        city: item.city,
        state: "Jharkhand",
        country: "India",
        isApproved: true,
        approvedById: ministryId,
        approvedAt: baseDate,
        createdById: ministryId,
      },
    });
    await prisma.user.create({
      data: {
        id: deterministicUserId(item.id, item.userSuffix),
        email: item.email,
        passwordHash,
        role: UserRole.INDUSTRY,
        displayName: `${item.name} Contact`,
        industryId: industry.id,
      },
    });
    await prisma.industryExpertise.createMany({
      data: item.capabilities.map((name) => ({
        industryId: industry.id,
        name,
        description: `Synthetic ${item.type.toLowerCase()} capability.`,
      })),
    });
    await prisma.industryInterestArea.createMany({
      data: item.capabilities
        .slice(0, 2)
        .map((name) => ({ industryId: industry.id, name })),
    });
    await prisma.industrySupportCapability.createMany({
      data: item.capabilities.slice(0, 3).map((name) => ({
        industryId: industry.id,
        name,
        description: "Synthetic support capability.",
      })),
    });
  }
}

function deterministicUserId(organizationId: string, suffix: string): string {
  return `${organizationId.slice(0, -4)}${suffix}`;
}

async function seedApprovedProblems(
  ministryId: string,
  submitters: Array<{ id: string; profileId: string }>,
  categories: Array<{ id: string }>,
) {
  const problems = [
    {
      id: ids.waterProblem,
      submitter: submitters[0],
      categoryId: categories[0].id,
      title: "Reliable rural water quality monitoring",
      description:
        "Villages need affordable monitoring for drinking water quality and unsafe community water points.",
      district: "Ranchi District",
      outcome: "Enable timely water quality alerts and maintenance decisions.",
    },
    {
      id: ids.agricultureProblem,
      submitter: submitters[1],
      categoryId: categories[1].id,
      title: "Crop health support for small farmers",
      description:
        "Small farmers need accessible crop monitoring and irrigation guidance using local data.",
      district: "Hazaribagh District",
      outcome: "Improve crop decisions and reduce avoidable water use.",
    },
    {
      id: ids.embeddedProblem,
      submitter: submitters[2],
      categoryId: categories[2].id,
      title: "Low-cost monitoring for public infrastructure",
      description:
        "Local bodies need connected sensors to identify failures in distributed public infrastructure.",
      district: "Dhanbad District",
      outcome:
        "Detect infrastructure faults earlier and improve maintenance response.",
    },
  ];
  for (const item of problems) {
    const submitterId = item.submitter.profileId;
    const problem = await prisma.problem.create({
      data: {
        id: item.id,
        submitterId,
        categoryId: item.categoryId,
        title: item.title,
        description: item.description,
        societalContext:
          "Synthetic societal challenge affecting multiple communities.",
        geography: `${item.district}, Jharkhand`,
        district: item.district,
        desiredOutcome: item.outcome,
        priority: ProblemPriority.HIGH,
        currentStatus: ProblemStatus.MINISTRY_APPROVED,
      },
    });
    await prisma.problemStatusHistory.createMany({
      data: [
        {
          problemId: problem.id,
          actorUserId: item.submitter.id,
          newStatus: ProblemStatus.SUBMITTED,
          reason: "Synthetic development submission.",
        },
        {
          problemId: problem.id,
          actorUserId: ministryId,
          oldStatus: ProblemStatus.SUBMITTED,
          newStatus: ProblemStatus.MINISTRY_REVIEW,
          reason: "Synthetic Ministry review.",
        },
        {
          problemId: problem.id,
          actorUserId: ministryId,
          oldStatus: ProblemStatus.MINISTRY_REVIEW,
          newStatus: ProblemStatus.MINISTRY_APPROVED,
          reason: "Synthetic Ministry approval for matching demo.",
        },
      ],
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

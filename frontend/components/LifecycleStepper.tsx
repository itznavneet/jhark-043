import { formatStatus } from "./ui";

const lifecycle = [
  { key: "SUBMITTED", label: "Submitted" },
  { key: "AI_VALIDATED", label: "AI validated" },
  { key: "MINISTRY_APPROVED", label: "Ministry approved" },
  { key: "UNIVERSITY_ACCEPTED", label: "University accepted" },
  { key: "PROPOSAL_SUBMITTED", label: "Proposal" },
  { key: "INDUSTRY_ACCEPTED", label: "Industry" },
  { key: "PROTOTYPE_DEVELOPMENT", label: "Prototype" },
  { key: "FIELD_PILOT", label: "Pilot" },
  { key: "IMPLEMENTATION", label: "Implementation" },
  { key: "IMPACT_MEASURED", label: "Impact" },
  { key: "COMPLETED", label: "Completed" },
] as const;

const aliases: Record<string, string> = {
  MINISTRY_REVIEW: "AI_VALIDATED",
  AI_UNIVERSITY_MATCHED: "MINISTRY_APPROVED",
  UNIVERSITIES_RECOMMENDED: "MINISTRY_APPROVED",
  MINISTRY_APPROVED_UNIVERSITIES: "MINISTRY_APPROVED",
  INVITATIONS_SENT: "MINISTRY_APPROVED",
  TEAM_FORMED: "UNIVERSITY_ACCEPTED",
  PROPOSAL_DRAFT: "UNIVERSITY_ACCEPTED",
  INDUSTRY_REVIEW: "PROPOSAL_SUBMITTED",
  COLLABORATION_CONFIRMED: "INDUSTRY_ACCEPTED",
  INITIATED: "INDUSTRY_ACCEPTED",
};

export function LifecycleStepper({
  currentStatus,
  compact = false,
}: {
  currentStatus: string;
  compact?: boolean;
}) {
  const normalized = aliases[currentStatus] ?? currentStatus;
  const currentIndex = Math.max(
    lifecycle.findIndex((item) => item.key === normalized),
    0,
  );

  return (
    <section className={`lifecycle ${compact ? "lifecycle-compact" : ""}`} aria-label="Problem lifecycle">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="section-eyebrow">Journey</p>
          <h2 className="section-title">From challenge to measurable impact</h2>
        </div>
        <span className="hidden text-xs font-semibold text-slate-500 sm:block">
          {formatStatus(currentStatus)}
        </span>
      </div>
      <ol className="lifecycle-track">
        {lifecycle.map((item, index) => {
          const complete = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li
              className={`lifecycle-step ${complete ? "is-complete" : ""} ${active ? "is-active" : ""}`}
              key={item.key}
              aria-current={active ? "step" : undefined}
            >
              <span className="lifecycle-marker" aria-hidden="true">
                {complete ? "✓" : active ? "•" : ""}
              </span>
              <span className="lifecycle-label">{item.label}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

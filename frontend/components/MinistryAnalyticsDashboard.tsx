"use client";

import { useCallback, useEffect, useState } from "react";
import { AnalyticsBarList } from "./AnalyticsBarList";
import { AnalyticsCard } from "./AnalyticsCard";
import { MinistryNavigation } from "./MinistryNavigation";
import { getMinistryAnalytics, type MinistryAnalytics } from "../lib/api";

export function MinistryAnalyticsDashboard({
  accessToken,
}: {
  accessToken: string;
}) {
  const [analytics, setAnalytics] = useState<MinistryAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setAnalytics(await getMinistryAnalytics(accessToken));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load Ministry analytics",
      );
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
    );
  }
  if (!analytics) {
    return (
      <p className="rounded-xl bg-white p-6 text-sm text-slate-500 ring-1 ring-slate-200">
        Loading Ministry analytics...
      </p>
    );
  }

  const { overview, problems, universities, industries, projects, impact } =
    analytics;
  return (
    <div className="space-y-8">
      <MinistryNavigation />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard
          label="Total problems"
          value={overview.totalProblems}
          tone="teal"
        />
        <AnalyticsCard
          label="Universities"
          value={overview.totalUniversities}
          detail={`${universities.active} approved and active`}
          tone="blue"
        />
        <AnalyticsCard
          label="Industries"
          value={overview.totalIndustries}
          detail={`${industries.active} approved and active`}
          tone="blue"
        />
        <AnalyticsCard
          label="Submitters"
          value={overview.totalSubmitters}
          tone="slate"
        />
        <AnalyticsCard
          label="Awaiting review"
          value={overview.problemsAwaitingReview}
          tone="amber"
        />
        <AnalyticsCard
          label="Awaiting university acceptance"
          value={overview.problemsAwaitingUniversityAcceptance}
          tone="amber"
        />
        <AnalyticsCard
          label="Accepted university projects"
          value={overview.acceptedUniversityProjects}
          tone="teal"
        />
        <AnalyticsCard
          label="Proposals submitted"
          value={overview.proposalsSubmitted}
          tone="teal"
        />
        <AnalyticsCard
          label="Industry collaborations"
          value={overview.industryCollaborations}
          tone="blue"
        />
        <AnalyticsCard
          label="Active projects"
          value={overview.activeProjects}
          tone="teal"
        />
        <AnalyticsCard
          label="Completed projects"
          value={overview.completedProjects}
          tone="slate"
        />
        <AnalyticsCard
          label="Average project progress"
          value={
            projects.averageProgress === null
              ? "—"
              : `${Math.round(projects.averageProgress)}%`
          }
          detail={`${projects.delayedMilestones} delayed milestones`}
          tone="amber"
        />
      </section>

      <section>
        <SectionHeading
          eyebrow="Problem analytics"
          title="Demand and decision pipeline"
        />
        <div className="mt-4 grid gap-5 lg:grid-cols-3">
          <AnalyticsBarList
            title="Problems by status"
            items={problems.byStatus}
          />
          <AnalyticsBarList
            title="Problems by category"
            items={problems.byCategory}
          />
          <AnalyticsBarList
            title="Problems by district"
            items={problems.byDistrict}
          />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <TimeSeries items={problems.overTime} />
          <DecisionPanel
            decisions={problems.decisions}
            acceptance={problems.universityAcceptance}
          />
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Delivery and impact"
          title="Projects moving from collaboration to outcomes"
        />
        <div className="mt-4 grid gap-5 lg:grid-cols-3">
          <AnalyticsBarList
            title="Projects by lifecycle stage"
            items={projects.byStage}
          />
          <ImpactPanel impact={impact} />
          <AnalyticsBarList
            title="Industry collaboration signals"
            items={[
              { label: "Proposals viewed", value: industries.proposalsViewed },
              {
                label: "Proposals interested",
                value: industries.proposalsInterested,
              },
              { label: "Collaborations", value: industries.collaborations },
              {
                label: "Funding/support records",
                value: industries.fundingRecords,
              },
            ]}
          />
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Organization performance"
          title="University and industry participation"
        />
        <div className="mt-4 grid gap-5 xl:grid-cols-2">
          <UniversityTable rows={universities.rows} />
          <IndustryTable rows={industries.rows} />
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Analytics generated {new Date(analytics.generatedAt).toLocaleString()}
          . Proposal views are counted once per industry and proposal detail
          access.
        </p>
      </section>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-workflow">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-2xl font-bold text-ink">{title}</h2>
    </div>
  );
}

function TimeSeries({
  items,
}: {
  items: Array<{ period: string; value: number }>;
}) {
  const maximum = Math.max(...items.map((item) => item.value), 1);
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-bold text-ink">Problems over time</h2>
      {items.length ? (
        <div className="mt-6 flex h-40 items-end gap-2 overflow-x-auto">
          {items.map((item) => (
            <div
              className="flex min-w-12 flex-1 flex-col items-center gap-2"
              key={item.period}
            >
              <span className="text-xs font-semibold text-ink">
                {item.value}
              </span>
              <div
                className="w-full rounded-t-md bg-green-100"
                style={{
                  height: `${Math.max((item.value / maximum) * 100, 8)}%`,
                }}
              >
                <div className="h-full rounded-t-md bg-workflow" />
              </div>
              <span className="text-[10px] text-slate-400">{item.period}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-slate-500">No submissions yet.</p>
      )}
    </section>
  );
}

function DecisionPanel({
  decisions,
  acceptance,
}: {
  decisions: MinistryAnalytics["problems"]["decisions"];
  acceptance: MinistryAnalytics["problems"]["universityAcceptance"];
}) {
  const rate =
    acceptance.rate === null ? "—" : `${Math.round(acceptance.rate * 100)}%`;
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-bold text-ink">Decisions and acceptance</h2>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Metric label="Approved" value={decisions.approved} />
        <Metric label="Rejected" value={decisions.rejected} />
        <Metric label="Awaiting" value={decisions.awaitingDecision} />
      </div>
      <div className="mt-6 border-t border-slate-100 pt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">University acceptance rate</span>
          <span className="font-bold text-workflow">{rate}</span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {acceptance.accepted} accepted of {acceptance.invited} invitation
          records
        </p>
      </div>
    </section>
  );
}

function ImpactPanel({ impact }: { impact: MinistryAnalytics["impact"] }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-bold text-ink">Impact measurement</h2>
      <div className="mt-5 space-y-4">
        <Metric
          label="People benefited"
          value={impact.peopleBenefited.toLocaleString()}
        />
        <Metric
          label="Locations covered"
          value={impact.locationsCovered.toLocaleString()}
        />
        <Metric
          label="Completed implementations"
          value={impact.completedImplementations}
        />
        <Metric label="Measured outcomes" value={impact.measuredOutcomes} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-bold text-ink">{value}</span>
    </div>
  );
}

function UniversityTable({
  rows,
}: {
  rows: MinistryAnalytics["universities"]["rows"];
}) {
  return (
    <TableCard title="University participation">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="pb-3">University</th>
              <th className="pb-3 text-right">Assigned</th>
              <th className="pb-3 text-right">Accepted</th>
              <th className="pb-3 text-right">Proposals</th>
              <th className="pb-3 text-right">Active / done</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                className="border-b border-slate-50 last:border-0"
                key={row.id}
              >
                <td className="py-3 font-medium text-ink">
                  {row.shortName ?? row.name}
                  <span
                    className={`ml-2 inline-block h-2 w-2 rounded-full ${row.active ? "bg-emerald-500" : "bg-slate-300"}`}
                  />
                </td>
                <td className="py-3 text-right text-slate-600">
                  {row.problemsAssigned}
                </td>
                <td className="py-3 text-right text-slate-600">
                  {row.problemsAccepted}
                </td>
                <td className="py-3 text-right text-slate-600">
                  {row.proposalsSubmitted}
                </td>
                <td className="py-3 text-right text-slate-600">
                  {row.projectsActive} / {row.projectsCompleted}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableCard>
  );
}

function IndustryTable({
  rows,
}: {
  rows: MinistryAnalytics["industries"]["rows"];
}) {
  return (
    <TableCard title="Industry participation">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="pb-3">Industry</th>
              <th className="pb-3 text-right">Viewed</th>
              <th className="pb-3 text-right">Interested</th>
              <th className="pb-3 text-right">Collaborations</th>
              <th className="pb-3 text-right">Support records</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                className="border-b border-slate-50 last:border-0"
                key={row.id}
              >
                <td className="py-3 font-medium text-ink">
                  {row.name}
                  <span
                    className={`ml-2 inline-block h-2 w-2 rounded-full ${row.active ? "bg-emerald-500" : "bg-slate-300"}`}
                  />
                </td>
                <td className="py-3 text-right text-slate-600">
                  {row.proposalsViewed}
                </td>
                <td className="py-3 text-right text-slate-600">
                  {row.proposalsInterested}
                </td>
                <td className="py-3 text-right text-slate-600">
                  {row.collaborations}
                </td>
                <td className="py-3 text-right text-slate-600">
                  {row.fundingRecords}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableCard>
  );
}

function TableCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-5 text-lg font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

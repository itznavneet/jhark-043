"use client";

import { useState } from "react";
import {
  apiRequest,
  type IndustrySupportType,
  type UniversityProposal,
} from "../lib/api";

const supportTypes: IndustrySupportType[] = [
  "FUNDING",
  "MENTORSHIP",
  "TECHNICAL_SUPPORT",
  "INFRASTRUCTURE",
  "PILOT_SUPPORT",
  "OTHER",
];

interface ProposalFormProps {
  accessToken: string;
  assignmentId: string;
  proposal: UniversityProposal | null;
  onSaved(proposal: UniversityProposal): void;
  onError(message: string): void;
}

export function ProposalForm({
  accessToken,
  assignmentId,
  proposal,
  onSaved,
  onError,
}: ProposalFormProps) {
  const [form, setForm] = useState({
    title: proposal?.title ?? "",
    problemUnderstanding: proposal?.problemUnderstanding ?? "",
    solutionSummary: proposal?.solutionSummary ?? "",
    technicalApproach: proposal?.technicalApproach ?? "",
    innovation: proposal?.innovation ?? "",
    expectedOutcomes: proposal?.expectedOutcomes ?? "",
    requiredResources: proposal?.requiredResources ?? "",
    estimatedBudget: proposal?.estimatedBudget?.toString() ?? "",
    timeline: proposal?.timeline ?? "",
    prototypePlan: proposal?.prototypePlan ?? "",
    pilotPlan: proposal?.pilotPlan ?? "",
    implementationPlan: proposal?.implementationPlan ?? "",
    expectedSocialImpact: proposal?.expectedSocialImpact ?? "",
    requestedSupport: proposal?.requestedSupport ?? "",
    requestedSupportTypes: proposal?.requestedSupportTypes ?? [],
  });
  const [busy, setBusy] = useState(false);
  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function save(submit = false) {
    setBusy(true);
    try {
      const saved = await apiRequest<UniversityProposal>(
        `/collaboration/university/assignments/${assignmentId}/proposal`,
        {
          method: "PUT",
          body: JSON.stringify({
            ...form,
            estimatedBudget: form.estimatedBudget
              ? Number(form.estimatedBudget)
              : undefined,
          }),
        },
        accessToken,
      );
      onSaved(saved);
      if (submit) {
        const submitted = await apiRequest<UniversityProposal>(
          `/collaboration/university/assignments/${assignmentId}/proposal/submit`,
          { method: "POST" },
          accessToken,
        );
        onSaved(submitted);
      }
    } catch (requestError) {
      onError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save proposal",
      );
    } finally {
      setBusy(false);
    }
  }

  if (proposal?.status === "SUBMITTED")
    return (
      <section className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-ink">Submitted proposal</h2>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            SUBMITTED
          </span>
        </div>
        <h3 className="mt-5 text-lg font-semibold text-ink">
          {proposal.title}
        </h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {proposal.solutionSummary}
        </p>
        <p className="mt-4 text-xs text-slate-500">
          Submitted proposals are now available for industry review.
        </p>
        {proposal.industryCollaborations.length ? (
          <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
              Supporting industry
            </p>
            <div className="mt-3 space-y-3">
              {proposal.industryCollaborations.map((collaboration) => (
                <div
                  className="rounded-lg bg-white/70 p-3"
                  key={collaboration.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-teal-950">
                      {collaboration.industry.name}
                    </p>
                    <span className="text-xs font-semibold text-teal-800">
                      {collaboration.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-teal-900">
                    {collaboration.supportType.replaceAll("_", " ")}
                    {collaboration.confirmedAt
                      ? ` · confirmed ${new Date(collaboration.confirmedAt).toLocaleString()}`
                      : ""}
                  </p>
                  {collaboration.supportSummary ? (
                    <p className="mt-2 text-sm leading-5 text-teal-900">
                      {collaboration.supportSummary}
                    </p>
                  ) : null}
                  {collaboration.fundingRecords.length ? (
                    <p className="mt-2 text-xs text-teal-800">
                      Funding/support records:{" "}
                      {collaboration.fundingRecords.length}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    );

  return (
    <section className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">Solution proposal</h2>
          <p className="mt-1 text-sm text-slate-600">
            Save a draft as you develop the solution, then submit it for
            industry discovery.
          </p>
        </div>
        {proposal ? (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            DRAFT
          </span>
        ) : null}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field
          label="Proposal title"
          value={form.title}
          onChange={(value) => update("title", value)}
        />
        <Field
          label="Estimated budget"
          value={form.estimatedBudget}
          onChange={(value) => update("estimatedBudget", value)}
          type="number"
        />
        <TextArea
          label="Problem understanding"
          value={form.problemUnderstanding}
          onChange={(value) => update("problemUnderstanding", value)}
          required
        />
        <TextArea
          label="Proposed solution"
          value={form.solutionSummary}
          onChange={(value) => update("solutionSummary", value)}
          required
        />
        <TextArea
          label="Technical approach"
          value={form.technicalApproach}
          onChange={(value) => update("technicalApproach", value)}
        />
        <TextArea
          label="Innovation"
          value={form.innovation}
          onChange={(value) => update("innovation", value)}
        />
        <TextArea
          label="Expected outcomes"
          value={form.expectedOutcomes}
          onChange={(value) => update("expectedOutcomes", value)}
        />
        <TextArea
          label="Required resources"
          value={form.requiredResources}
          onChange={(value) => update("requiredResources", value)}
        />
        <TextArea
          label="Timeline"
          value={form.timeline}
          onChange={(value) => update("timeline", value)}
        />
        <TextArea
          label="Prototype plan"
          value={form.prototypePlan}
          onChange={(value) => update("prototypePlan", value)}
        />
        <TextArea
          label="Pilot plan"
          value={form.pilotPlan}
          onChange={(value) => update("pilotPlan", value)}
        />
        <TextArea
          label="Implementation plan"
          value={form.implementationPlan}
          onChange={(value) => update("implementationPlan", value)}
        />
        <TextArea
          label="Expected social impact"
          value={form.expectedSocialImpact}
          onChange={(value) => update("expectedSocialImpact", value)}
        />
        <TextArea
          label="Requested support"
          value={form.requestedSupport}
          onChange={(value) => update("requestedSupport", value)}
        />
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-semibold text-slate-700">
            Requested support types
          </legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {supportTypes.map((type) => (
              <label
                className="flex items-center gap-2 text-sm text-slate-600"
                key={type}
              >
                <input
                  type="checkbox"
                  checked={form.requestedSupportTypes.includes(type)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      requestedSupportTypes: event.target.checked
                        ? [...current.requestedSupportTypes, type]
                        : current.requestedSupportTypes.filter(
                            (item) => item !== type,
                          ),
                    }))
                  }
                />
                {type.toLowerCase().replaceAll("_", " ")}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={busy}
          onClick={() => void save()}
        >
          Save draft
        </button>
        <button
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={busy}
          onClick={() => void save(true)}
        >
          Save and submit
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  type?: string;
}) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <input
        className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
function TextArea({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
      {label}
      {required ? " *" : ""}
      <textarea
        className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 p-3 font-normal"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

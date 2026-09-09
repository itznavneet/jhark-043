"use client";

import { FormEvent, useState } from "react";
import { apiRequest, type Problem } from "../lib/api";

type FormState = {
  title: string;
  description: string;
  category: string;
  location: string;
  district: string;
  block: string;
  villageLocality: string;
  latitude: string;
  longitude: string;
  priority: string;
  societalContext: string;
  desiredOutcome: string;
  supportingInformation: string;
  evidenceType: string;
  evidenceTitle: string;
  evidenceUrl: string;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  category: "",
  location: "",
  district: "",
  block: "",
  villageLocality: "",
  latitude: "",
  longitude: "",
  priority: "MEDIUM",
  societalContext: "",
  desiredOutcome: "",
  supportingInformation: "",
  evidenceType: "DOCUMENT",
  evidenceTitle: "",
  evidenceUrl: "",
};

export function ProblemForm({
  accessToken,
  onCreated,
}: {
  accessToken: string;
  onCreated(problem: Problem): void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function useCurrentLocation() {
    setLocationMessage(null);
    if (!navigator.geolocation) {
      setLocationMessage(
        "Location is not supported by this browser. Enter coordinates manually.",
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        update("latitude", position.coords.latitude.toFixed(6));
        update("longitude", position.coords.longitude.toFixed(6));
        setLocationMessage(
          "Current location added. You can adjust it before submitting.",
        );
      },
      () =>
        setLocationMessage(
          "Location permission was denied. Enter the location manually.",
        ),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Problem title is required.");
      return;
    }
    if (form.title.trim().length < 5) {
      setError("Problem title must contain at least 5 characters.");
      return;
    }
    if (form.description.trim().length < 50) {
      setError("Description must contain at least 50 characters.");
      return;
    }
    if (!form.category.trim()) {
      setError("Problem category is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const optional = (value: string) => value.trim() || undefined;
      const evidenceUrl = optional(form.evidenceUrl);
      const evidence = evidenceUrl
        ? [
            {
              type: form.evidenceType,
              title: form.evidenceTitle.trim() || "Supporting evidence",
              externalUrl: evidenceUrl,
            },
          ]
        : [];
      const problem = await apiRequest<Problem>(
        "/problems",
        {
          method: "POST",
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            category: form.category,
            location: optional(form.location),
            district: optional(form.district),
            block: optional(form.block),
            villageLocality: optional(form.villageLocality),
            latitude: form.latitude ? Number(form.latitude) : undefined,
            longitude: form.longitude ? Number(form.longitude) : undefined,
            priority: form.priority || undefined,
            societalContext: optional(form.societalContext),
            desiredOutcome: optional(form.desiredOutcome),
            supportingInformation: optional(form.supportingInformation),
            evidence,
          }),
        },
        accessToken,
      );
      onCreated(problem);
      setForm(emptyForm);
      setLocationMessage(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit problem",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel space-y-6 p-6 sm:p-8" onSubmit={submit}>
      <div className="border-b border-slate-100 pb-5">
        <p className="section-eyebrow">New community challenge</p>
        <h2 className="section-title mt-1">Submit a societal challenge</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Provide enough context for AI validation, community support, Ministry
          review, and future university matching.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Fields marked with <span className="font-bold text-accent">*</span> are required.
        </p>
      </div>

      {error ? <div className="alert-error">{error}</div> : null}

      <fieldset className="form-section">
        <legend className="form-section-title">Challenge basics</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <FieldLabel label="Problem title" required hint="Use a clear, specific title.">
            <input
              id="problem-title"
              className="mt-2 w-full"
              placeholder="e.g. Reliable drinking water for remote villages"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              required
              minLength={5}
            />
          </FieldLabel>
          <FieldLabel label="Category / domain" required hint="Choose the area most affected.">
            <input
              id="problem-category"
              className="mt-2 w-full"
              placeholder="e.g. Water management"
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
              required
            />
          </FieldLabel>
          <FieldLabel label="Description" required hint="At least 50 characters. Explain who is affected and what is happening." className="sm:col-span-2">
            <textarea
              id="problem-description"
              className="mt-2 min-h-36 w-full"
              placeholder="Describe the community or institutional challenge in enough detail for validation."
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              required
              minLength={50}
            />
          </FieldLabel>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="form-section-title">Place and urgency</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <FieldLabel label="Location" hint="State, region, or broader geography." className="sm:col-span-2">
            <input
              id="problem-location"
              className="mt-2 w-full"
              placeholder="e.g. Rural Ranchi, Jharkhand"
              value={form.location}
              onChange={(event) => update("location", event.target.value)}
            />
          </FieldLabel>
          <FieldLabel label="District">
            <input className="mt-2 w-full" value={form.district} onChange={(event) => update("district", event.target.value)} />
          </FieldLabel>
          <FieldLabel label="Block">
            <input className="mt-2 w-full" value={form.block} onChange={(event) => update("block", event.target.value)} />
          </FieldLabel>
          <FieldLabel label="Village / locality" className="sm:col-span-2">
            <input className="mt-2 w-full" placeholder="Specific village, ward, or locality" value={form.villageLocality} onChange={(event) => update("villageLocality", event.target.value)} />
          </FieldLabel>
          <FieldLabel label="Priority">
            <select className="mt-2 w-full" value={form.priority} onChange={(event) => update("priority", event.target.value)}>
              <option value="">Not specified</option>
              <option>LOW</option>
              <option>MEDIUM</option>
              <option>HIGH</option>
              <option>CRITICAL</option>
            </select>
          </FieldLabel>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="form-section-title">Map coordinates</legend>
        <p className="text-sm leading-6 text-slate-600">Coordinates are optional. Use your browser location or enter them manually.</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <FieldLabel label="Latitude">
            <input className="mt-2 w-full" inputMode="decimal" type="number" step="any" placeholder="e.g. 23.3441" value={form.latitude} onChange={(event) => update("latitude", event.target.value)} />
          </FieldLabel>
          <FieldLabel label="Longitude">
            <input className="mt-2 w-full" inputMode="decimal" type="number" step="any" placeholder="e.g. 85.3096" value={form.longitude} onChange={(event) => update("longitude", event.target.value)} />
          </FieldLabel>
        </div>
        <button className="btn-secondary mt-4" type="button" onClick={useCurrentLocation}>Use current location</button>
        {locationMessage ? <p className="mt-2 text-xs text-slate-500" role="status">{locationMessage}</p> : null}
      </fieldset>

      <fieldset className="form-section">
        <legend className="form-section-title">Context for reviewers</legend>
        <div className="space-y-5">
          <FieldLabel label="Societal context" hint="Explain the wider community or public-service impact.">
            <textarea className="mt-2 min-h-24 w-full" placeholder="Who is affected and why does this matter beyond one individual?" value={form.societalContext} onChange={(event) => update("societalContext", event.target.value)} />
          </FieldLabel>
          <FieldLabel label="Desired outcome">
            <textarea className="mt-2 min-h-24 w-full" placeholder="What improvement would a successful solution create?" value={form.desiredOutcome} onChange={(event) => update("desiredOutcome", event.target.value)} />
          </FieldLabel>
          <FieldLabel label="Supporting information">
            <textarea className="mt-2 min-h-24 w-full" placeholder="Add relevant facts, observations, or implementation constraints." value={form.supportingInformation} onChange={(event) => update("supportingInformation", event.target.value)} />
          </FieldLabel>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="form-section-title">Evidence link <span className="font-normal text-slate-500">(optional)</span></legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <FieldLabel label="Evidence type">
            <select className="mt-2 w-full" value={form.evidenceType} onChange={(event) => update("evidenceType", event.target.value)}>
              <option>DOCUMENT</option>
              <option>IMAGE</option>
              <option>VIDEO</option>
            </select>
          </FieldLabel>
          <FieldLabel label="Evidence title">
            <input className="mt-2 w-full" placeholder="e.g. District water survey" value={form.evidenceTitle} onChange={(event) => update("evidenceTitle", event.target.value)} />
          </FieldLabel>
          <FieldLabel label="Evidence URL" hint="Paste a publicly accessible link." className="sm:col-span-2">
            <input className="mt-2 w-full" type="url" placeholder="https://..." value={form.evidenceUrl} onChange={(event) => update("evidenceUrl", event.target.value)} />
          </FieldLabel>
        </div>
        <p className="mt-3 text-xs text-slate-500">Binary uploads will be connected to the provider-neutral storage layer in a later phase.</p>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <p className="max-w-md text-xs leading-5 text-slate-500">AI validation is advisory. Validated problems become eligible for community support before Ministry review.</p>
        <button className="btn-primary" disabled={submitting} type="submit">{submitting ? "Submitting..." : "Submit problem"}</button>
      </div>
    </form>
  );
}

function FieldLabel({
  label,
  required = false,
  hint,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block text-sm font-semibold text-slate-700 ${className}`}>
      <span>
        {label} {required ? <span className="text-accent" aria-hidden="true">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs font-normal leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

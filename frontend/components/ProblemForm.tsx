"use client";

import { FormEvent, useState } from "react";
import { apiRequest, type Problem } from "../lib/api";

type FormState = {
  title: string; description: string; category: string; location: string; district: string; block: string;
  villageLocality: string; latitude: string; longitude: string; priority: string; societalContext: string;
  desiredOutcome: string; supportingInformation: string; evidenceType: string; evidenceTitle: string; evidenceUrl: string;
};

const emptyForm: FormState = {
  title: "", description: "", category: "", location: "", district: "", block: "", villageLocality: "",
  latitude: "", longitude: "", priority: "MEDIUM", societalContext: "", desiredOutcome: "",
  supportingInformation: "", evidenceType: "DOCUMENT", evidenceTitle: "", evidenceUrl: "",
};

export function ProblemForm({ accessToken, onCreated }: { accessToken: string; onCreated(problem: Problem): void }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const optional = (value: string) => value.trim() || undefined;
      const evidenceUrl = optional(form.evidenceUrl);
      const evidence = evidenceUrl
        ? [{ type: form.evidenceType, title: form.evidenceTitle.trim() || "Supporting evidence", externalUrl: evidenceUrl }]
        : [];
      const problem = await apiRequest<Problem>("/problems", {
        method: "POST",
        body: JSON.stringify({
          title: form.title, description: form.description, category: form.category, location: optional(form.location),
          district: optional(form.district), block: optional(form.block), villageLocality: optional(form.villageLocality),
          latitude: form.latitude ? Number(form.latitude) : undefined, longitude: form.longitude ? Number(form.longitude) : undefined,
          priority: form.priority || undefined, societalContext: optional(form.societalContext), desiredOutcome: optional(form.desiredOutcome),
          supportingInformation: optional(form.supportingInformation), evidence,
        }),
      }, accessToken);
      onCreated(problem);
      setForm(emptyForm);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to submit problem");
    } finally {
      setSubmitting(false);
    }
  }

  const fields: Array<[keyof FormState, string, string]> = [
    ["title", "Title", "e.g. Reliable drinking water for remote villages"],
    ["category", "Category / domain", "e.g. Water and sanitation"],
    ["location", "Location", "State or broader geography"],
  ];

  return (
    <form className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200" onSubmit={submit}>
      <div><h2 className="text-xl font-bold text-ink">Submit a societal challenge</h2><p className="mt-1 text-sm text-slate-500">Provide enough context for Ministry review and future university matching.</p></div>
      {fields.map(([field, label, placeholder]) => <label className="block text-sm font-medium text-slate-700" key={field}>{label}<input className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent" placeholder={placeholder} value={form[field]} onChange={(event) => update(field, event.target.value)} required={field !== "location"} /></label>)}
      <label className="block text-sm font-medium text-slate-700">Description<textarea className="mt-1.5 min-h-32 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent" value={form.description} onChange={(event) => update("description", event.target.value)} required /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">District<input className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.district} onChange={(event) => update("district", event.target.value)} /></label><label className="block text-sm font-medium text-slate-700">Block<input className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.block} onChange={(event) => update("block", event.target.value)} /></label></div>
      <label className="block text-sm font-medium text-slate-700">Village / locality<input className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.villageLocality} onChange={(event) => update("villageLocality", event.target.value)} /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Latitude<input className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" inputMode="decimal" type="number" step="any" value={form.latitude} onChange={(event) => update("latitude", event.target.value)} /></label><label className="block text-sm font-medium text-slate-700">Longitude<input className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" inputMode="decimal" type="number" step="any" value={form.longitude} onChange={(event) => update("longitude", event.target.value)} /></label></div>
      <label className="block text-sm font-medium text-slate-700">Priority<select className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.priority} onChange={(event) => update("priority", event.target.value)}><option value="">Not specified</option><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></label>
      <label className="block text-sm font-medium text-slate-700">Societal context<textarea className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.societalContext} onChange={(event) => update("societalContext", event.target.value)} /></label>
      <label className="block text-sm font-medium text-slate-700">Desired outcome<textarea className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.desiredOutcome} onChange={(event) => update("desiredOutcome", event.target.value)} /></label>
      <label className="block text-sm font-medium text-slate-700">Supporting information<textarea className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.supportingInformation} onChange={(event) => update("supportingInformation", event.target.value)} /></label>
      <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4"><legend className="px-1 text-sm font-semibold text-slate-700">Evidence link (optional)</legend><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Type<select className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.evidenceType} onChange={(event) => update("evidenceType", event.target.value)}><option>DOCUMENT</option><option>IMAGE</option><option>VIDEO</option></select></label><label className="text-sm font-medium text-slate-700">Title<input className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.evidenceTitle} onChange={(event) => update("evidenceTitle", event.target.value)} /></label></div><label className="block text-sm font-medium text-slate-700">URL<input className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" type="url" placeholder="https://..." value={form.evidenceUrl} onChange={(event) => update("evidenceUrl", event.target.value)} /></label><p className="text-xs text-slate-500">Binary uploads will be connected to the provider-neutral storage layer in a later phase.</p></fieldset>
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <button className="rounded-lg bg-accent px-4 py-2.5 font-semibold text-white hover:bg-teal-800 disabled:opacity-60" disabled={submitting} type="submit">{submitting ? "Submitting..." : "Submit problem"}</button>
    </form>
  );
}

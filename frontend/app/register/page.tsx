"use client";

import Link from "next/link";
import { useState } from "react";
import { RegisterSubmitterForm } from "../../components/RegisterSubmitterForm";

export default function RegisterPage() {
  const [mode, setMode] = useState<"choice" | "submitter">("choice");
  if (mode === "submitter") return <RegisterSubmitterForm />;
  return (
    <main className="min-h-screen bg-canvas px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="page-eyebrow">Join the portal</p>
        <h1 className="page-title">Who are you?</h1>
        <p className="page-description">
          Choose the pathway that matches your role. Ministry accounts are
          provisioned separately.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <ChoiceCard
            title="Citizen"
            description="Submit societal problems and track their lifecycle."
            onClick={() => setMode("submitter")}
          />
          <ChoiceCard
            title="Panchayati Raj Institution"
            description="Submit community and local-government problems."
            onClick={() => setMode("submitter")}
          />
          <ChoiceCard
            title="Organization / NGO"
            description="Submit institutional and social innovation problems."
            onClick={() => setMode("submitter")}
          />
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Link
            className="panel p-6 transition hover:-translate-y-0.5 hover:shadow-md"
            href="/register/university"
          >
            <h2 className="text-lg font-bold text-ink">University</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Apply to participate as a research institution.
            </p>
          </Link>
          <Link
            className="panel p-6 transition hover:-translate-y-0.5 hover:shadow-md"
            href="/register/industry"
          >
            <h2 className="text-lg font-bold text-ink">Industry / Startup</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Apply to support university solutions.
            </p>
          </Link>
        </div>
        <p className="mt-7 text-sm">
          <Link
            className="font-semibold text-accent hover:underline"
            href="/login"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

function ChoiceCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick(): void;
}) {
  return (
    <button
      className="panel p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      onClick={onClick}
      type="button"
    >
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <span className="mt-5 inline-block text-sm font-bold text-accent">
        Continue →
      </span>
    </button>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth";
import Link from "next/link";
import type { LoginAccountType } from "../lib/api";
import { ErrorAlert, PrimaryButton } from "./ui";
import { PasswordField } from "./PasswordField";
import { JharkhandMap } from "./JharkhandMap";

export function LoginForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<LoginAccountType>("SUBMITTER");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const signedInUser = await signIn(email, password, accountType);
      if (signedInUser.mustChangePassword) {
        router.replace("/account/setup");
        return;
      }
      const destination =
        signedInUser.role === "MINISTRY_ADMIN"
          ? "/ministry/analytics"
          : signedInUser.role === "UNIVERSITY"
            ? "/university"
            : signedInUser.role === "INDUSTRY"
              ? "/industry"
              : "/my-problems";
      router.replace(destination);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign in",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-canvas lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden overflow-hidden bg-primary px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between lg:px-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.16),transparent_32%),linear-gradient(145deg,#07386f,#0b4f9c_60%,#1268b4)]" aria-hidden="true" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-lg font-black text-white shadow-lg">SI</span>
            <div>
              <p className="text-sm font-extrabold tracking-tight">Societal Innovation</p>
              <p className="text-xs text-blue-100">Collaboration Portal</p>
            </div>
          </div>
          <p className="mt-16 text-sm font-bold uppercase tracking-[0.2em] text-orange-200">SIH 26043 · Jharkhand</p>
          <h1 className="mt-5 max-w-xl text-4xl font-black leading-tight sm:text-5xl">
            Turn local challenges into shared solutions.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-blue-50">
            A trusted workspace for communities, universities, government, and
            industry to move societal innovation from idea to measurable impact.
          </p>
          <div className="mt-7 flex items-center gap-3 text-sm font-semibold text-blue-50">
            <span className="h-0.5 w-10 bg-accent" />
            From Jharkhand, for communities everywhere.
          </div>
        </div>
        <div className="relative z-10 mt-8">
          <JharkhandMap />
          <p className="mt-2 text-xs text-blue-100">A Ministry-governed network for ideas, capability, and impact.</p>
        </div>
        <p className="relative z-10 text-sm text-blue-100">
          Societal Innovation Collaboration Portal
        </p>
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-sm font-black text-white">SI</span>
              <div><p className="text-sm font-extrabold text-ink">Societal Innovation</p><p className="text-xs text-slate-500">Collaboration Portal</p></div>
            </div>
            <p className="page-eyebrow mt-8">SIH 26043 · Jharkhand</p>
            <h1 className="page-title">Turn local challenges into shared solutions.</h1>
            <div className="mt-6 rounded-2xl bg-primary p-4">
              <JharkhandMap />
            </div>
          </div>
          <div className="panel p-7 sm:p-9">
            <p className="page-eyebrow">Secure workspace</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
              Sign in to collaborate
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Submit, review, and advance societal challenges through their
              complete lifecycle.
            </p>
            <form className="mt-8 space-y-5" onSubmit={submit}>
              <div>
                <label
                  className="text-sm font-semibold text-slate-700"
                  htmlFor="login-email"
                >
                  Email address
                </label>
                <input
                  className="mt-2 w-full px-3 py-2.5"
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <fieldset>
                <legend className="text-sm font-semibold text-slate-700">
                  I am signing in as
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["SUBMITTER", "Citizen / Submitter"],
                      ["UNIVERSITY", "University"],
                      ["INDUSTRY", "Industry / Startup"],
                      ["MINISTRY_ADMIN", "Ministry"],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${accountType === value ? "border-accent bg-orange-50 font-semibold text-ink" : "border-slate-200 text-slate-600 hover:border-primary hover:bg-blue-50"}`}
                      key={value}
                    >
                      <input
                        checked={accountType === value}
                        name="accountType"
                        onChange={() => setAccountType(value)}
                        type="radio"
                        value={value}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <PasswordField
                id="login-password"
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                required
              />
              {error ? <ErrorAlert message={error} /> : null}
              <PrimaryButton
                className="w-full"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Signing in..." : "Sign in"}
              </PrimaryButton>
            </form>
            <div className="mt-6 space-y-2 border-t border-slate-100 pt-5 text-sm">
              <p className="text-xs leading-5 text-slate-400">
                Use a seeded development account for local verification.
                Production credentials are never shown here.
              </p>
              <p>
                <Link
                  className="font-semibold text-accent hover:underline"
                  href="/register"
                >
                  Don&apos;t have a citizen account? Register
                </Link>
              </p>
              <p>
                <Link
                  className="font-semibold text-accent hover:underline"
                  href="/register/university"
                >
                  Apply for University Registration
                </Link>
              </p>
              <p>
                <Link
                  className="font-semibold text-accent hover:underline"
                  href="/register/industry"
                >
                  Apply for Industry / Startup Registration
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

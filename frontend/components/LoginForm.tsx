"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth";
import Link from "next/link";
import type { LoginAccountType } from "../lib/api";
import { ErrorAlert, PrimaryButton } from "./ui";
import { PasswordField } from "./PasswordField";

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
    <main className="grid min-h-screen bg-canvas lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden bg-ink px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between lg:px-16">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-200">
            SIH 26043
          </p>
          <h1 className="mt-8 max-w-xl text-5xl font-black leading-tight">
            Turn local challenges into shared solutions.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
            A trusted workspace for communities, universities, government, and
            industry to move societal innovation from idea to measurable impact.
          </p>
        </div>
        <p className="text-sm text-slate-400">
          Societal Innovation Collaboration Portal
        </p>
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="page-eyebrow">SIH 26043</p>
            <h1 className="page-title">Societal Innovation Portal</h1>
          </div>
          <div className="panel p-7 sm:p-9">
            <p className="page-eyebrow">Secure workspace</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
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
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${accountType === value ? "border-accent bg-teal-50 text-ink" : "border-slate-200 text-slate-600"}`}
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

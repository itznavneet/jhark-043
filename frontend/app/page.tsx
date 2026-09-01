"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "../components/LoginForm";
import { useAuth } from "../lib/auth";

export default function HomePage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && user?.role === "SUBMITTER") {
      router.replace("/my-problems");
    } else if (!loading && user?.role === "MINISTRY_ADMIN") {
      router.replace("/ministry/analytics");
    } else if (!loading && user?.role === "UNIVERSITY") {
      router.replace("/university");
    } else if (!loading && user?.role === "INDUSTRY") {
      router.replace("/industry");
    }
  }, [loading, router, user]);

  if (
    loading ||
    (user &&
      ["SUBMITTER", "MINISTRY_ADMIN", "UNIVERSITY", "INDUSTRY"].includes(
        user.role,
      ))
  ) {
    return (
      <main className="grid min-h-screen place-items-center text-slate-500">
        Loading portal...
      </main>
    );
  }

  if (user) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold text-ink">Problem workspace</h1>
          <p className="mt-3 text-slate-600">
            This account does not have an available workspace yet.
          </p>
          <button
            className="mt-6 rounded-lg bg-accent px-4 py-2.5 font-semibold text-white"
            onClick={() => void signOut()}
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return <LoginForm />;
}

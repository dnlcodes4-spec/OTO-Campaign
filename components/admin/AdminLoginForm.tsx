"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setSubmitting(false);
        setErrorMessage("Incorrect email or password.");
        return;
      }

      /*
       * A valid Supabase session is not the same as admin access: this project
       * is shared with the Atunluto campaign site, so any of their users can
       * sign in here successfully. Without this probe they would be bounced
       * straight back to this form by the proxy with nothing on screen -
       * indistinguishable from the click never registering. GET
       * /api/admin/admins already runs authorizeAdminRequest and answers 401
       * for a non-oto_admins session, so it doubles as the membership check.
       */
      const membershipCheck = await fetch("/api/admin/admins");
      if (!membershipCheck.ok) {
        await supabase.auth.signOut();
        setSubmitting(false);
        setErrorMessage("This account does not have admin access.");
        return;
      }
    } catch (error) {
      // createClient() (a malformed env var) or either network call can
      // throw outright rather than resolve with an `error` field. Without
      // this catch the button stayed on "Signing in..." forever with no
      // way to tell what happened, and no request ever left the browser.
      console.error("Admin sign-in failed:", error);
      setSubmitting(false);
      setErrorMessage("Something went wrong. Please try again.");
      return;
    }

    // Left submitting on the success path so the button stays disabled
    // through the redirect rather than flashing back to "Sign in".
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="font-display text-3xl font-semibold text-ink">Admin sign in</h1>
        <label className="flex flex-col gap-1 text-sm font-body">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="border border-ink/20 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-body">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="border border-ink/20 px-3 py-2"
          />
        </label>
        {errorMessage && (
          <p role="alert" className="text-sm text-brand-red">
            {errorMessage}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="bg-brand-green px-6 py-3 text-sm font-body font-medium text-ink-inverse disabled:opacity-50"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}

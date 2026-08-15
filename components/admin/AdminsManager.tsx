"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { generateStrongPassword } from "@/lib/admin/password";

type AdminRecord = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
};

type AdminsManagerProps = {
  extraHeaders?: Record<string, string>;
};

export function AdminsManager({ extraHeaders = {} }: AdminsManagerProps) {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAdmins = useCallback(async () => {
    const response = await fetch("/api/admin/admins", { headers: extraHeaders });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setErrorMessage(body.error ?? "Failed to load admins");
      setStatus("error");
      return;
    }
    const body = await response.json();
    setAdmins(body.admins);
    setStatus("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    queueMicrotask(loadAdmins);
  }, [loadAdmins]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    const response = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify({ email, password, displayName: displayName || undefined }),
    });
    setSubmitting(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setErrorMessage(body.error ?? "Failed to create admin");
      return;
    }
    setEmail("");
    setPassword("");
    setDisplayName("");
    await loadAdmins();
  }

  async function handleDelete(id: string) {
    // Deleting an admin destroys the auth user too - there is no undo, and
    // the row sits one careless click away from every other row in the list.
    if (!window.confirm("Delete this admin? This cannot be undone.")) {
      return;
    }

    const response = await fetch(`/api/admin/admins/${id}`, {
      method: "DELETE",
      headers: extraHeaders,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setErrorMessage(body.error ?? "Failed to delete admin");
      return;
    }
    await loadAdmins();
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleCreate} className="flex max-w-md flex-col gap-4">
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
          Display name
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="border border-ink/20 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-body">
          Password
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="flex-1 border border-ink/20 px-3 py-2"
            />
            <button
              type="button"
              onClick={() => setPassword(generateStrongPassword())}
              className="text-sm underline"
            >
              Generate
            </button>
          </div>
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
          {submitting ? "Creating..." : "Create admin"}
        </button>
      </form>

      {status === "loading" && <p>Loading admins...</p>}

      <ul className="flex flex-col gap-3">
        {admins.map((admin) => (
          <li
            key={admin.id}
            className="flex items-center justify-between gap-4 border-b border-ink/10 pb-3"
          >
            <div>
              <p className="font-body font-medium">{admin.display_name ?? admin.email}</p>
              {admin.display_name && <p className="text-sm text-ink/60">{admin.email}</p>}
            </div>
            <button
              type="button"
              onClick={() => handleDelete(admin.id)}
              className="text-sm text-brand-red underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { generateStrongPassword } from "@/lib/admin/password";
import { useToast } from "./ToastProvider";

type AdminRecord = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
};

type AdminsManagerProps = {
  extraHeaders?: Record<string, string>;
};

const SKELETON_ROWS = 3;

export function AdminsManager({ extraHeaders = {} }: AdminsManagerProps) {
  const toast = useToast();
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    toast.success("Admin created.");
    await loadAdmins();
  }

  async function handleDelete(id: string) {
    // Deleting an admin destroys the auth user too - there is no undo, and
    // the row sits one careless click away from every other row in the list.
    if (!window.confirm("Delete this admin? This cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    const response = await fetch(`/api/admin/admins/${id}`, {
      method: "DELETE",
      headers: extraHeaders,
    });
    setDeletingId(null);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      toast.error(body.error ?? "Failed to delete admin");
      return;
    }
    toast.success("Admin deleted.");
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

      {status === "loading" ? (
        <div aria-busy="true" aria-label="Loading admins" className="flex flex-col gap-3">
          {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse bg-ink/10" />
          ))}
        </div>
      ) : admins.length === 0 ? (
        <p className="font-body text-sm text-ink/60">No other admins yet.</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-ink/10">
              <th className="py-2 font-body text-sm font-medium text-ink/60">Admin</th>
              <th className="py-2 font-body text-sm font-medium text-ink/60">Added</th>
              <th className="py-2 text-right font-body text-sm font-medium text-ink/60">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="border-b border-ink/10">
                <td className="py-3">
                  <p className="font-body font-medium">{admin.display_name ?? admin.email}</p>
                  {admin.display_name && (
                    <p className="text-sm text-ink/60">{admin.email}</p>
                  )}
                </td>
                <td className="py-3 font-body text-sm text-ink/60">
                  {new Date(admin.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(admin.id)}
                    disabled={deletingId === admin.id}
                    className="text-sm text-brand-red underline disabled:opacity-50"
                  >
                    {deletingId === admin.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

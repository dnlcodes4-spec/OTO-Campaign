"use client";

import { useState } from "react";
import { AdminsManager } from "@/components/admin/AdminsManager";
import { ToastProvider } from "@/components/admin/ToastProvider";

export function DevAdminSetup() {
  const [setupKey, setSetupKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setUnlocked(true);
        }}
        className="flex max-w-sm flex-col gap-4"
      >
        <label className="flex flex-col gap-1 text-sm font-body">
          Setup key
          <input
            type="password"
            required
            value={setupKey}
            onChange={(event) => setSetupKey(event.target.value)}
            className="border border-ink/20 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="bg-brand-green px-6 py-3 text-sm font-body font-medium text-ink-inverse"
        >
          Continue
        </button>
      </form>
    );
  }

  return (
    <ToastProvider>
      <AdminsManager extraHeaders={{ "x-admin-setup-key": setupKey }} />
    </ToastProvider>
  );
}

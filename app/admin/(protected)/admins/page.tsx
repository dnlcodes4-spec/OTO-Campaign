import { AdminsManager } from "@/components/admin/AdminsManager";

export default function AdminAdminsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Admins</h1>
      <AdminsManager />
    </div>
  );
}

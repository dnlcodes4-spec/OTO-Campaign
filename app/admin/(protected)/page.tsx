import Link from "next/link";
import { getDashboardStats } from "@/lib/admin/dashboard-stats";

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-ink/10 bg-ink-inverse px-6 py-5">
      <p className="font-body text-sm text-ink/60">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function QuickLinkCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group border border-ink/10 bg-ink-inverse px-6 py-5 transition-colors hover:border-brand-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
    >
      <p className="font-display text-lg font-semibold text-ink transition-colors group-hover:text-brand-green">
        {title}
      </p>
      <p className="mt-1 font-body text-sm text-ink/60">{description}</p>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Admins" value={stats.admins} />
        <StatTile label="Photos" value={stats.images} />
        <StatTile label="Videos" value={stats.videos} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <QuickLinkCard
          href="/admin/admins"
          title="Manage admins"
          description="Add or remove who can access this console."
        />
        <QuickLinkCard
          href="/admin/gallery"
          title="Manage gallery"
          description="Upload photos and video, edit captions."
        />
      </div>
    </div>
  );
}

import Link from "next/link";
import { CONTENT_REGISTRY } from "@/content/schemas/registry";

export default function ContentListPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Content</h1>
      <ul className="flex flex-col gap-3">
        {Object.entries(CONTENT_REGISTRY).map(([key, entry]) => (
          <li key={key} className="border-b border-ink/10 pb-3">
            <Link href={`/admin/content/${key}`} className="font-body text-ink hover:text-brand-green">
              {entry.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

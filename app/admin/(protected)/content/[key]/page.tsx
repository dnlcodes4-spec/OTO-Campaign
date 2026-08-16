import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { CONTENT_REGISTRY } from "@/content/schemas/registry";

export default async function ContentEditorPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const entry = CONTENT_REGISTRY[key];
  if (!entry) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink">{entry.label}</h1>
      <ContentEditor contentKey={key} schema={entry.schema} label={entry.label} />
    </div>
  );
}

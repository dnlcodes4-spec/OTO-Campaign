import { createClient } from "@/lib/supabase/server";
import { isNextInternalSignal } from "@/lib/next-internal-errors";

/*
 * Every content key registered in content/schemas/registry.ts has a seeded
 * row in the oto_site_content table in production. For any field an admin
 * has ever saved, the database value wins over the *Default object in the
 * matching content/*.ts file — editing that file's defaults changes what an
 * empty/unseeded table falls back to, not what's currently live. The
 * *Default objects remain the schema-shape source of truth and the
 * first-boot fallback.
 */
export function deepMergeContent<T>(dbValue: unknown, fallback: T): T {
  if (dbValue === undefined || dbValue === null) return fallback;
  if (typeof dbValue !== "object" || Array.isArray(dbValue)) {
    return dbValue as T;
  }
  if (fallback === null || typeof fallback !== "object" || Array.isArray(fallback)) {
    return fallback;
  }

  const result: Record<string, unknown> = { ...(fallback as Record<string, unknown>) };
  for (const key of Object.keys(dbValue as Record<string, unknown>)) {
    result[key] = deepMergeContent(
      (dbValue as Record<string, unknown>)[key],
      (fallback as Record<string, unknown>)[key]
    );
  }
  return result as T;
}

export async function getSiteContent<T>(key: string, fallback: T): Promise<T> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("oto_site_content")
      .select("content")
      .eq("key", key)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error(`Failed to load oto_site_content (${key}):`, error);
      return fallback;
    }

    return deepMergeContent(data.content, fallback);
  } catch (error) {
    if (isNextInternalSignal(error)) throw error;
    console.error(`Failed to load oto_site_content (${key}):`, error);
    return fallback;
  }
}

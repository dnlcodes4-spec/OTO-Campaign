import { createClient } from "@/lib/supabase/server";
import { isNextInternalSignal } from "@/lib/next-internal-errors";

export function deepMergeContent<T>(dbValue: unknown, fallback: T): T {
  if (dbValue === undefined) return fallback;
  if (dbValue === null || typeof dbValue !== "object" || Array.isArray(dbValue)) {
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

/*
 * The project URL and publishable key ship into every client-side bundle
 * by design — "publishable" means safe to expose, unlike
 * SUPABASE_SERVICE_ROLE_KEY, which must never get this treatment.
 *
 * next/image's remotePatterns hit this same class of bug (see
 * next.config.ts): building a client bundle needs these values present at
 * `npm run build` time, not just in the running app's own process env, and
 * at least one production host in the wild doesn't propagate custom env
 * vars into its build step the same way it does the app's runtime process.
 * Falling back to the real values sidesteps that entirely.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://jgemycpdcmoebigmgorq.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_iJpna60G11IvxKb8FV_hAA_zqqHxMQZ";

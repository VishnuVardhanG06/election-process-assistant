// ─── Runtime configuration (server + client) ─────────────────────────────────
// Keys prefixed NEXT_PUBLIC_ are safe on client; others are server-only.

export const config = {
  // Google APIs
  googleCivicApiKey: process.env.GOOGLE_CIVIC_API_KEY ?? "",
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/auth/callback/google",

  // NextAuth
  nextAuthSecret: process.env.NEXTAUTH_SECRET ?? "dev-secret",
  nextAuthUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000",

  // Rate limiting
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 100),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900_000),

  // App meta
  appName: "Election Process Assistant",
  appVersion: "1.0.0",
} as const;

// ─── Google Civic API base URL ────────────────────────────────────────────────
export const CIVIC_API_BASE = "https://www.googleapis.com/civicinfo/v2";

// ─── Supported locales ────────────────────────────────────────────────────────
export const SUPPORTED_LOCALES = ["en", "es", "zh", "vi", "ko", "fr"] as const;
export const DEFAULT_LOCALE = "en" as const;

// ─── Cache TTLs (ms) ──────────────────────────────────────────────────────────
export const CACHE_TTL = {
  voterInfo: 5 * 60 * 1000,      // 5 minutes
  representatives: 10 * 60 * 1000, // 10 minutes
  pollingPlaces: 5 * 60 * 1000,
} as const;

// ─── Urgency threshold ────────────────────────────────────────────────────────
export const URGENT_DAYS_THRESHOLD = 7;

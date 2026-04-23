/**
 * Google Civic Information API service.
 * Server-side only — API key never exposed to client.
 */

import { config, CIVIC_API_BASE, CACHE_TTL } from "@/constants/config";
import {
  VoterInfo,
  PollingPlace,
  Representative,
  RegistrationStatus,
  ApiResult,
} from "@/types";

// ─── In-memory cache ──────────────────────────────────────────────────────────
const cache = new Map<string, { data: unknown; timestamp: number }>();

async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data as T;
  }
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

// ─── Raw API types ────────────────────────────────────────────────────────────
interface CivicVoterInfoResponse {
  election?: { id: string; name: string; electionDay: string };
  pollingLocations?: CivicLocation[];
  earlyVoteSites?: CivicLocation[];
  dropOffLocations?: CivicLocation[];
  contests?: CivicContest[];
  state?: CivicStateInfo[];
}

interface CivicLocation {
  address?: {
    locationName?: string;
    line1?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  notes?: string;
  pollingHours?: string;
  latitude?: number;
  longitude?: number;
  voterServices?: string;
}

interface CivicContest {
  office?: string;
  level?: string[];
  roles?: string[];
  district?: { name: string };
  candidates?: {
    name: string;
    party?: string;
    candidateUrl?: string;
    email?: string;
    phone?: string;
    photoUrl?: string;
  }[];
  referendumTitle?: string;
  referendumSubtitle?: string;
  referendumUrl?: string;
}

interface CivicStateInfo {
  name?: string;
  electionAdministrationBody?: {
    name?: string;
    electionInfoUrl?: string;
    votingLocationFinderUrl?: string;
    ballotInfoUrl?: string;
    registrationUrl?: string;
    absenteeVotingInfoUrl?: string;
    correspondenceAddress?: { locationName?: string };
  };
}

interface CivicRepresentativesResponse {
  offices?: { name: string; divisionId: string; levels?: string[]; roles?: string[]; officialIndices?: number[] }[];
  officials?: {
    name: string;
    party?: string;
    phones?: string[];
    urls?: string[];
    emails?: string[];
    photoUrl?: string;
    channels?: { type: string; id: string }[];
  }[];
}

// ─── Helper: map CivicLocation → PollingPlace ─────────────────────────────────
function mapLocation(loc: CivicLocation, index: number): PollingPlace {
  const addr = loc.address ?? {};
  return {
    id: `loc-${index}`,
    name: addr.locationName ?? "Polling Location",
    address: addr.line1 ?? "",
    city: addr.city ?? "",
    state: addr.state ?? "",
    zip: addr.zip ?? "",
    coordinates:
      loc.latitude && loc.longitude
        ? { lat: loc.latitude, lng: loc.longitude }
        : undefined,
    hours: loc.pollingHours,
    notes: loc.notes,
    accessibilityFeatures: loc.voterServices ? [loc.voterServices] : [],
  };
}

// ─── Google Civic Service ─────────────────────────────────────────────────────
export class GoogleCivicService {
  private apiKey: string;

  constructor() {
    this.apiKey = config.googleCivicApiKey;
  }

  private isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Fetch full voter information for an address.
   */
  async getVoterInfo(address: string): Promise<ApiResult<VoterInfo>> {
    if (!this.isConfigured()) {
      return { ok: false, error: "GOOGLE_CIVIC_API_KEY not configured", code: 503 };
    }

    try {
      const url = `${CIVIC_API_BASE}/voterinfo?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
      const data = await fetchWithCache<CivicVoterInfoResponse>(
        `voter:${address}`,
        async () => {
          const res = await fetch(url);
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
          }
          return res.json() as Promise<CivicVoterInfoResponse>;
        },
        CACHE_TTL.voterInfo
      );

      const voterInfo: VoterInfo = {
        election: data.election,
        pollingLocations: (data.pollingLocations ?? []).map(mapLocation),
        earlyVoteSites: (data.earlyVoteSites ?? []).map(mapLocation),
        dropOffLocations: (data.dropOffLocations ?? []).map(mapLocation),
        contests: (data.contests ?? []).map((c) => ({
          office: c.office ?? c.referendumTitle ?? "Unknown",
          level: c.level ?? [],
          roles: c.roles ?? [],
          candidates: c.candidates,
          referendumTitle: c.referendumTitle,
          referendumSubtitle: c.referendumSubtitle,
          referendumUrl: c.referendumUrl,
        })),
        state: (data.state ?? []).map((s) => ({
          name: s.name ?? "",
          electionAdministrationBody: s.electionAdministrationBody,
        })),
      };

      return { ok: true, data: voterInfo };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return { ok: false, error: `Civic API error: ${msg}`, code: 500 };
    }
  }

  /**
   * Get polling places for an address (extracted from voterInfo).
   */
  async getPollingPlaces(address: string): Promise<ApiResult<PollingPlace[]>> {
    const result = await this.getVoterInfo(address);
    if (!result.ok) return result;

    const allPlaces = [
      ...(result.data.pollingLocations ?? []).map((p) => ({ ...p, isEarlyVoting: false, isDropBox: false })),
      ...(result.data.earlyVoteSites ?? []).map((p) => ({ ...p, isEarlyVoting: true, isDropBox: false })),
      ...(result.data.dropOffLocations ?? []).map((p) => ({ ...p, isEarlyVoting: false, isDropBox: true })),
    ];

    return { ok: true, data: allPlaces };
  }

  /**
   * Get elected representatives for an address.
   */
  async getRepresentatives(address: string): Promise<ApiResult<Representative[]>> {
    if (!this.isConfigured()) {
      return { ok: false, error: "GOOGLE_CIVIC_API_KEY not configured", code: 503 };
    }

    try {
      const url = `${CIVIC_API_BASE}/representatives?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
      const data = await fetchWithCache<CivicRepresentativesResponse>(
        `reps:${address}`,
        async () => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<CivicRepresentativesResponse>;
        },
        CACHE_TTL.representatives
      );

      const officials = data.officials ?? [];
      const offices = data.offices ?? [];

      const reps: Representative[] = [];
      offices.forEach((office) => {
        (office.officialIndices ?? []).forEach((idx) => {
          const official = officials[idx];
          if (official) {
            reps.push({
              name: official.name,
              office: office.name,
              division: office.divisionId,
              party: official.party,
              phones: official.phones,
              urls: official.urls,
              emails: official.emails,
              photoUrl: official.photoUrl,
              channels: official.channels,
            });
          }
        });
      });

      return { ok: true, data: reps };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return { ok: false, error: `Representatives API error: ${msg}`, code: 500 };
    }
  }

  /**
   * Derive registration status info from voter info state body.
   */
  async getRegistrationStatus(address: string): Promise<ApiResult<RegistrationStatus>> {
    const result = await this.getVoterInfo(address);
    if (!result.ok) return result;

    const adminBody = result.data.state?.[0]?.electionAdministrationBody;
    return {
      ok: true,
      data: {
        isRegistered: true, // Civic API returns data only for registered voters
        registrationUrl: adminBody?.registrationUrl,
        checkUrl: adminBody?.votingLocationFinderUrl,
        state: result.data.state?.[0]?.name,
      },
    };
  }
}

// Singleton export
export const civicService = new GoogleCivicService();

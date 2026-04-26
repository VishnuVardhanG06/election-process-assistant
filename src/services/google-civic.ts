/**
 * Google Civic Information API service.
 * Server-side only — API key never exposed to client.
 * Falls back to rich demo data when API key is not configured.
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

// ─── Mock / Demo Data (used when API key is not configured) ───────────────────
function getMockVoterInfo(address: string): VoterInfo {
  const electionDay = new Date();
  electionDay.setDate(electionDay.getDate() + 33);
  const electionDayStr = electionDay.toISOString().split("T")[0];

  return {
    election: {
      id: "demo-2026",
      name: "2026 General Primary Election",
      electionDay: electionDayStr,
    },
    pollingLocations: getMockPollingPlaces(),
    earlyVoteSites: [
      {
        id: "early-1",
        name: "City Hall Early Voting Center",
        address: "100 City Hall Plaza",
        city: "Springfield",
        state: "CA",
        zip: "90210",
        coordinates: { lat: 34.052, lng: -118.244 },
        hours: "Mon–Sat 9 AM – 5 PM",
        isEarlyVoting: true,
        isDropBox: false,
        accessibilityFeatures: ["Wheelchair Accessible", "Accessible Parking"],
      },
    ],
    dropOffLocations: [
      {
        id: "drop-1",
        name: "Library Drop Box",
        address: "250 West Adams Blvd",
        city: "Springfield",
        state: "CA",
        zip: "90210",
        coordinates: { lat: 34.049, lng: -118.261 },
        hours: "24/7",
        isEarlyVoting: false,
        isDropBox: true,
        accessibilityFeatures: ["Exterior Drop Box"],
      },
    ],
    contests: [
      {
        office: "Governor",
        level: ["administrativeArea1"],
        roles: ["headOfGovernment"],
        candidates: [
          { name: "Alexandra Rivera", party: "Democratic", candidateUrl: "https://vote.gov" },
          { name: "Marcus Thompson", party: "Republican", candidateUrl: "https://vote.gov" },
          { name: "Priya Patel", party: "Green", candidateUrl: "https://vote.gov" },
        ],
      },
      {
        office: "U.S. Senator",
        level: ["country"],
        roles: ["legislatorUpperBody"],
        candidates: [
          { name: "Samantha Lee", party: "Democratic", candidateUrl: "https://vote.gov" },
          { name: "Robert Chen", party: "Republican", candidateUrl: "https://vote.gov" },
        ],
      },
      {
        office: "U.S. Representative — District 28",
        level: ["country"],
        roles: ["legislatorLowerBody"],
        candidates: [
          { name: "David Okafor", party: "Democratic", candidateUrl: "https://vote.gov" },
          { name: "Maria Santos", party: "Republican", candidateUrl: "https://vote.gov" },
        ],
      },
      {
        office: "Measure A — Library Bond (Local)",
        level: ["locality"],
        roles: ["referendum"],
        referendumTitle: "Measure A — Library Renovation Bond",
        referendumSubtitle: "Shall the City issue $50M in bonds to renovate public libraries?",
        referendumUrl: "https://vote.gov",
      },
    ],
    state: [
      {
        name: "California",
        electionAdministrationBody: {
          name: "CA Secretary of State",
          electionInfoUrl: "https://www.sos.ca.gov/elections",
          votingLocationFinderUrl: "https://voterstatus.sos.ca.gov",
          ballotInfoUrl: "https://voterguide.sos.ca.gov",
          registrationUrl: "https://registertovote.ca.gov",
          absenteeVotingInfoUrl: "https://www.sos.ca.gov/elections/voter-registration/vbm",
        },
      },
    ],
  };
}

function getMockPollingPlaces(): PollingPlace[] {
  return [
    {
      id: "poll-1",
      name: "Sunshine Community Center",
      address: "1234 Maple Street",
      city: "Springfield",
      state: "CA",
      zip: "90210",
      coordinates: { lat: 34.0522, lng: -118.2437 },
      hours: "7:00 AM – 8:00 PM",
      notes: "Main polling place for Precinct 42",
      isEarlyVoting: false,
      isDropBox: false,
      accessibilityFeatures: ["Wheelchair Accessible", "Accessible Parking", "Audio Ballots"],
    },
    {
      id: "poll-2",
      name: "Oak Park Recreation Center",
      address: "890 Oak Park Drive",
      city: "Springfield",
      state: "CA",
      zip: "90211",
      coordinates: { lat: 34.0595, lng: -118.2681 },
      hours: "7:00 AM – 8:00 PM",
      notes: "Serves Precincts 43 and 44",
      isEarlyVoting: false,
      isDropBox: false,
      accessibilityFeatures: ["Wheelchair Accessible", "Accessible Restrooms"],
    },
    {
      id: "poll-3",
      name: "City Hall Early Voting Center",
      address: "100 City Hall Plaza",
      city: "Springfield",
      state: "CA",
      zip: "90210",
      coordinates: { lat: 34.0465, lng: -118.2556 },
      hours: "Mon–Sat 9 AM – 5 PM",
      isEarlyVoting: true,
      isDropBox: false,
      accessibilityFeatures: ["Fully Accessible", "Free Parking", "Curbside Voting"],
    },
    {
      id: "poll-4",
      name: "Westside Library Drop Box",
      address: "250 West Adams Blvd",
      city: "Springfield",
      state: "CA",
      zip: "90210",
      coordinates: { lat: 34.0491, lng: -118.2608 },
      hours: "Available 24/7",
      isEarlyVoting: false,
      isDropBox: true,
      accessibilityFeatures: ["Exterior Drop Box", "Well Lit"],
    },
  ];
}

function getMockRepresentatives(): Representative[] {
  return [
    {
      name: "Joseph R. Biden",
      office: "President of the United States",
      division: "ocd-division/country:us",
      party: "Democratic",
      phones: ["(202) 456-1111"],
      urls: ["https://www.whitehouse.gov"],
      emails: [],
      channels: [{ type: "Twitter", id: "POTUS" }, { type: "YouTube", id: "whitehouse" }],
    },
    {
      name: "Kamala D. Harris",
      office: "Vice President of the United States",
      division: "ocd-division/country:us",
      party: "Democratic",
      phones: ["(202) 456-1414"],
      urls: ["https://www.whitehouse.gov/vice-president"],
      emails: [],
      channels: [{ type: "Twitter", id: "VP" }],
    },
    {
      name: "Samantha Lee",
      office: "U.S. Senator (Class II)",
      division: "ocd-division/country:us/state:ca",
      party: "Democratic",
      phones: ["(202) 224-3553"],
      urls: ["https://www.senate.gov"],
      emails: ["senator@senate.gov"],
      channels: [{ type: "Twitter", id: "SenatorLee" }, { type: "Facebook", id: "SenatorLee" }],
    },
    {
      name: "Robert Chen",
      office: "U.S. Senator (Class III)",
      division: "ocd-division/country:us/state:ca",
      party: "Republican",
      phones: ["(202) 224-3841"],
      urls: ["https://www.senate.gov"],
      emails: [],
      channels: [{ type: "Twitter", id: "SenChen" }],
    },
    {
      name: "David Okafor",
      office: "U.S. Representative, District 28",
      division: "ocd-division/country:us/state:ca/cd:28",
      party: "Democratic",
      phones: ["(202) 225-5765"],
      urls: ["https://www.house.gov"],
      emails: ["rep.okafor@house.gov"],
      channels: [{ type: "Twitter", id: "RepOkafor" }],
    },
    {
      name: "Alexandra Rivera",
      office: "Governor of California",
      division: "ocd-division/country:us/state:ca",
      party: "Democratic",
      phones: ["(916) 445-2841"],
      urls: ["https://www.gov.ca.gov"],
      emails: [],
      channels: [{ type: "Twitter", id: "CAGovernor" }, { type: "Facebook", id: "GovernorCA" }],
    },
    {
      name: "Kevin Liu",
      office: "State Assembly Member, District 54",
      division: "ocd-division/country:us/state:ca/sldl:54",
      party: "Democratic",
      phones: ["(916) 319-2054"],
      urls: ["https://www.assembly.ca.gov"],
      emails: ["assemblymember.liu@assembly.ca.gov"],
      channels: [{ type: "Twitter", id: "AsmLiu" }],
    },
    {
      name: "Maria Santos",
      office: "Springfield City Council — District 3",
      division: "ocd-division/country:us/state:ca/place:springfield",
      party: "Non-Partisan",
      phones: ["(310) 555-0189"],
      urls: ["https://www.springfield.gov"],
      emails: ["maria.santos@springfield.gov"],
      channels: [],
    },
  ];
}

function getMockRegistrationStatus(): RegistrationStatus {
  return {
    isRegistered: true,
    registrationUrl: "https://registertovote.ca.gov",
    checkUrl: "https://voterstatus.sos.ca.gov",
    state: "California",
  };
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
      return { ok: true, data: getMockVoterInfo(address) };
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
      return { ok: true, data: getMockRepresentatives() };
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
    if (!this.isConfigured()) {
      return { ok: true, data: getMockRegistrationStatus() };
    }

    const result = await this.getVoterInfo(address);
    if (!result.ok) return result;

    const adminBody = result.data.state?.[0]?.electionAdministrationBody;
    return {
      ok: true,
      data: {
        isRegistered: true,
        registrationUrl: adminBody?.registrationUrl,
        checkUrl: adminBody?.votingLocationFinderUrl,
        state: result.data.state?.[0]?.name,
      },
    };
  }
}

// Singleton export
export const civicService = new GoogleCivicService();

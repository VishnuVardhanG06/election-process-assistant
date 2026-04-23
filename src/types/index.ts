// ─── Location & User ─────────────────────────────────────────────────────────
export interface UserLocation {
  country: string;
  state?: string;
  city?: string;
  zip?: string;
  fullAddress?: string;
}

export type ElectionType = "national" | "state" | "local" | "primary";
export type UserRole = "voter" | "candidate" | "poll_worker" | "researcher";
export type RegistrationStatusValue = "registered" | "not_registered" | "unknown";
export type DisclosureLevel = "brief" | "detailed" | "complete";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  intent?: string;
  suggestedActions?: SuggestedAction[];
  disclosureLevel?: DisclosureLevel;
}

export interface UserContext {
  location: UserLocation;
  electionType: ElectionType;
  userRole: UserRole;
  registrationStatus: RegistrationStatusValue;
  conversationHistory: Message[];
  detectedIntent: string;
  upcomingElections: string[];
  daysUntilDeadline: number | null;
  disclosureLevel: DisclosureLevel;
}

export interface UserPreferences {
  hasConsent: boolean;
  dataRetention: "session" | "30days" | "never";
  analyticsOptIn: boolean;
  language: SupportedLocale;
  highContrast: boolean;
  reducedMotion: boolean;
}

// ─── Actions & Navigation ─────────────────────────────────────────────────────
export interface SuggestedAction {
  id: string;
  label: string;
  query: string;
  icon?: string;
}

export interface QuickAction {
  id: string;
  icon: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
  urgent?: boolean;
}

export interface ActionPlan {
  type: "urgent_deadline" | "registration" | "educational" | "polling";
  priority: number;
  nextStep: string;
  actions: QuickAction[];
}

// ─── Election Data ────────────────────────────────────────────────────────────
export interface ElectionDeadline {
  id: string;
  title: string;
  description: string;
  date: string; // ISO 8601
  type: "registration" | "early_voting" | "election_day" | "absentee" | "runoff";
  daysUntil: number;
  urgent: boolean; // < 7 days
  url?: string;
}

export interface PollingPlace {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  coordinates?: { lat: number; lng: number };
  hours?: string;
  notes?: string;
  isEarlyVoting?: boolean;
  isDropBox?: boolean;
  accessibilityFeatures?: string[];
}

export interface Contest {
  office: string;
  level: string[];
  roles: string[];
  candidates?: Candidate[];
  referendumTitle?: string;
  referendumSubtitle?: string;
  referendumUrl?: string;
}

export interface Candidate {
  name: string;
  party?: string;
  candidateUrl?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
}

export interface RegistrationStatus {
  isRegistered: boolean;
  deadline?: string;
  registrationUrl?: string;
  checkUrl?: string;
  state?: string;
}

export interface VoterInfo {
  election?: {
    id: string;
    name: string;
    electionDay: string;
  };
  pollingLocations?: PollingPlace[];
  earlyVoteSites?: PollingPlace[];
  dropOffLocations?: PollingPlace[];
  contests?: Contest[];
  state?: {
    name: string;
    electionAdministrationBody?: {
      name?: string;
      electionInfoUrl?: string;
      votingLocationFinderUrl?: string;
      ballotInfoUrl?: string;
      registrationUrl?: string;
      absenteeVotingInfoUrl?: string;
      correspondenceAddress?: { locationName?: string };
    };
  }[];
}

export interface Representative {
  name: string;
  office: string;
  division: string;
  party?: string;
  phones?: string[];
  urls?: string[];
  emails?: string[];
  photoUrl?: string;
  channels?: { type: string; id: string }[];
}

// ─── Calendar & Drive ─────────────────────────────────────────────────────────
export interface CalendarEvent {
  id?: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  reminders?: { method: "popup" | "email"; minutes: number }[];
  htmlLink?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
}

// ─── API Response wrappers ────────────────────────────────────────────────────
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
  code?: number;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

// ─── i18n ─────────────────────────────────────────────────────────────────────
export type SupportedLocale = "en" | "es" | "zh" | "vi" | "ko" | "fr";

# 🗳️ Election Process Assistant

A production-grade, **AI-powered election guide** built with Next.js 16. Helps voters navigate the entire election process — registration, polling places, deadlines, ballot information, and representatives — through a conversational interface and interactive tools.

**🟢 Fully functional in Demo Mode — no API keys required.** All pages auto-load rich sample data on first visit. Enter your real address at any time to fetch live data.

🚀 **Live Demo:** [election-process-assistant-production.up.railway.app](https://election-process-assistant-production.up.railway.app)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 💬 **AI Chat Assistant** | 15-intent NLP engine with progressive disclosure (Brief / Detailed / Complete) |
| 📝 **Voter Registration** | Auto-loads demo registration status; live data via Google Civic API with your key |
| 📍 **Polling Place Map** | 4 demo locations shown instantly; OpenStreetMap iframe fallback (no Maps key needed) |
| 📅 **Election Timeline** | Countdown deadlines with Google Calendar sync and .ics download |
| 🏛️ **Representatives** | 8 demo officials grouped by Federal/State/Local; party color badges; contact links |
| 📋 **Voter Guide** | Full demo ballot (Governor, Senator, Rep, Measure A); save to Google Drive |
| 🌐 **Multi-Language** | 6 languages with instant switching: English, Español, 中文, Tiếng Việt, 한국어, Français |
| ♿ **WCAG 2.1 AA** | Skip links, ARIA live regions, focus traps, keyboard navigation |

---

## 🎭 Demo Mode

All pages show realistic sample data immediately — no address required and no API keys needed.

| Page | Demo Data Shown |
|------|----------------|
| `/voter` | Jane Smith, registered ✅, Springfield CA, Nov 5 2024 General Election |
| `/polling-places` | 4 locations: Community Center, Recreation Center, City Hall, Library Drop Box |
| `/representatives` | 8 officials: President, Senators, Rep (CA-28), Governor, State Legislators |
| `/guide` | Governor race (3 candidates), U.S. Senator, Representative, Measure A |

A yellow **📌 Demo Mode** banner appears on each page. Enter your real address to switch to live data.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- npm

### 1. Install dependencies
```bash
npm install --legacy-peer-deps
```

> ℹ️ The `--legacy-peer-deps` flag is required because `next-intl@3.x` has a peer dependency on Next.js ≤15, but this project uses Next.js 16. The `.npmrc` file handles this automatically in CI/CD.

### 2. Configure environment variables (optional for demo)
```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys to enable live data:

```env
# Google Civic Information API (voter info, polling places, representatives)
GOOGLE_CIVIC_API_KEY=your_key_here

# Google Maps JavaScript API (interactive polling place map)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here

# Google OAuth (Calendar + Drive sync)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# NextAuth (required for production)
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000
```

> **Note:** The app works fully in Demo Mode without any API keys. Features gracefully degrade with friendly "Demo Mode" feedback when keys are absent.

### 3. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/
│   │   ├── chat/           # Chat endpoint (rate-limited, Zod validated)
│   │   ├── voter-info/     # Civic API proxy with mock fallback
│   │   ├── polling-places/ # Polling location data with mock fallback
│   │   ├── representatives/# Elected officials with mock fallback
│   │   ├── calendar/       # Calendar events + ICS download (demo mode)
│   │   ├── drive/          # Voter guide → Google Drive (demo mode)
│   │   └── auth/           # NextAuth Google OAuth
│   ├── page.tsx            # Home dashboard
│   ├── chat/               # Full-page chat
│   ├── voter/              # Registration page (auto-loads demo)
│   ├── polling-places/     # Map page (auto-loads demo)
│   ├── timeline/           # Deadline timeline
│   ├── representatives/    # Officials page (auto-loads demo)
│   └── guide/              # Voter guide + Drive save (auto-loads demo)
├── components/
│   ├── common/             # Button, Input, Modal, Badge, ErrorBoundary…
│   ├── features/           # Domain feature components
│   └── layouts/            # Navigation (i18n-aware sidebar + bottom nav)
├── contexts/               # UserContext, PreferencesContext (language persistence)
├── hooks/
│   ├── useTranslation.ts   # Instant language switching hook (6 languages)
│   ├── useChat.ts          # Chat state management
│   ├── useVoterInfo.ts     # Voter registration state
│   └── useGeolocation.ts   # Browser geolocation
├── services/
│   ├── google-civic.ts     # Civic API client + rich mock data fallbacks
│   ├── google-maps.ts      # Maps JS API loader (with OSM fallback)
│   └── decision-engine.ts  # Built-in NLP engine (no external AI needed)
├── types/                  # TypeScript type definitions
└── i18n/messages/          # Translation files (6 languages)
```

---

## 🚢 Deployment (Railway)

The project is pre-configured for Railway via `railway.json`.

### Quick Deploy
1. Fork or push to GitHub
2. Connect to [Railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Railway auto-detects the Next.js project

### Required Environment Variables on Railway

| Variable | Value |
|----------|-------|
| `NEXTAUTH_SECRET` | Any random string (e.g. `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your Railway domain (e.g. `https://your-app.up.railway.app`) |

Optional (for live data features):

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CIVIC_API_KEY` | Real voter/polling/rep data |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps instead of OpenStreetMap |
| `GOOGLE_CLIENT_ID` | Google OAuth sign-in |
| `GOOGLE_CLIENT_SECRET` | Google OAuth sign-in |

### How Railway Builds
- **Install:** Railpack auto-runs `npm ci` (`.npmrc` provides `legacy-peer-deps=true`)
- **Build:** `npm run build` (set in `railway.json`)
- **Start:** `npm start` → `next start -H 0.0.0.0 -p ${PORT:-3000}`
- **Node version:** 22 (via Railpack)

---

## 🔧 Getting Google API Keys (Optional)

### Google Civic Information API
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Google Civic Information API**
3. Create an API key → restrict to Civic Information API
4. Add to `.env.local` as `GOOGLE_CIVIC_API_KEY`

### Google Maps JavaScript API
1. Same Google Cloud project
2. Enable **Maps JavaScript API**
3. Restrict to your domain
4. Add as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Google OAuth (Calendar + Drive)
1. Enable **Google Calendar API** and **Google Drive API**
2. Create OAuth 2.0 credentials (Web application)
3. Add `https://your-domain/api/auth/callback/google` as redirect URI
4. Add Client ID and Secret to `.env.local`

---

## 🌍 Internationalization

Language switching is instant — no page reload required. The selected language persists across sessions via `localStorage`. Message files are in `src/i18n/messages/`.

| Code | Language |
|------|----------|
| `en` | English (default) |
| `es` | Español |
| `zh` | 中文 (Chinese) |
| `vi` | Tiếng Việt (Vietnamese) |
| `ko` | 한국어 (Korean) |
| `fr` | Français (French) |

The `useTranslation` hook bundles all 6 language JSONs statically — no async loading.

---

## 🧪 Testing

```bash
npm test                   # Run all unit tests
npm test -- --coverage     # With coverage report
npm test -- --watch        # Watch mode
```

Tests are in `src/tests/`. The decision engine has 12 unit tests covering intent classification, response generation, progressive disclosure, and urgency detection.

---

## 🔒 Security

- Google Civic API key is **server-side only** (never sent to browser)
- Rate limiting: 100 requests per 15 minutes on `/api/chat`
- All inputs validated with **Zod** schemas
- Google OAuth scopes are minimal: `calendar.events` and `drive.file` only
- `NEXTAUTH_SECRET` required for session signing in production
- Demo mode bypasses OAuth — no credentials are ever stored

---

## ♿ Accessibility

- WCAG 2.1 AA compliant
- Skip-to-main-content link
- ARIA live regions for dynamic content updates
- Focus trap in modals
- Arrow-key navigation in list components
- Minimum 44×44px touch targets
- Reduced-motion support (`prefers-reduced-motion`)
- High-contrast mode support

---

## 📜 License

MIT — Non-partisan. Not affiliated with any political party or government agency. Information is for general guidance only — always verify with your local elections authority.

**Official resources:**
- [vote.gov](https://vote.gov) — Official U.S. voting information
- [vote.org](https://vote.org) — Voter registration and tools
- [ballotpedia.org](https://ballotpedia.org) — Candidate research

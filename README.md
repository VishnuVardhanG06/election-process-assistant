# 🗳️ Election Process Assistant

A production-grade, **AI-powered election guide** built with Next.js 16. Helps voters navigate the entire election process — registration, polling places, deadlines, ballot information, and representatives — through a conversational interface and interactive tools.

**No external AI API required.** The assistant runs entirely on a built-in rule-based NLP + decision tree engine.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 💬 **AI Chat Assistant** | 15-intent NLP engine with progressive disclosure (Brief / Detailed / Complete) |
| 📝 **Voter Registration** | Live registration status via Google Civic Information API |
| 📍 **Polling Place Map** | Google Maps with dark theme, AdvancedMarkerElement, and directions |
| 📅 **Election Timeline** | Countdown deadlines with Google Calendar sync and .ics download |
| 🏛️ **Representatives** | Elected officials at all government levels with contact info |
| 📋 **Voter Guide** | Personalized ballot with candidates and measures; save to Google Drive |
| 🌐 **Multi-Language** | 6 languages: English, Español, 中文, Tiếng Việt, 한국어, Français |
| ♿ **WCAG 2.1 AA** | Skip links, ARIA live regions, focus traps, keyboard navigation |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Install dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Configure environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:

```env
# Google Civic Information API (for voter info, polling places, representatives)
GOOGLE_CIVIC_API_KEY=your_key_here

# Google Maps JavaScript API (for interactive polling place map)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here

# Google OAuth (for Calendar + Drive features)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# NextAuth
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000
```

> **Note:** The app runs without API keys — the chat assistant and timeline work fully out of the box. API key features show a friendly "not configured" message.

### 3. Run development server
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
│   │   ├── voter-info/     # Civic API proxy
│   │   ├── polling-places/ # Polling location data
│   │   ├── representatives/# Elected officials
│   │   ├── calendar/       # Calendar events + ICS download
│   │   ├── drive/          # Voter guide → Google Drive
│   │   └── auth/           # NextAuth Google OAuth
│   ├── page.tsx            # Home dashboard
│   ├── chat/               # Full-page chat
│   ├── voter/              # Registration page
│   ├── polling-places/     # Map page
│   ├── timeline/           # Deadline timeline
│   ├── representatives/    # Officials page
│   └── guide/              # Voter guide + Drive save
├── components/
│   ├── common/             # Button, Input, Modal, Badge, ErrorBoundary…
│   ├── features/           # Domain feature components
│   └── layouts/            # Navigation components
├── contexts/               # UserContext, PreferencesContext
├── hooks/                  # useChat, useVoterInfo, useGeolocation…
├── services/               # Decision engine, Google API clients
├── types/                  # TypeScript type definitions
└── i18n/messages/          # Translation files (6 languages)
```

---

## 🔧 Getting Google API Keys

### Google Civic Information API
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Google Civic Information API**
3. Create an API key → restrict to Civic Information API
4. Add to `.env.local` as `GOOGLE_CIVIC_API_KEY`

### Google Maps JavaScript API
1. Same Google Cloud project
2. Enable **Maps JavaScript API**
3. Restrict to your domain (localhost:3000 for dev)
4. Add as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Google OAuth (Calendar + Drive)
1. Enable **Google Calendar API** and **Google Drive API**
2. Create OAuth 2.0 credentials (Web application)
3. Add `http://localhost:3000/api/auth/callback/google` as redirect URI
4. Add Client ID and Secret to `.env.local`

---

## 🧪 Testing

```bash
npm test                   # Run all unit tests
npm test -- --coverage     # With coverage report
npm test -- --watch        # Watch mode
```

Tests are located in `src/tests/`. The decision engine has 12 unit tests covering intent classification, response generation, progressive disclosure, and urgency detection.

---

## 🔒 Security

- Google Civic API key is **server-side only** (never sent to browser)
- Rate limiting: 100 requests per 15 minutes on `/api/chat`
- All inputs validated with **Zod** schemas
- Google OAuth scopes are minimal: `calendar.events` and `drive.file` only
- NEXTAUTH_SECRET required for session signing

---

## 🌍 Internationalization

The app supports 6 languages via the language selector in the sidebar. Message files are in `src/i18n/messages/`:

| Code | Language |
|------|----------|
| `en` | English (default) |
| `es` | Español |
| `zh` | 中文 (Chinese) |
| `vi` | Tiếng Việt (Vietnamese) |
| `ko` | 한국어 (Korean) |
| `fr` | Français (French) |

---

## ♿ Accessibility

- WCAG 2.1 AA compliant
- Skip-to-main-content link
- ARIA live regions for dynamic content
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

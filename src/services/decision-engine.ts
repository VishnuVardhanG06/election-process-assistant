/**
 * Decision Engine — Smart rule-based NLP + decision tree conversational assistant.
 * No external AI API required. Uses intent classification, context-aware routing,
 * and progressive disclosure to guide users through the election process.
 */

import {
  UserContext,
  Message,
  SuggestedAction,
  DisclosureLevel,
  RegistrationStatusValue,
} from "@/types";
import { URGENT_DAYS_THRESHOLD } from "@/constants/config";
import { differenceInDays, parseISO, isAfter } from "date-fns";
import { v4 as uuidv4 } from "uuid";

// ─── Intent Types ─────────────────────────────────────────────────────────────
export type Intent =
  | "registration_check"
  | "registration_how"
  | "polling_place"
  | "election_day"
  | "early_voting"
  | "absentee_mail"
  | "voter_id"
  | "candidates_ballot"
  | "deadlines"
  | "representatives"
  | "process_general"
  | "who_can_vote"
  | "accessibility"
  | "help_getting_help"
  | "greeting"
  | "unknown";

// ─── Pattern Map ──────────────────────────────────────────────────────────────
const INTENT_PATTERNS: { intent: Intent; patterns: RegExp[] }[] = [
  {
    intent: "greeting",
    patterns: [/^(hi|hello|hey|howdy|good\s*(morning|afternoon|evening))\b/i],
  },
  {
    intent: "registration_check",
    patterns: [
      /am i (registered|register)/i,
      /check.*registr/i,
      /registr.*status/i,
      /verify.*registr/i,
    ],
  },
  {
    intent: "registration_how",
    patterns: [
      /how (do i|to|can i) (register|sign up)/i,
      /register to vote/i,
      /how.*register/i,
      /registr.*process/i,
    ],
  },
  {
    intent: "polling_place",
    patterns: [
      /where (do i|can i|should i) vote/i,
      /polling (place|location|site|station)/i,
      /where is my.*(poll|vote)/i,
      /find.*poll/i,
    ],
  },
  {
    intent: "election_day",
    patterns: [
      /when is (the )?(election|election day|vote)/i,
      /election day/i,
      /when (do|can) (i|we) vote/i,
    ],
  },
  {
    intent: "early_voting",
    patterns: [
      /early vot/i,
      /vote (before|early)/i,
      /in-person (absentee|early)/i,
    ],
  },
  {
    intent: "absentee_mail",
    patterns: [
      /absentee/i,
      /mail(-|\s)in/i,
      /vote by mail/i,
      /ballot by mail/i,
      /postal vote/i,
    ],
  },
  {
    intent: "voter_id",
    patterns: [
      /voter id/i,
      /what id/i,
      /identification.*vote/i,
      /need.*id.*vote/i,
      /do i need (an? )?(id|identification)/i,
    ],
  },
  {
    intent: "candidates_ballot",
    patterns: [
      /who.*on (my )?ballot/i,
      /candidates/i,
      /what.*on (my )?ballot/i,
      /ballot measures/i,
      /propositions/i,
      /referend/i,
    ],
  },
  {
    intent: "deadlines",
    patterns: [
      /deadline/i,
      /important dates/i,
      /by when/i,
      /last day/i,
      /cutoff/i,
      /when.*register/i,
    ],
  },
  {
    intent: "representatives",
    patterns: [
      /my representative/i,
      /who (represents|is my)/i,
      /elected official/i,
      /congress(man|woman|person)/i,
      /senator/i,
      /mayor/i,
    ],
  },
  {
    intent: "who_can_vote",
    patterns: [
      /who can vote/i,
      /eligib/i,
      /can i vote/i,
      /am i eligible/i,
      /requirements.*vote/i,
    ],
  },
  {
    intent: "accessibility",
    patterns: [
      /accessibility/i,
      /wheelchair/i,
      /disabilit/i,
      /assistance.*vot/i,
      /help.*poll/i,
    ],
  },
  {
    intent: "help_getting_help",
    patterns: [
      /help/i,
      /what can you do/i,
      /how does this work/i,
      /what do you know/i,
    ],
  },
  {
    intent: "process_general",
    patterns: [
      /how does voting work/i,
      /election process/i,
      /how.*election/i,
      /voting process/i,
      /steps to vote/i,
    ],
  },
];

// ─── Response Templates ───────────────────────────────────────────────────────
interface ResponseTemplate {
  brief: string;
  detailed: string;
  complete: string;
  suggestedActions: SuggestedAction[];
}

function buildTemplates(ctx: UserContext): Record<Intent, ResponseTemplate> {
  const state = ctx.location.state || "your state";
  const daysLeft = ctx.daysUntilDeadline;
  const isRegistered = ctx.registrationStatus === "registered";
  const deadlineWarning =
    daysLeft !== null && daysLeft <= URGENT_DAYS_THRESHOLD
      ? ` ⚠️ **Only ${daysLeft} days left to register!**`
      : "";

  return {
    greeting: {
      brief: `👋 Hi there! I'm your Election Assistant. I can help you with voter registration, finding your polling place, election deadlines, and more. What would you like to know?`,
      detailed: `👋 Hello and welcome! I'm your smart Election Process Assistant. Here's what I can help you with:\n\n• **Check or complete your voter registration**\n• **Find your polling place** and get directions\n• **Track important deadlines** and add them to your calendar\n• **View your sample ballot** and learn about candidates\n• **Find your elected representatives**\n\nWhat would you like to start with?`,
      complete: `👋 Welcome to the Election Process Assistant!\n\nI'm here to guide you through every step of the democratic process — completely non-partisan and always accurate. Here's a full overview of what I can help with:\n\n**Registration**\n- Check your current registration status\n- Walk you through how to register in ${state}\n- Alert you to upcoming registration deadlines\n\n**Voting**\n- Find your specific polling place\n- Explain early voting and mail-in ballot options\n- Clarify what ID you may need\n\n**Information**\n- Show what's on your ballot\n- List your elected representatives\n- Explain the full election process step-by-step\n\nWhere would you like to begin?`,
      suggestedActions: [
        { id: "s1", label: "Check my registration", query: "Am I registered to vote?", icon: "📋" },
        { id: "s2", label: "Find polling place", query: "Where do I vote?", icon: "📍" },
        { id: "s3", label: "Important dates", query: "What are the key deadlines?", icon: "📅" },
      ],
    },

    registration_check: {
      brief: isRegistered
        ? `✅ Great news — based on the information you've provided, you appear to be registered to vote in ${state}. Use the Registration tab to verify your exact status with the official tool.`
        : `📋 To check your registration status in ${state}, head to the **Registration** page — I'll look it up using your address directly via the official Google Civic API.`,
      detailed: `## Checking Your Registration Status\n\nYour registration status tells you whether you're on the official voter rolls in ${state}. Here's how to verify:\n\n1. **Use the Registration page** — enter your address and I'll query the official database\n2. **State portal** — most states have an online lookup tool at their Secretary of State website\n3. **Call your county clerk** — they can confirm over the phone\n\n${deadlineWarning}\n\nEven if you were registered before, you may need to **re-register** if you've moved, changed your name, or been inactive.`,
      complete: `## Complete Guide: Voter Registration Status\n\n### How Registration Works\nIn the United States, voter registration is managed at the state level. Most states require you to register **before** Election Day — typically 15–30 days in advance (some states allow same-day registration).\n\n### When You Need to Re-Register\n- You've moved to a new address\n- You've changed your legal name\n- You were removed from rolls due to inactivity\n- You've changed parties (in states with closed primaries)\n\n### How to Check in ${state}\n1. **Online:** Visit your state's Secretary of State website\n2. **Google Civic API:** Use the registration checker on this page\n3. **Phone:** Call your county elections office\n4. **Mail:** Request confirmation by mail\n\n### What to Do If You're Not Registered\n${deadlineWarning || "Registration is open — there's still time!"}\n\nHead to the Registration page to start your registration or get a direct link to ${state}'s official registration portal.`,
      suggestedActions: [
        { id: "r1", label: "Go to Registration page", query: "Open registration checker", icon: "🔍" },
        { id: "r2", label: "How do I register?", query: "How do I register to vote?", icon: "✏️" },
        { id: "r3", label: "What's the deadline?", query: "What is the registration deadline?", icon: "📅" },
      ],
    },

    registration_how: {
      brief: `📝 To register to vote in ${state}: visit your state's official website or use Vote.gov. You'll need your address, date of birth, and a government ID.${deadlineWarning}`,
      detailed: `## How to Register to Vote in ${state}\n\n### What You'll Need\n- Full legal name and current address\n- Date of birth\n- Last 4 digits of SSN **or** state ID/driver's license number\n\n### Registration Options\n1. **Online** — fastest; visit your state's Secretary of State site or [vote.gov](https://vote.gov)\n2. **By mail** — download, complete, and mail the National Mail Voter Registration Form\n3. **In person** — at your county clerk, DMV, or public library\n4. **Automatic** — many states auto-register eligible citizens at the DMV\n\n${deadlineWarning || "⏰ Registration deadlines vary by state — check yours on the Timeline page."}`,
      complete: `## Complete Voter Registration Guide for ${state}\n\n### Step-by-Step Process\n**Step 1: Confirm Eligibility**\n- U.S. citizen ✓\n- At least 18 years old by Election Day ✓\n- Resident of ${state} ✓\n- Not currently serving a felony sentence (varies by state)\n\n**Step 2: Gather Required Documents**\n- State-issued driver's license or ID number (preferred)\n- Last 4 digits of Social Security Number (alternative)\n- Current address proof may be required in some states\n\n**Step 3: Choose Your Registration Method**\n| Method | Deadline | Easiest For |\n|--------|----------|-------------|\n| Online | Usually 15–28 days before | Most people |\n| By mail | Usually 30 days before (postmark) | No internet access |\n| In person | Varies; same-day in some states | Last-minute |\n\n**Step 4: Confirm Registration**\nAfter registering, you'll receive a confirmation by mail or email. Check your status 2 weeks after submitting.\n\n${deadlineWarning || ""}`,
      suggestedActions: [
        { id: "rh1", label: "Check my status first", query: "Am I already registered?", icon: "✅" },
        { id: "rh2", label: "View deadlines", query: "What are the registration deadlines?", icon: "📅" },
        { id: "rh3", label: "Find my polling place", query: "Where do I vote?", icon: "📍" },
      ],
    },

    polling_place: {
      brief: `📍 Your polling place is assigned based on your registered address. Head to the **Find Polling Place** page — I'll show it on a map with directions.`,
      detailed: `## Finding Your Polling Place\n\nYour polling place is determined by your **registered address** — it may be a school gym, community centre, library, or church.\n\n### How to Find Yours\n1. Use the **Find Polling Place** tab — it queries Google Civic API with your address\n2. Check the back of your voter registration card\n3. Visit your county elections office website\n\n### What to Bring\n- Acceptable photo ID (requirements vary by state)\n- Your voter registration card (helpful but usually not required)\n- Patience — lines can be long on Election Day!\n\n### Can't Make It?\nConsider **early voting** or requesting an **absentee/mail-in ballot**.`,
      complete: `## Complete Guide: Polling Place & Voting In Person\n\n### Before You Go\n- ✅ Confirm your polling place (it may have changed since the last election)\n- ✅ Check the hours (typically 7am–8pm, varies by state)\n- ✅ Know what ID you need\n- ✅ Review your sample ballot beforehand\n\n### At the Polling Place\n1. **Check in** — give your name to the poll worker (and ID if required)\n2. **Receive your ballot** — paper or electronic\n3. **Vote** — mark your choices clearly\n4. **Submit** — feed into scanner or give to poll worker\n5. **Get your sticker!** 🗳️\n\n### Accessibility\nAll polling places must be accessible under the Americans with Disabilities Act. If you need assistance, a poll worker can help you, or you may bring someone to assist.\n\n### If There's a Problem\n- You can request a **provisional ballot** if your registration is in question\n- Contact your state's voter protection hotline: **1-866-OUR-VOTE**\n\nUse the map on the Polling Places page to get turn-by-turn directions.`,
      suggestedActions: [
        { id: "p1", label: "Open Polling Place Map", query: "Show me the map", icon: "🗺️" },
        { id: "p2", label: "Early voting options", query: "Can I vote early?", icon: "⏰" },
        { id: "p3", label: "What ID do I need?", query: "What identification do I need to vote?", icon: "🪪" },
      ],
    },

    election_day: {
      brief: `🗳️ Election Day in the U.S. is the **first Tuesday after the first Monday in November**. For specific upcoming elections in ${state}, check the Election Timeline page.`,
      detailed: `## Election Day Information\n\n### Federal Election Day\nU.S. federal elections (President, Congress) are held on the **first Tuesday after the first Monday in November** every even year.\n\n### State & Local Elections\nThese vary widely — check the **Election Timeline** for dates specific to ${state}.\n\n### What Happens on Election Day\n- Polls typically open **6am–7am** and close **7pm–8pm**\n- If you're in line when polls close, you **have the right to vote**\n- Results are usually reported the same night, with final certification weeks later`,
      complete: `## Complete Election Day Guide\n\n### Types of Elections\n| Type | Frequency | What's on the Ballot |\n|------|-----------|----------------------|\n| Presidential | Every 4 years | President, Senate, House, local |\n| Midterm | Every 4 years (off-year) | Senate, House, governors, local |\n| Primary | Before general | Party nominees |\n| Special | As needed | Fill vacancies |\n| Local | Varies | Mayor, council, school board |\n\n### Election Day Rights\n- You cannot be turned away if you're in line before closing time\n- Your employer must give you time off to vote (varies by state)\n- You can vote by provisional ballot if registration is disputed\n- Election observers are allowed at polling places\n\n### After You Vote\n- Check if your mail-in ballot was received (use your state's ballot tracker)\n- Share your "I Voted" sticker 🎉\n- Watch results — most states report same-night`,
      suggestedActions: [
        { id: "ed1", label: "View Election Timeline", query: "What are all the important dates?", icon: "📅" },
        { id: "ed2", label: "Find polling hours", query: "What are my polling place hours?", icon: "🕐" },
        { id: "ed3", label: "Early voting info", query: "Can I vote early instead?", icon: "⏰" },
      ],
    },

    early_voting: {
      brief: `⏰ Many states offer early in-person voting — typically 1–2 weeks before Election Day. Check the **Polling Places** tab to see early voting sites near you.`,
      detailed: `## Early Voting\n\nEarly voting lets you cast your ballot **in person before Election Day** — no excuse needed in most states.\n\n### Advantages\n- Shorter lines than Election Day\n- More flexible hours (weekends, evenings)\n- Fixes scheduling conflicts\n\n### How It Works\n1. Check if ${state} offers early voting (most do)\n2. Find an early voting site — often more options than Election Day\n3. Bring your ID\n4. Vote exactly as you would on Election Day\n\n*Early voting sites may differ from your Election Day polling place.*`,
      complete: `## Complete Early Voting Guide\n\n### State Availability\nAs of 2024, **46 states + D.C.** offer some form of early in-person voting. The remaining states may offer no-excuse absentee voting instead.\n\n### Typical Early Voting Windows\n- Starts: 7–17 days before Election Day\n- Ends: 1–3 days before Election Day\n- Hours: Vary — many offer weekend and evening hours\n\n### What to Bring\nSame as Election Day — your accepted photo ID (requirements vary by state).\n\n### Pro Tips\n- The **first and last days** tend to be busiest\n- **Mid-week mornings** are usually quietest\n- You can go to **any early voting site** in your county (not just your assigned precinct)\n\nUse the Polling Places map to find early voting sites in your area.`,
      suggestedActions: [
        { id: "ev1", label: "Find early voting sites", query: "Show early voting locations near me", icon: "📍" },
        { id: "ev2", label: "Mail-in option", query: "Can I vote by mail instead?", icon: "✉️" },
        { id: "ev3", label: "What ID do I need?", query: "What identification do I need?", icon: "🪪" },
      ],
    },

    absentee_mail: {
      brief: `✉️ Mail-in/absentee voting lets you receive, complete, and return your ballot by mail. Requirements vary by state — some allow it for any reason, others require an excuse.`,
      detailed: `## Absentee / Mail-In Voting\n\n### Types\n- **No-excuse absentee**: Any registered voter can request a mail ballot (most states)\n- **Excuse required**: Must provide a reason (illness, travel, disability)\n- **Universal vote-by-mail**: Ballot automatically mailed to all registered voters\n\n### Process in ${state}\n1. **Request** your absentee ballot (check state deadline — often 7–15 days before Election Day)\n2. **Receive** your ballot by mail\n3. **Mark** it in private\n4. **Return** — by mail (must arrive by deadline, not just postmarked) OR drop it at an official drop box\n\n⚠️ **Return deadlines are strict.** Late ballots are not counted.`,
      complete: `## Complete Absentee / Mail-In Ballot Guide\n\n### Step-by-Step\n**1. Check Eligibility**\nIn most states: any registered voter. In some states: must provide a valid excuse (illness, disability, absence from county).\n\n**2. Request Your Ballot**\n- Online at your state elections website\n- By mail using the official application form\n- Deadlines: typically 5–30 days before Election Day\n\n**3. Complete Your Ballot**\n- Read all instructions carefully\n- Use the correct pen (usually blue or black ink, no pencil)\n- Sign the envelope exactly as you're registered\n- Do NOT let anyone pressure you while completing it\n\n**4. Return Your Ballot**\n| Method | Deadline | Notes |\n|--------|----------|-------|\n| USPS Mail | Must arrive by Election Day* | Allow 1 week |\n| Drop Box | By Election Day close | Check locations on map |\n| In person | By Election Day close | Take to elections office |\n\n*Some states accept postmarked-by-Election-Day ballots received a few days later.\n\n**5. Track Your Ballot**\nMost states let you track online — check if yours was received and accepted.`,
      suggestedActions: [
        { id: "am1", label: "Find drop box locations", query: "Where are the ballot drop boxes?", icon: "📬" },
        { id: "am2", label: "View all deadlines", query: "What are all the mail-in ballot deadlines?", icon: "📅" },
        { id: "am3", label: "Add deadline to calendar", query: "Add absentee deadline to my calendar", icon: "🗓️" },
      ],
    },

    voter_id: {
      brief: `🪪 Voter ID requirements vary by state. Some require a photo ID, others accept a utility bill or allow non-photo ID. Check the specific rules for ${state} on your state's elections website.`,
      detailed: `## Voter ID Requirements\n\n### State Categories\n- **Strict photo ID**: Must show government-issued photo ID (exact match)\n- **Non-strict photo ID**: Photo ID preferred; alternatives if unavailable\n- **Non-photo ID accepted**: Utility bill, bank statement, paycheck\n- **No ID required**: Signature match or poll book verification\n\n### Generally Accepted Photo IDs\n- Driver's license or state ID card\n- U.S. passport\n- Military ID\n- Tribal ID\n- Student ID (not accepted everywhere)\n\n### What If You Lack ID?\nYou may be able to vote on a **provisional ballot** and present ID within a few days to have it counted. Contact your county elections office.`,
      complete: `## Complete Voter ID Guide\n\n### Why ID Requirements Vary\nVoter ID laws are set at the state level, not federally. Requirements range from no ID needed to strict government photo ID.\n\n### Accepted Forms of ID (Most Common)\n|ID Type|Accepted In|\n|-------|----------|\n|Driver's License/State ID|All photo ID states|\n|U.S. Passport|All photo ID states|\n|Military/Veterans ID|Most states|\n|Tribal ID|Many states|\n|Student ID|Some states|\n|Utility Bill / Bank Statement|Non-photo ID states|\n\n### Free ID Programs\nIf you lack a valid ID, many states offer **free voter ID cards**. Contact your local DMV or elections office.\n\n### Provisional Ballots\nIf you don't have ID at the polls:\n1. Request a **provisional ballot**\n2. Ask what ID you need to provide afterward\n3. You typically have **2–6 days** after Election Day to complete the process\n\n### Resources\n- [NCSL Voter ID State Laws](https://www.ncsl.org/elections-and-campaigns/voter-id)\n- Your state Secretary of State website`,
      suggestedActions: [
        { id: "id1", label: "Find ID requirements for my state", query: "What ID do I need to vote in my state?", icon: "🔍" },
        { id: "id2", label: "What if I don't have ID?", query: "Can I vote without photo ID?", icon: "❓" },
        { id: "id3", label: "Find free ID programs", query: "How do I get a free voter ID?", icon: "🆓" },
      ],
    },

    candidates_ballot: {
      brief: `🗳️ To see what's on your specific ballot, go to the **Voter Guide** page — I'll pull your contests from the Google Civic API using your address.`,
      detailed: `## What's on Your Ballot?\n\nYour ballot is unique to your **exact address**. It may include:\n\n- **Federal races**: President (every 4 years), U.S. Senate & House\n- **State races**: Governor, Attorney General, State Legislature\n- **Local races**: Mayor, City Council, School Board, Judges\n- **Ballot measures**: Propositions, referendums, constitutional amendments\n\n### How to Preview Your Ballot\n1. Visit the **Voter Guide** page on this app\n2. Enter your address to load your specific contests\n3. Research candidates at [Ballotpedia](https://ballotpedia.org) or [Vote411](https://vote411.org)`,
      complete: `## Complete Ballot Guide\n\n### How to Research Your Ballot\n\n**Step 1: Get Your Sample Ballot**\n- Use the Voter Guide page here\n- Or visit your county elections website\n\n**Step 2: Research Candidates**\n| Resource | Best For |\n|----------|----------|\n| Ballotpedia.org | Comprehensive candidate info |\n| Vote411.org | Candidate Q&A answers |\n| Local newspapers | In-depth candidate profiles |\n| Candidate websites | Their positions directly |\n\n**Step 3: Research Ballot Measures**\n- Read the full text (your ballot booklet has it)\n- Check fiscal analysis from your state's nonpartisan analyst\n- Look at who is funding pro/con campaigns\n\n**Step 4: Make Your Plan**\n- Write down or print your choices\n- You can bring notes into the voting booth in most states\n- Take your time — there's no rush\n\n### Marking Your Ballot Correctly\n- Follow ALL instructions on the ballot\n- Don't make extraneous marks\n- If you make a mistake, ask for a new ballot (spoiled ballot)\n- In ranked-choice states, rank from most to least preferred`,
      suggestedActions: [
        { id: "cb1", label: "View my Voter Guide", query: "Show me my ballot contents", icon: "📋" },
        { id: "cb2", label: "Find my representatives", query: "Who are my elected officials?", icon: "🏛️" },
        { id: "cb3", label: "Research candidates", query: "How do I research candidates?", icon: "🔍" },
      ],
    },

    deadlines: {
      brief: `📅 Key election deadlines include voter registration cutoff, mail-in ballot request deadline, early voting window, and Election Day. Check the **Timeline** page for exact dates in ${state}.`,
      detailed: `## Important Election Deadlines\n\n### Typical Deadline Order\n1. **Voter Registration Deadline** — 15–30 days before Election Day\n2. **Absentee/Mail-In Ballot Request** — 5–30 days before Election Day\n3. **Early Voting Opens** — 1–2 weeks before Election Day\n4. **Mail Ballot Return Deadline** — Election Day (must arrive, not just be postmarked, in most states)\n5. **Early Voting Closes** — 1–3 days before Election Day\n6. **Election Day** — First Tuesday after first Monday in November\n\nFor precise ${state} dates, see the **Election Timeline** tab — I'll load the real dates for your upcoming elections.`,
      complete: `## Complete Election Deadlines Guide\n\n### Why Deadlines Are Critical\nMissing a deadline means your vote may not count. This is one of the most important things to track.\n\n### How to Track Deadlines\n1. **Election Timeline page** — realtime dates from Google Civic API\n2. **Add to Google Calendar** — one click from the Timeline page\n3. **Download .ics file** — import into any calendar app\n\n### Key Deadlines Explained\n\n**Registration Deadline**\nMost states: 15–30 days before Election Day. Some states allow same-day registration. Online registration may have earlier deadlines than in-person.\n\n**Early Voting Window**\nTypically 7–14 days before Election Day, ending 1–3 days before it.\n\n**Mail-In Ballot Request**\nApply 1–30 days before Election Day. Give yourself at least 2 weeks if using USPS.\n\n**Mail-In Ballot Return**\nThis is the most confusing deadline — some states require it to *arrive* by Election Day close; others accept postmarks. Check ${state}'s rules.\n\n**Election Day**\nPolls close at different times — usually 7pm or 8pm local time. Be in line before closing time.\n\n### Set Reminders Now\nUse the Calendar button on the Timeline page to add automatic reminders — 7 days, 1 day, and 1 hour before each deadline.`,
      suggestedActions: [
        { id: "d1", label: "View full Timeline", query: "Show me all election dates", icon: "📅" },
        { id: "d2", label: "Add deadlines to Calendar", query: "Add election deadlines to Google Calendar", icon: "🗓️" },
        { id: "d3", label: "Register before deadline", query: "How do I register to vote?", icon: "✏️" },
      ],
    },

    representatives: {
      brief: `🏛️ Go to the **Representatives** page to see your elected officials — federal, state, and local — based on your address.`,
      detailed: `## Your Elected Representatives\n\nBased on your address, you have representatives at multiple levels:\n\n- **Federal**: U.S. President, 2 U.S. Senators, 1 U.S. Representative (in your congressional district)\n- **State**: State Senators and Representatives\n- **Local**: Mayor, City Council, County Commissioner, School Board\n\nHead to the Representatives page to see the full list with contact information.`,
      complete: `## Complete Guide: Your Elected Representatives\n\n### Levels of Government\n\n**Federal Level**\n- President & Vice President — elected nationally every 4 years\n- U.S. Senators (2 per state) — 6-year terms, staggered\n- U.S. House Representative (based on your district) — 2-year terms\n\n**State Level**\n- Governor — 4-year term\n- Lt. Governor, Attorney General, Secretary of State\n- State Senate & Assembly/House Representatives\n\n**Local Level**\n- Mayor / County Executive\n- City/Town Council\n- County Commissioner\n- School Board Members\n- Judges (some elected, some appointed)\n\n### How to Contact Your Representatives\n- **Phone**: Most effective for immediate concerns\n- **Email/Web form**: Good for detailed policy letters\n- **Town halls**: In-person meetings, often scheduled\n- **Social media**: Good for public visibility\n\n### Making Your Voice Heard\nContacting your representatives is your right as a citizen. Constituent calls and letters do influence legislation — especially from local officials.`,
      suggestedActions: [
        { id: "rep1", label: "Find my representatives", query: "Show my elected officials", icon: "🏛️" },
        { id: "rep2", label: "How to contact them", query: "How do I contact my representative?", icon: "📞" },
        { id: "rep3", label: "Who votes how?", query: "How do I find my representative's voting record?", icon: "📊" },
      ],
    },

    process_general: {
      brief: `🗳️ The U.S. election process has 5 main steps: Register → Get informed → Find your polling place → Vote → Verify your vote was counted. I can walk you through any of these in detail.`,
      detailed: `## How the Voting Process Works\n\n### The 5 Steps\n\n**1. Register** 📋\nSign up on the official voter rolls in your state. Required before Election Day in most states.\n\n**2. Get Informed** 📚\nLearn about candidates, ballot measures, and your polling place ahead of time.\n\n**3. Choose How to Vote** 🗳️\n- In person on Election Day\n- Early in-person voting\n- Absentee / mail-in ballot\n\n**4. Cast Your Ballot** ✅\nShow up (or mail in) with required ID, mark your choices, and submit.\n\n**5. Verify Your Vote** 🔍\nMost states let you track whether your ballot was received and counted.`,
      complete: `## Complete Election Process Guide\n\n### From Registration to Results\n\n**Phase 1: Registration (months before)**\n- Register online, by mail, or in person\n- Update registration if you move or change name\n- Confirm registration status before every election\n\n**Phase 2: Pre-Election (weeks before)**\n- Your sample ballot becomes available\n- Request mail-in ballot if desired\n- Early voting opens\n- Research candidates and measures\n\n**Phase 3: Voting (Election Day)**\n- Polls open early morning, close 7–8pm\n- Bring required ID\n- If in line when polls close, you can still vote\n\n**Phase 4: Post-Election (days to weeks after)**\n- Initial results reported election night\n- Mail-in and provisional ballots counted over days\n- Official results certified (usually 2–4 weeks after)\n- Recounts if results are very close\n\n### How Your Vote Is Protected\n- Ballot secrecy laws protect your privacy\n- Bipartisan teams count ballots\n- Multiple verification steps prevent fraud\n- You can challenge a denial with a provisional ballot\n\n### The Electoral College (Presidential Elections)\nPresidents are elected via the Electoral College, not the popular vote directly. Each state has electors equal to its congressional delegation. Most states are winner-take-all.`,
      suggestedActions: [
        { id: "pg1", label: "Start with registration", query: "How do I register to vote?", icon: "📋" },
        { id: "pg2", label: "View election timeline", query: "What are all the key dates?", icon: "📅" },
        { id: "pg3", label: "Find my polling place", query: "Where do I vote?", icon: "📍" },
      ],
    },

    who_can_vote: {
      brief: `✅ To vote in U.S. federal elections, you must be: a U.S. citizen, at least 18 years old by Election Day, and a resident of your state. Most states also require registration in advance.`,
      detailed: `## Who Is Eligible to Vote?\n\n### Basic Federal Requirements\n- **U.S. Citizenship** — naturalized citizens have the same voting rights as natural-born\n- **Age** — must be 18 by Election Day (some states allow 17-year-olds to vote in primaries if they'll be 18 by the general)\n- **Residency** — must be a resident of the state where you register\n\n### Who Cannot Vote (Varies by State)\n- Non-citizens (including lawful permanent residents)\n- People currently serving felony sentences in many states\n- Individuals declared mentally incapacitated by a court (in some states)\n\n### Restoring Voting Rights\nIf you have a past conviction, your rights may be automatically restored after release, parole, or probation — depending on your state.`,
      complete: `## Complete Voting Eligibility Guide\n\n### Federal Requirements vs. State Laws\nThe U.S. Constitution sets the *maximum* restrictions (age 18, citizenship). States can be *more permissive* but not more restrictive.\n\n### Special Situations\n\n**College Students**\nCan register at their school address OR home address — not both. Choose the location where you have more local elections that affect you.\n\n**People Who Move**\nMust update registration in new state (or county if same state). There may be a waiting period.\n\n**People with Disabilities**\nHave full voting rights. Assistance is available at polling places. May register by mail with assistance.\n\n**Military & Overseas Voters**\nProtected by the Uniformed and Overseas Citizens Absentee Voting Act (UOCAVA). Can request ballots electronically.\n\n**Formerly Incarcerated**\nRights restoration varies dramatically by state:\n- Automatic upon release: Many states\n- After parole: Some states\n- After probation: Some states\n- Never automatic: A few states (must apply)\n\n### Resources\n- [ACLU Voting Rights](https://www.aclu.org/voting-rights)\n- [Brennan Center for Justice](https://www.brennancenter.org/issues/ensure-every-american-can-vote)`,
      suggestedActions: [
        { id: "wv1", label: "Am I eligible?", query: "Check if I can vote", icon: "✅" },
        { id: "wv2", label: "Register to vote", query: "How do I register to vote?", icon: "📋" },
        { id: "wv3", label: "Felony voting rights", query: "What are the rules for voting with a felony?", icon: "⚖️" },
      ],
    },

    accessibility: {
      brief: `♿ All polling places must be accessible under the Americans with Disabilities Act. You can request assistance, use accessible equipment, or bring someone to help you vote.`,
      detailed: `## Accessible Voting Options\n\n### At the Polling Place\n- Wheelchair ramps and accessible parking\n- Accessible voting machines (audio ballots, large print)\n- Curbside voting — if you cannot enter the building\n- A person of your choice can assist you inside the booth\n\n### At Home\n- **Mail-in ballot** — vote from home at your own pace\n- **UOCAVA** — special provisions for military/overseas voters\n- Ballot assistance — many states allow a helper to assist with mail ballots\n\n### Before You Go\nCall your polling place or county elections office to confirm accessibility features and request accommodations in advance.`,
      complete: `## Complete Accessibility Guide for Voters\n\n### Legal Protections\n- **Americans with Disabilities Act (ADA)** — all polling places accessible\n- **Help America Vote Act (HAVA)** — accessible voting systems required in every polling place\n- **Voting Rights Act** — language assistance in areas with large non-English speaking populations\n\n### Available Accommodations\n\n**Physical Access**\n- Accessible parking and path of travel\n- Level entry or ramp\n- Accessible voting station height\n- Curbside voting if you can't enter\n\n**Vision Impairment**\n- Audio ballots (headphones + keypad)\n- Large-print ballots (request ahead of time)\n- Magnification devices\n- Sighted assistant allowed\n\n**Hearing Impairment**\n- Written communication with poll workers\n- Sign language interpreters (may need advance request)\n\n**Motor Impairment**\n- Accessible voting machines accept input from switch devices, sip-and-puff, etc.\n- Extra time allowed\n- Signature accommodation — if you can't sign as registered\n\n**Assistance**\n- You may bring ONE person of your choice to assist (cannot be employer or union rep)\n- Poll workers can also assist\n- Write-in assistance available\n\n### Resources\n- [ADA National Network](https://adata.org)\n- [National Disability Rights Network](https://www.ndrn.org)\n- Your local elections office for specific accommodations`,
      suggestedActions: [
        { id: "ac1", label: "Find accessible polling places", query: "Which polling places are wheelchair accessible?", icon: "♿" },
        { id: "ac2", label: "Vote from home option", query: "Can I vote by mail instead?", icon: "✉️" },
        { id: "ac3", label: "Request assistance", query: "How do I request voting assistance?", icon: "🤝" },
      ],
    },

    help_getting_help: {
      brief: `💬 I can help with: voter registration, finding your polling place, election deadlines, ballot contents, candidates, your representatives, accessibility, and more. What would you like to explore?`,
      detailed: `## What Can I Help You With?\n\n### Registration & Eligibility\n- Check if you're registered to vote\n- Walk through the registration process\n- Deadlines for registration\n\n### Voting Options\n- Find your assigned polling place (+ directions via Google Maps)\n- Early voting locations and hours\n- Absentee / mail-in ballot guide\n\n### Deadlines & Timeline\n- All key dates for your upcoming election\n- Add deadlines to your Google Calendar\n\n### Your Ballot\n- What contests are on your ballot\n- Candidate research resources\n\n### Accessibility\n- Accessible voting options\n- How to request assistance\n\n### Representatives\n- Who represents you at federal, state, and local levels\n- How to contact them\n\nJust ask — or use the **Quick Actions** on the home page to jump directly to a feature!`,
      complete: `## Complete Feature Guide\n\n### Chat Assistant (You're here!)\nAsk any election-related question in plain English. I understand context and can guide you step-by-step.\n\n### Registration Page\nEnter your address → get real-time registration status from Google Civic API → link to your state's registration portal.\n\n### Polling Places\nInteractive Google Maps showing your polling place, early voting sites, and ballot drop boxes. Get walking, driving, or transit directions.\n\n### Election Timeline\nAll key dates for your upcoming elections, loaded from Google Civic API. One-click "Add to Google Calendar" or download an .ics file.\n\n### Voter Guide\nYour specific ballot pulled from the Civic API — see every candidate and ballot measure. Save to Google Drive.\n\n### Representatives\nYour elected officials at all levels — with direct contact information.\n\n### Multi-Language Support\nThis app is available in English, Español, 中文, Tiếng Việt, 한국어, and Français — switch with the language selector in the header.`,
      suggestedActions: [
        { id: "hh1", label: "Check my registration", query: "Am I registered to vote?", icon: "📋" },
        { id: "hh2", label: "Find polling place", query: "Where do I vote?", icon: "📍" },
        { id: "hh3", label: "Key deadlines", query: "What are the important election dates?", icon: "📅" },
      ],
    },

    unknown: {
      brief: `🤔 I'm not sure I understood that. I can help with voter registration, polling places, election deadlines, ballot information, and more. Try asking something like "Am I registered?" or "Where do I vote?"`,
      detailed: `## I Didn't Quite Catch That\n\nI'm specialised in election information. Here are some things I can help with:\n\n- **"Am I registered to vote?"**\n- **"Where do I vote?"**\n- **"What are the registration deadlines?"**\n- **"Can I vote by mail?"**\n- **"What's on my ballot?"**\n- **"Who are my representatives?"**\n\nTry rephrasing your question, or use the navigation links to go directly to a feature.`,
      complete: `## Let Me Help You Find What You Need\n\nI'm specialised in election process guidance. Here's a full list of topics I understand:\n\n**Registration**: checking status, how to register, re-registering, deadlines\n**Voting methods**: in-person, early voting, absentee/mail-in\n**Polling places**: finding yours, hours, directions, accessibility\n**Election Day**: what to expect, what to bring, your rights\n**Voter ID**: requirements by state, what's accepted, free IDs\n**Your ballot**: what's on it, how to research candidates and measures\n**Deadlines**: registration, mail-in, early voting windows\n**Representatives**: who represents you, how to contact them\n**Eligibility**: who can vote, special circumstances\n**Accessibility**: accommodations, assistance, mail-in options\n\nOr use the **Quick Actions** on the home screen to jump to a specific feature.`,
      suggestedActions: [
        { id: "u1", label: "What can you help with?", query: "What can you do?", icon: "💬" },
        { id: "u2", label: "Check registration", query: "Am I registered to vote?", icon: "📋" },
        { id: "u3", label: "Find polling place", query: "Where do I vote?", icon: "📍" },
      ],
    },
  };
}

// ─── Main ElectionAssistant class ────────────────────────────────────────────
export class ElectionAssistant {
  private conversationHistory: Message[] = [];
  private userContext: UserContext;

  constructor(context: UserContext) {
    this.userContext = context;
  }

  /**
   * Classify the intent of a user message using keyword + pattern matching.
   */
  classifyIntent(message: string): Intent {
    const lower = message.toLowerCase().trim();
    for (const { intent, patterns } of INTENT_PATTERNS) {
      if (patterns.some((p) => p.test(lower))) return intent;
    }
    return "unknown";
  }

  /**
   * Determine the highest-priority action path based on user context.
   */
  determineUserPath(): "urgent_deadline" | "registration" | "educational" {
    const { daysUntilDeadline, registrationStatus, upcomingElections } = this.userContext;
    if (daysUntilDeadline !== null && daysUntilDeadline <= URGENT_DAYS_THRESHOLD) {
      return "urgent_deadline";
    }
    if (registrationStatus === "not_registered" && upcomingElections.length > 0) {
      return "registration";
    }
    return "educational";
  }

  /**
   * Build a context-aware urgency banner to prepend when relevant.
   */
  private buildContextBanner(): string {
    const path = this.determineUserPath();
    if (path === "urgent_deadline") {
      const d = this.userContext.daysUntilDeadline!;
      return `\n\n> ⚠️ **Heads up:** Your voter registration deadline is in **${d} day${d === 1 ? "" : "s"}**. Act now!\n`;
    }
    if (path === "registration") {
      return `\n\n> 📋 **You're not yet registered to vote.** There's an upcoming election — [register now](#/voter).\n`;
    }
    return "";
  }

  /**
   * Main chat method — classify intent, get response at current disclosure level.
   */
  chat(userMessage: string): Message {
    const intent = this.classifyIntent(userMessage);
    const templates = buildTemplates(this.userContext);
    const template = templates[intent];
    const level = this.userContext.disclosureLevel;

    const raw = template[level];
    const banner = this.buildContextBanner();
    const fullContent = raw + banner;

    const msg: Message = {
      id: uuidv4(),
      role: "assistant",
      content: fullContent,
      timestamp: new Date(),
      intent,
      suggestedActions: template.suggestedActions,
      disclosureLevel: level,
    };

    this.conversationHistory.push({
      id: uuidv4(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    });
    this.conversationHistory.push(msg);

    return msg;
  }

  /**
   * Get welcome message on first load.
   */
  getWelcomeMessage(): Message {
    return this.chat("hello");
  }

  /**
   * Get conversation history (for display).
   */
  getHistory(): Message[] {
    return this.conversationHistory;
  }

  /**
   * Update user context (e.g. when registration status is fetched).
   */
  updateContext(partial: Partial<UserContext>) {
    this.userContext = { ...this.userContext, ...partial };
  }
}

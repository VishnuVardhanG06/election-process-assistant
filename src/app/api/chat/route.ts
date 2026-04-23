import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ElectionAssistant } from "@/services/decision-engine";
import { config } from "@/constants/config";

// ─── Rate limiting (simple in-memory) ────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; reset: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + config.rateLimitWindowMs });
    return false;
  }

  if (entry.count >= config.rateLimitMax) return true;

  entry.count++;
  return false;
}

// ─── Input schema ─────────────────────────────────────────────────────────────
const ChatSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.object({
    location: z.object({ country: z.string(), state: z.string().optional() }),
    userRole: z.enum(["voter", "candidate", "poll_worker", "researcher"]),
    registrationStatus: z.enum(["registered", "not_registered", "unknown"]),
    daysUntilDeadline: z.number().nullable(),
    upcomingElections: z.array(z.string()),
    disclosureLevel: z.enum(["brief", "detailed", "complete"]),
  }).passthrough(),
  history: z.array(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // Parse & validate
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ChatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { message, context } = parsed.data;

  // Build a full UserContext with defaults for missing fields
  const fullContext = {
    location: context.location,
    electionType: "national" as const,
    userRole: context.userRole,
    registrationStatus: context.registrationStatus,
    conversationHistory: [],
    detectedIntent: "",
    upcomingElections: context.upcomingElections,
    daysUntilDeadline: context.daysUntilDeadline,
    disclosureLevel: context.disclosureLevel,
  };

  // Run through decision engine
  const assistant = new ElectionAssistant(fullContext);
  const response = assistant.chat(message);

  return NextResponse.json({
    content: response.content,
    intent: response.intent,
    suggestedActions: response.suggestedActions ?? [],
    disclosureLevel: response.disclosureLevel,
  });
}

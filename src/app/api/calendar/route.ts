import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calendarService } from "@/services/google-calendar";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const BodySchema = z.object({
  deadline: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    date: z.string(),
    type: z.string(),
    daysUntil: z.number(),
    urgent: z.boolean(),
    url: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid deadline data" }, { status: 400 });

  // Demo mode: no auth required when Google OAuth is not configured
  const session = await auth().catch(() => null);
  const accessToken = (session as any)?.accessToken;

  if (!accessToken) {
    // Return a demo success so the UI flow works without OAuth
    return NextResponse.json({
      ok: true,
      data: {
        id: `demo-${parsed.data.deadline.id}`,
        htmlLink: `https://calendar.google.com/calendar/r`,
        summary: `[Demo] ${parsed.data.deadline.title}`,
      },
      demo: true,
    });
  }

  const result = await calendarService.createElectionReminder(
    parsed.data.deadline as any,
    accessToken as string
  );

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}


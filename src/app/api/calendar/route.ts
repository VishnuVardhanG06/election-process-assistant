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
  const session = await auth();
  if (!(session as any)?.accessToken) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in with Google." },
      { status: 401 }
    );
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid deadline data" }, { status: 400 });

  const result = await calendarService.createElectionReminder(
    parsed.data.deadline as any,
    session.accessToken as string
  );

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

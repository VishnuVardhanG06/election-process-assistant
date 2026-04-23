import { NextRequest, NextResponse } from "next/server";
import { generateICS } from "@/services/google-calendar";

export async function POST(request: NextRequest) {
  let deadlines: any[];
  try {
    const body = await request.json();
    deadlines = Array.isArray(body.deadlines) ? body.deadlines : [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!deadlines.length) {
    return NextResponse.json({ error: "No deadlines provided" }, { status: 400 });
  }

  const ics = generateICS(deadlines);

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="election-deadlines.ics"',
      "Cache-Control": "no-store",
    },
  });
}

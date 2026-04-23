import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { civicService } from "@/services/google-civic";

const BodySchema = z.object({ address: z.string().min(5).max(300) });

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid address" }, { status: 400 });

  const result = await civicService.getRegistrationStatus(parsed.data.address);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.code ?? 500 });

  return NextResponse.json({ ok: true, data: result.data });
}

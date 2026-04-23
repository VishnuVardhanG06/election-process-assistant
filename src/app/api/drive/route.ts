import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { driveService } from "@/services/google-drive";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const BodySchema = z.object({
  content: z.string().min(1).max(100_000),
  fileName: z.string().min(1).max(200),
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
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const result = await driveService.saveVoterGuide(
    parsed.data.content,
    parsed.data.fileName,
    session.accessToken as string
  );

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

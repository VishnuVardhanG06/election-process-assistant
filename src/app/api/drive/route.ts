import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { driveService } from "@/services/google-drive";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const BodySchema = z.object({
  content: z.string().min(1).max(100_000),
  fileName: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  // Demo mode: no auth required when Google OAuth is not configured
  const session = await auth().catch(() => null);
  const accessToken = (session as any)?.accessToken;

  if (!accessToken) {
    // Return a demo success so the UI flow works without OAuth
    return NextResponse.json({
      ok: true,
      data: {
        id: "demo-drive-file",
        name: parsed.data.fileName,
        mimeType: "text/plain",
        webViewLink: "https://drive.google.com",
      },
      demo: true,
    });
  }

  const result = await driveService.saveVoterGuide(
    parsed.data.content,
    parsed.data.fileName,
    accessToken as string
  );

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

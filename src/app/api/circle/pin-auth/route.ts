import { NextRequest, NextResponse } from "next/server";
import { elderPinAuthSchema } from "@/lib/validations";
import { DataService } from "@/lib/data-service";
import { verifyPin, createSessionToken } from "@/lib/auth";

// In-memory rate limiting map (IP / Circle -> attempt timestamps)
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const attempts = (rateLimitMap.get(key) || []).filter(t => now - t < 15 * 60 * 1000);
  if (attempts.length >= 5) return true;
  attempts.push(now);
  rateLimitMap.set(key, attempts);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = elderPinAuthSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const circle = await DataService.findCircleByInviteCode(parsed.data.inviteCode);
    if (!circle) {
      return NextResponse.json({ error: "Care Circle not found with this code." }, { status: 404 });
    }

    const rateLimitKey = `${circle.id}_${req.headers.get("x-forwarded-for") || "local"}`;
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    const isValid = verifyPin(parsed.data.pin, circle.elderPinHash);
    if (!isValid) {
      return NextResponse.json({ error: "Incorrect PIN. Please re-enter." }, { status: 401 });
    }

    // Clear rate limit on successful authentication
    rateLimitMap.delete(rateLimitKey);

    const token = createSessionToken({
      circleId: circle.id,
      elderName: circle.elderName,
      isElder: true,
    });

    const res = NextResponse.json({
      success: true,
      circleId: circle.id,
      elderName: circle.elderName,
    });

    res.cookies.set("carecircle_elder_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

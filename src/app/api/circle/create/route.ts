import { NextRequest, NextResponse } from "next/server";
import { createCircleSchema } from "@/lib/validations";
import { DataService } from "@/lib/data-service";
import { verifySessionToken, SessionUser, createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("carecircle_session")?.value;
    const session = sessionCookie ? verifySessionToken<SessionUser>(sessionCookie) : null;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please sign in as a caregiver." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createCircleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const circle = await DataService.createCircle({
      elderName: parsed.data.elderName,
      elderPin: parsed.data.elderPin,
      emergencyPhone: parsed.data.emergencyPhone,
      userId: session.userId,
      relationToElder: parsed.data.relationToElder,
    });

    // Update user's session token with circleId
    const updatedToken = createSessionToken({
      ...session,
      circleId: circle.id,
    });

    const res = NextResponse.json({
      success: true,
      circle: { id: circle.id, elderName: circle.elderName, inviteCode: circle.inviteCode },
    });

    res.cookies.set("carecircle_session", updatedToken, {
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

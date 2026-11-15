import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SessionUser, ElderSession } from "@/lib/auth";
import { DataService } from "@/lib/data-service";

export async function GET(req: NextRequest) {
  // Check caregiver session first
  const caregiverCookie = req.cookies.get("carecircle_session")?.value;
  if (caregiverCookie) {
    const session = verifySessionToken<SessionUser>(caregiverCookie);
    if (session) {
      const circle = session.circleId
        ? await DataService.findCircleById(session.circleId)
        : await DataService.getCircleForUser(session.userId);
      return NextResponse.json({
        authenticated: true,
        type: "caregiver",
        user: { ...session, circleId: circle?.id },
        circle: circle ? { id: circle.id, elderName: circle.elderName, inviteCode: circle.inviteCode } : null,
      });
    }
  }

  // Check elder kiosk session
  const elderCookie = req.cookies.get("carecircle_elder_session")?.value;
  if (elderCookie) {
    const session = verifySessionToken<ElderSession>(elderCookie);
    if (session && session.isElder) {
      const circle = await DataService.findCircleById(session.circleId);
      return NextResponse.json({
        authenticated: true,
        type: "elder",
        elderName: session.elderName,
        circleId: session.circleId,
        circle: circle ? { id: circle.id, elderName: circle.elderName, inviteCode: circle.inviteCode } : null,
      });
    }
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SessionUser, ElderSession } from "@/lib/auth";
import { DataService } from "@/lib/data-service";

export async function GET(req: NextRequest) {
  let circleId: string | null = null;

  // Check elder session
  const elderCookie = req.cookies.get("carecircle_elder_session")?.value;
  if (elderCookie) {
    const elder = verifySessionToken<ElderSession>(elderCookie);
    if (elder?.isElder) circleId = elder.circleId;
  }

  // Check caregiver session if not elder
  if (!circleId) {
    const caregiverCookie = req.cookies.get("carecircle_session")?.value;
    if (caregiverCookie) {
      const caregiver = verifySessionToken<SessionUser>(caregiverCookie);
      if (caregiver) {
        circleId = caregiver.circleId || (await DataService.getCircleForUser(caregiver.userId))?.id || null;
      }
    }
  }

  if (!circleId) {
    // Return default demo circle if unauthenticated to enable instant viewing
    const demoCircle = await DataService.findCircleByInviteCode("CARE-8291");
    if (demoCircle) {
      return NextResponse.json({
        circle: {
          id: demoCircle.id,
          elderName: demoCircle.elderName,
          inviteCode: demoCircle.inviteCode,
          emergencyPhone: demoCircle.emergencyPhone,
        },
        isDemoFallback: true,
      });
    }
    return NextResponse.json({ error: "No active Care Circle found" }, { status: 404 });
  }

  const circle = await DataService.findCircleById(circleId);
  if (!circle) {
    return NextResponse.json({ error: "Circle not found" }, { status: 404 });
  }

  return NextResponse.json({
    circle: {
      id: circle.id,
      elderName: circle.elderName,
      inviteCode: circle.inviteCode,
      emergencyPhone: circle.emergencyPhone,
    },
  });
}

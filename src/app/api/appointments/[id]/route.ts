import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/data-service";
import { verifySessionToken, SessionUser } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionCookie = req.cookies.get("carecircle_session")?.value;
    const session = sessionCookie ? verifySessionToken<SessionUser>(sessionCookie) : null;
    let circleId = session?.circleId;

    if (!circleId && session?.userId) {
      const c = await DataService.getCircleForUser(session.userId);
      circleId = c?.id;
    }
    if (!circleId) {
      const demo = await DataService.findCircleByInviteCode("CARE-8291");
      circleId = demo?.id;
    }

    if (!circleId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const success = await DataService.deleteAppointment(params.id, circleId);
    if (!success) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

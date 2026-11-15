import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/data-service";
import { verifySessionToken, SessionUser, ElderSession } from "@/lib/auth";

async function getActiveCircleId(req: NextRequest): Promise<string | null> {
  const elderCookie = req.cookies.get("carecircle_elder_session")?.value;
  if (elderCookie) {
    const e = verifySessionToken<ElderSession>(elderCookie);
    if (e?.circleId) return e.circleId;
  }

  const caregiverCookie = req.cookies.get("carecircle_session")?.value;
  if (caregiverCookie) {
    const s = verifySessionToken<SessionUser>(caregiverCookie);
    if (s?.circleId) return s.circleId;
    if (s?.userId) {
      const c = await DataService.getCircleForUser(s.userId);
      if (c) return c.id;
    }
  }

  const demo = await DataService.findCircleByInviteCode("CARE-8291");
  return demo ? demo.id : null;
}

export async function GET(req: NextRequest) {
  try {
    const circleId = await getActiveCircleId(req);
    if (!circleId) {
      return NextResponse.json({ error: "Care Circle not selected" }, { status: 400 });
    }

    const doses = await DataService.getTodayDoses(circleId);
    const adherence = await DataService.getAdherenceStats(circleId);

    return NextResponse.json({ doses, adherence });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { doseLogSchema } from "@/lib/validations";
import { DataService } from "@/lib/data-service";
import { verifySessionToken, SessionUser, ElderSession } from "@/lib/auth";

async function getAuthContext(req: NextRequest): Promise<{ circleId: string; loggedById: string | null } | null> {
  const elderCookie = req.cookies.get("carecircle_elder_session")?.value;
  if (elderCookie) {
    const e = verifySessionToken<ElderSession>(elderCookie);
    if (e?.circleId) return { circleId: e.circleId, loggedById: null };
  }

  const caregiverCookie = req.cookies.get("carecircle_session")?.value;
  if (caregiverCookie) {
    const s = verifySessionToken<SessionUser>(caregiverCookie);
    if (s?.circleId) return { circleId: s.circleId, loggedById: s.userId };
    if (s?.userId) {
      const c = await DataService.getCircleForUser(s.userId);
      if (c) return { circleId: c.id, loggedById: s.userId };
    }
  }

  // Demo fallback
  const demo = await DataService.findCircleByInviteCode("CARE-8291");
  return demo ? { circleId: demo.id, loggedById: null } : null;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = doseLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const scheduledDate = new Date(parsed.data.scheduledTime);
    const doseId = body.doseId || `dose_${parsed.data.medicationId}_${scheduledDate.getHours()}_${scheduledDate.getMinutes()}`;

    const logged = await DataService.logDose({
      doseId,
      medicationId: parsed.data.medicationId,
      circleId: auth.circleId,
      scheduledTime: scheduledDate,
      status: parsed.data.status,
      notes: parsed.data.notes,
      loggedById: auth.loggedById,
    });

    const adherence = await DataService.getAdherenceStats(auth.circleId);

    return NextResponse.json({ success: true, dose: logged, adherence });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

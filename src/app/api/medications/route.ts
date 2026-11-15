import { NextRequest, NextResponse } from "next/server";
import { medicationSchema } from "@/lib/validations";
import { DataService } from "@/lib/data-service";
import { verifySessionToken, SessionUser, ElderSession } from "@/lib/auth";

async function getActiveCircleId(req: NextRequest): Promise<string | null> {
  const caregiverCookie = req.cookies.get("carecircle_session")?.value;
  if (caregiverCookie) {
    const s = verifySessionToken<SessionUser>(caregiverCookie);
    if (s?.circleId) return s.circleId;
    if (s?.userId) {
      const c = await DataService.getCircleForUser(s.userId);
      if (c) return c.id;
    }
  }

  const elderCookie = req.cookies.get("carecircle_elder_session")?.value;
  if (elderCookie) {
    const e = verifySessionToken<ElderSession>(elderCookie);
    if (e?.circleId) return e.circleId;
  }

  // Demo fallback
  const demo = await DataService.findCircleByInviteCode("CARE-8291");
  return demo ? demo.id : null;
}

export async function GET(req: NextRequest) {
  try {
    const circleId = await getActiveCircleId(req);
    if (!circleId) {
      return NextResponse.json({ error: "Care Circle not selected" }, { status: 400 });
    }

    const medications = await DataService.getMedications(circleId);
    return NextResponse.json({ medications });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const circleId = await getActiveCircleId(req);
    if (!circleId) {
      return NextResponse.json({ error: "Care Circle not selected" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = medicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const medication = await DataService.createMedication(circleId, parsed.data);
    return NextResponse.json({ success: true, medication }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

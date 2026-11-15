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

  const demo = await DataService.findCircleByInviteCode("CARE-8291");
  return demo ? demo.id : null;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const circleId = await getActiveCircleId(req);
    if (!circleId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = medicationSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const updated = await DataService.updateMedication(params.id, circleId, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: "Medication not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, medication: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const circleId = await getActiveCircleId(req);
    if (!circleId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const success = await DataService.deleteMedication(params.id, circleId);
    if (!success) {
      return NextResponse.json({ error: "Medication not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

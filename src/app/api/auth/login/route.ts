import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations";
import { DataService } from "@/lib/data-service";
import { verifyPassword, createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const user = await DataService.findUserByEmail(parsed.data.email);
    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Lookup Care Circle for this caregiver
    const circle = await DataService.getCircleForUser(user.id);

    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      circleId: circle?.id,
    });

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, circleId: circle?.id },
    });

    res.cookies.set("carecircle_session", token, {
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

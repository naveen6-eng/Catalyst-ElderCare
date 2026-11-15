import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "Logged out successfully" });
  res.cookies.delete("carecircle_session");
  res.cookies.delete("carecircle_elder_session");
  return res;
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "connected";

  if (process.env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "postgresql_live";
    } catch {
      dbStatus = "postgresql_unreachable";
    }
  } else {
    dbStatus = "demo_mode_active";
  }

  const responseTimeMs = Date.now() - startTime;

  return NextResponse.json({
    status: "ok",
    service: "CareCircle",
    version: "1.0.0",
    database: dbStatus,
    timestamp: new Date().toISOString(),
    latencyMs: responseTimeMs,
    environment: process.env.NODE_ENV || "development",
    uptimeSeconds: Math.floor(process.uptime()),
  });
}

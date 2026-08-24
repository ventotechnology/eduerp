import { NextResponse } from "next/server";
import { ENV } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "eduerp",
    environment: ENV.IS_PRODUCTION ? "production" : "development",
    version: "0.1.0",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

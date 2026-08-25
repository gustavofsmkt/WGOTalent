import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "~/server/db";

export const dynamic = "force-dynamic";

const RATE_LIMIT = 60;
const WINDOW_MS = 60_000;
const rateLimitMap = new Map<string, { count: number; reset: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ status: "too_many_requests" }, { status: 429 });
  }

  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json(
      { status: "unhealthy", db: "unreachable" },
      { status: 503 },
    );
  }
}

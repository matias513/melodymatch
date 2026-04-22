import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const history = await db.search.findMany({
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return NextResponse.json({ ok: true, history });
}

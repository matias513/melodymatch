import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const HistoryQuerySchema = z.object({
  take: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const { take = 20 } = HistoryQuerySchema.parse({
      take: searchParams.get("take") ?? undefined,
    });

    const history = await db.search.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        createdAt: true,
        zcr: true,
        energy: true,
        density: true,
        length: true,
        topTitle: true,
        confidence: true,
      },
    });

    return NextResponse.json({
      ok: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        count: 0,
        history: [],
        message: "No se pudo obtener el historial.",
      },
      { status: 400 }
    );
  }
}

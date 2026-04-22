import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { matchFromFeatures } from "@/lib/matching";

const SearchSchema = z.object({
  zcr: z.number().min(0).max(1),
  energy: z.number().min(0).max(1),
  density: z.number().min(0).max(1),
  length: z.number().min(0).max(1)
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const input = SearchSchema.parse(json);
    const results = matchFromFeatures(input);

    await db.search.create({
      data: {
        zcr: input.zcr,
        energy: input.energy,
        density: input.density,
        length: input.length,
        topTitle: results[0]?.title,
        confidence: results[0]?.confidence
      }
    });

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: "No se pudo procesar la búsqueda." }, { status: 400 });
  }
}

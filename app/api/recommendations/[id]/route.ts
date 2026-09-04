import { NextRequest, NextResponse } from "next/server";
import { updateRecommendation } from "@/lib/tilki-db";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string };
    if (body.status !== "approved" && body.status !== "dismissed") {
      return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
    }
    const result = await updateRecommendation(id, body.status);
    if (!result) return NextResponse.json({ error: "Öneri bulunamadı." }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("recommendation_update_failed", error);
    return NextResponse.json({ error: "İşlem kaydedilemedi. Lütfen tekrar dene." }, { status: 503 });
  }
}

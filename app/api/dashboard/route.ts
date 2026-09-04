import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/tilki-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getDashboardData());
  } catch (error) {
    console.error("dashboard_load_failed", error);
    return NextResponse.json({ error: "İşletme verileri şu anda yüklenemedi." }, { status: 503 });
  }
}

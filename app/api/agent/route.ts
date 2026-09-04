import { NextRequest, NextResponse } from "next/server";
import { createAgentRecommendation, type AgentName } from "@/lib/tilki-db";

const validAgents: AgentName[] = [
  "AI Manager",
  "Marketing AI",
  "Sales AI",
  "Finance AI",
  "Operations AI",
  "Inventory AI",
  "Analytics AI",
];

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { prompt?: string; agent?: AgentName };
    const prompt = body.prompt?.trim().slice(0, 500);
    if (!prompt || prompt.length < 4) {
      return NextResponse.json({ error: "Görevi biraz daha ayrıntılı yaz." }, { status: 400 });
    }
    const agent = validAgents.includes(body.agent as AgentName)
      ? (body.agent as AgentName)
      : "AI Manager";
    return NextResponse.json(await createAgentRecommendation(prompt, agent), { status: 201 });
  } catch (error) {
    console.error("agent_task_failed", error);
    return NextResponse.json({ error: "AI görevi oluşturulamadı. Lütfen tekrar dene." }, { status: 503 });
  }
}

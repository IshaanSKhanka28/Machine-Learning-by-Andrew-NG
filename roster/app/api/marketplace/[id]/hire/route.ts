import { NextResponse } from "next/server";
import { appendAudit, getWorld } from "@/lib/store";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const world = getWorld();
  const idx = world.marketplace.findIndex((h) => h.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found in marketplace." }, { status: 404 });
  }

  const [hire] = world.marketplace.splice(idx, 1);
  hire.hiredAt = new Date().toISOString();
  if (hire.type === "agent") {
    hire.mode = "suggest";
  }
  world.roster.push(hire);

  appendAudit({
    actor: "human",
    action: `Hired ${hire.name} from the marketplace`,
    details: { hireId: hire.id, type: hire.type },
  });

  return NextResponse.json(hire);
}

import { NextResponse } from "next/server";
import { resetWorld } from "@/lib/store";

export async function POST() {
  const world = resetWorld();
  return NextResponse.json(world);
}

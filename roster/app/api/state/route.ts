import { NextResponse } from "next/server";
import { getWorld } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getWorld());
}

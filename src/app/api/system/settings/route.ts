import { NextResponse } from "next/server";
import { getSystemSettings } from "@/lib/system-settings";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET() {
  const settings = await getSystemSettings();
  return NextResponse.json(settings, {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
}

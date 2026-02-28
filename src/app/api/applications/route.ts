import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { requireModulePermission } from "@/lib/permissions/mbac";
import { NextResponse } from "next/server";
import * as crypto from "node:crypto";

export async function POST(req: Request) {
  try {
    // Apenas quem tem permissão FULL ou WRITE no módulo 'applications'
    await requireModulePermission("applications", "WRITE");

    const body = await req.json();
    const { name, slug } = body;

    const apiKey = `ey_${crypto.randomBytes(16).toString("hex")}`;

    const [newApp] = await db
      .insert(applications)
      .values({
        name,
        slug,
        apiKey,
      })
      .returning();

    return NextResponse.json(newApp);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export async function GET() {
  try {
    await requireModulePermission("applications", "READ");
    const allApps = await db.select().from(applications);
    return NextResponse.json(allApps);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

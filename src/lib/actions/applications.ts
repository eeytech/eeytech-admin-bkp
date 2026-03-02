"use server";

import crypto from "crypto";
import { eq } from "drizzle-orm";
import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { applications, modules } from "@/lib/db/schema";
import { requireModulePermission } from "@/lib/permissions/mbac";

const actionClient = createSafeActionClient();

export const createApplicationAction = actionClient
  .schema(
    z.object({
      name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
      slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
    }),
  )
  .action(async ({ parsedInput: { name, slug } }) => {
    await requireModulePermission("applications", "WRITE", "eeytech-admin");
    const apiKey = `ey_${crypto.randomBytes(16).toString("hex")}`;
    await db.insert(applications).values({ name, slug, apiKey, isActive: true });
    revalidatePath("/dashboard/applications");
    return { success: true };
  });

export const createModuleAction = actionClient
  .schema(
    z.object({
      applicationId: z.string().uuid(),
      name: z.string().min(2),
      slug: z.string().min(2),
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireModulePermission("applications", "WRITE", "eeytech-admin");

    await db.insert(modules).values({
      applicationId: parsedInput.applicationId,
      name: parsedInput.name,
      slug: parsedInput.slug,
    });

    revalidatePath("/dashboard/applications");
    return { success: true };
  });

export const deleteApplicationAction = actionClient
  .schema(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput: { id } }) => {
    await requireModulePermission("applications", "WRITE", "eeytech-admin");
    await db.delete(applications).where(eq(applications.id, id));
    revalidatePath("/dashboard/applications");
    return { success: true };
  });

export const toggleApplicationActiveAction = actionClient
  .schema(
    z.object({
      id: z.string().uuid(),
      isActive: z.boolean(),
    }),
  )
  .action(async ({ parsedInput: { id, isActive } }) => {
    await requireModulePermission("applications", "WRITE", "eeytech-admin");

    await db
      .update(applications)
      .set({ isActive })
      .where(eq(applications.id, id));

    revalidatePath("/dashboard/applications");
    return { success: true };
  });

export const updateApplicationAction = actionClient
  .schema(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(3),
      slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
      apiKey: z.string().min(8),
      isActive: z.boolean(),
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireModulePermission("applications", "WRITE", "eeytech-admin");

    await db
      .update(applications)
      .set({
        name: parsedInput.name,
        slug: parsedInput.slug,
        apiKey: parsedInput.apiKey,
        isActive: parsedInput.isActive,
      })
      .where(eq(applications.id, parsedInput.id));

    revalidatePath("/dashboard/applications");
    revalidatePath(`/dashboard/applications/${parsedInput.id}/settings`);
    return { success: true };
  });

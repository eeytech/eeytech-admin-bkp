"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

const actionClient = createSafeActionClient();

const updateSettingsSchema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  url: z.string().url("URL inválida"),
  sessionTimeout: z.string().min(1, "Obrigatório"),
});

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export const updateSettingsAction = actionClient
  .schema(updateSettingsSchema)
  .action(async ({ parsedInput }) => {
    await db.insert(systemSettings)
      .values({
        id: SETTINGS_ID,
        instanceName: parsedInput.name,
        apiUrl: parsedInput.url,
        sessionTimeout: parsedInput.sessionTimeout,
      })
      .onConflictDoUpdate({ // <--- Nome correto do método
        target: systemSettings.id,
        set: {
          instanceName: parsedInput.name,
          apiUrl: parsedInput.url,
          sessionTimeout: parsedInput.sessionTimeout,
          updatedAt: new Date(),
        },
      });

    revalidatePath("/dashboard/settings");
    return { success: true };
  });
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
  sessionTimeout: z.coerce
    .number()
    .int("Informe um número inteiro")
    .min(1, "Mínimo de 1 minuto")
    .max(1440, "Máximo de 1440 minutos"),
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
        sessionTimeout: String(parsedInput.sessionTimeout),
      })
      .onConflictDoUpdate({ // <--- Nome correto do método
        target: systemSettings.id,
        set: {
          instanceName: parsedInput.name,
          apiUrl: parsedInput.url,
          sessionTimeout: String(parsedInput.sessionTimeout),
          updatedAt: new Date(),
        },
      });

    revalidatePath("/dashboard/settings");
    return { success: true };
  });

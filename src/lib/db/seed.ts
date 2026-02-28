import { db } from "./index";
import { applications, users, userModulePermissions } from "./schema";
import { hashPassword } from "../auth/password";
import * as crypto from "node:crypto";

async function main() {
  console.log("🌱 Iniciando Seed...");

  try {
    // 1. Criar a aplicação central (Admin)
    const [adminApp] = await db
      .insert(applications)
      .values({
        name: "Admin Eeytech",
        slug: "admin-platform",
        apiKey: `ey_${Math.random().toString(36).substring(2, 15)}`,
      })
      .onConflictDoNothing()
      .returning();

    // Se já existia, buscamos ela
    const appToUse =
      adminApp ||
      (await db.query.applications.findFirst({
        where: (apps, { eq }) => eq(apps.slug, "admin-platform"),
      }));

    if (!appToUse)
      throw new Error("Falha ao criar/encontrar aplicação admin-platform");

    // 2. Criar seu usuário mestre
    const password = "Mudar_Essa_Senha_123"; // ALTERE DEPOIS!
    const hashed = await hashPassword(password);

    const [adminUser] = await db
      .insert(users)
      .values({
        email: "admin@eeytech.com", // ALTERE PARA O SEU EMAIL!
        passwordHash: hashed,
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    const userToUse =
      adminUser ||
      (await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, "admin@eeytech.com"),
      }));

    if (!userToUse) throw new Error("Falha ao criar/encontrar usuário admin");

    // 3. Dar permissões totais nos módulos principais
    const initialModules = [
      "users",
      "applications",
      "modules",
      "tickets",
      "audit",
      "settings",
    ];

    console.log("🔑 Atribuindo permissões...");
    for (const moduleSlug of initialModules) {
      await db
        .insert(userModulePermissions)
        .values({
          userId: userToUse.id,
          applicationId: appToUse.id,
          moduleSlug: moduleSlug,
          actions: ["FULL"],
        })
        .onConflictDoNothing();
    }

    console.log("✅ Seed finalizado com sucesso!");
    console.log(`---`);
    console.log(`Usuário: ${userToUse.email}`);
    console.log(`App Slug: admin-platform`);
    console.log(`---`);
  } catch (error) {
    console.error("❌ Erro durante o Seed:", error);
  } finally {
    process.exit(0);
  }
}

main();

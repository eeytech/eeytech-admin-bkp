import { db } from "./index";
import { applications, userModulePermissions, users } from "./schema";
import { hashPassword } from "../auth/password";

async function main() {
  console.log("Iniciando seed...");

  try {
    // MBAC expects this exact slug.
    const adminApiKey = process.env.ADMIN_API_KEY ?? "eeytech-admin-local-key";

    const [adminApp] = await db
      .insert(applications)
      .values({
        name: "Eeytech Admin",
        slug: "eeytech-admin",
        apiKey: adminApiKey,
      })
      .onConflictDoUpdate({
        target: applications.slug,
        set: {
          name: "Eeytech Admin",
          apiKey: adminApiKey,
        },
      })
      .returning();

    console.log(`Aplicacao Admin configurada: ${adminApp.slug}`);

    const adminEmail = "admin@eeytech.com.br";
    const hashedPassword = await hashPassword("admin123");

    const [adminUser] = await db
      .insert(users)
      .values({
        email: adminEmail,
        passwordHash: hashedPassword,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          passwordHash: hashedPassword,
          isActive: true,
        },
      })
      .returning();

    await db
      .insert(userModulePermissions)
      .values({
        userId: adminUser.id,
        applicationId: adminApp.id,
        moduleSlug: "users",
        actions: ["FULL"],
      })
      .onConflictDoUpdate({
        target: [
          userModulePermissions.userId,
          userModulePermissions.applicationId,
          userModulePermissions.moduleSlug,
        ],
        set: {
          actions: ["FULL"],
        },
      });

    console.log(`Usuario mestre configurado: ${adminUser.email}`);
    console.log("Seed finalizado com sucesso!");
  } catch (error) {
    console.error("Erro durante o seed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

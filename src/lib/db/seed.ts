import { and, eq } from "drizzle-orm";
import { hashPassword } from "../auth/password";
import { db } from "./index";
import {
  applications,
  modules,
  rolePermissions,
  roles,
  userRoles,
  users,
} from "./schema";

async function ensureModule(applicationId: string, name: string, slug: string) {
  const existing = await db.query.modules.findFirst({
    where: and(eq(modules.applicationId, applicationId), eq(modules.slug, slug)),
  });

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(modules)
    .values({ applicationId, name, slug })
    .returning();
  return created;
}

async function main() {
  console.log("Iniciando seed...");

  try {
    const adminApiKey = process.env.ADMIN_API_KEY ?? "eeytech-admin-local-key";

    const [adminApp] = await db
      .insert(applications)
      .values({
        name: "Eeytech Admin",
        slug: "eeytech-admin",
        apiKey: adminApiKey,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: applications.slug,
        set: {
          name: "Eeytech Admin",
          apiKey: adminApiKey,
          isActive: true,
        },
      })
      .returning();

    await ensureModule(adminApp.id, "Usuarios", "users");
    await ensureModule(adminApp.id, "Aplicacoes", "applications");
    await ensureModule(adminApp.id, "Perfis", "roles");
    await ensureModule(adminApp.id, "Chamados", "tickets");
    await ensureModule(adminApp.id, "Configuracoes", "settings");

    const existingAdminRole = await db.query.roles.findFirst({
      where: and(
        eq(roles.applicationId, adminApp.id),
        eq(roles.slug, "administrador"),
      ),
    });

    const adminRole = existingAdminRole
      ? (
          await db
            .update(roles)
            .set({
              name: "Administrador",
              description: "Acesso total ao admin",
            })
            .where(eq(roles.id, existingAdminRole.id))
            .returning()
        )[0]
      : (
          await db
            .insert(roles)
            .values({
              applicationId: adminApp.id,
              name: "Administrador",
              slug: "administrador",
              description: "Acesso total ao admin",
            })
            .returning()
        )[0];

    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, adminRole.id));
    await db.insert(rolePermissions).values([
      { roleId: adminRole.id, moduleSlug: "users", actions: ["FULL"] },
      { roleId: adminRole.id, moduleSlug: "applications", actions: ["FULL"] },
      { roleId: adminRole.id, moduleSlug: "roles", actions: ["FULL"] },
      { roleId: adminRole.id, moduleSlug: "tickets", actions: ["FULL"] },
      { roleId: adminRole.id, moduleSlug: "settings", actions: ["FULL"] },
    ]);

    const adminEmail = "admin@eeytech.com.br";
    const hashedPassword = await hashPassword("admin123");

    const [adminUser] = await db
      .insert(users)
      .values({
        name: "Administrador",
        email: adminEmail,
        passwordHash: hashedPassword,
        applicationId: adminApp.id,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          name: "Administrador",
          passwordHash: hashedPassword,
          applicationId: adminApp.id,
          isActive: true,
        },
      })
      .returning();

    await db.delete(userRoles).where(eq(userRoles.userId, adminUser.id));
    await db.insert(userRoles).values({ userId: adminUser.id, roleId: adminRole.id });

    console.log(`Aplicacao Admin configurada: ${adminApp.slug}`);
    console.log(`Usuario mestre configurado: ${adminUser.email}`);
    console.log("Seed finalizado com sucesso");
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

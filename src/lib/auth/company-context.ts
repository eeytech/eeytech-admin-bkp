import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, userCompanies } from "@/lib/db/schema";
import type { JWTPayload } from "@/lib/auth/jwt";

export type ResolvedCompanyContext = {
  activeCompanyId: string;
  companyIds: string[];
  companies: { id: string; name: string }[];
};

export async function resolveUserCompanyContext(
  user: {
    id: string;
    applicationId: string;
    isApplicationAdmin: boolean;
  },
  requestedCompanyId?: string,
): Promise<ResolvedCompanyContext> {
  const accessibleCompanies = user.isApplicationAdmin
    ? await db.query.companies.findMany({
        columns: { id: true, name: true },
        where: and(
          eq(companies.applicationId, user.applicationId),
          eq(companies.status, "active"),
        ),
        orderBy: (table, { asc }) => [asc(table.name)],
      })
    : await db
        .select({ id: companies.id, name: companies.name })
        .from(userCompanies)
        .innerJoin(companies, eq(userCompanies.companyId, companies.id))
        .where(
          and(
            eq(userCompanies.userId, user.id),
            eq(companies.applicationId, user.applicationId),
            eq(companies.status, "active"),
          ),
        );

  if (accessibleCompanies.length === 0) {
    throw new Error("Usuario sem acesso a empresas ativas");
  }

  const companyIds = accessibleCompanies.map((company) => company.id);

  const activeCompanyId = requestedCompanyId && companyIds.includes(requestedCompanyId)
    ? requestedCompanyId
    : companyIds[0];

  return {
    activeCompanyId,
    companyIds,
    companies: accessibleCompanies,
  };
}

export async function validateCompanyAccessFromPayload(
  payload: JWTPayload,
  companyId: string,
) {
  const activeCompany = await db.query.companies.findFirst({
    columns: { id: true, applicationId: true, status: true },
    where: eq(companies.id, companyId),
  });

  if (!activeCompany) {
    return false;
  }

  if (activeCompany.applicationId !== payload.applicationId) {
    return false;
  }

  if (activeCompany.status !== "active") {
    return false;
  }

  if (payload.isApplicationAdmin) {
    return true;
  }

  if (payload.companyIds.includes(companyId)) {
    return true;
  }

  const directLink = await db.query.userCompanies.findFirst({
    where: and(
      eq(userCompanies.userId, payload.sub),
      eq(userCompanies.companyId, companyId),
    ),
  });

  return Boolean(directLink);
}

export async function validateCompaniesBelongToApplication(
  applicationId: string,
  companyIds: string[],
) {
  if (companyIds.length === 0) {
    return [];
  }

  const validCompanies = await db.query.companies.findMany({
    where: and(
      inArray(companies.id, companyIds),
      eq(companies.applicationId, applicationId),
      eq(companies.status, "active"),
    ),
  });

  return validCompanies;
}


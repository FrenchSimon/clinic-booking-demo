import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { memberships } from "@/features/clinics/table";
import { withRls } from "@/lib/db";
import { type Service, servicePractitioners, services } from "./table";

export type ServiceRow = Service & { physios: string[] };

/** The clinic's services, shown first, with the names of the physios who offer each. */
export async function listServices(
  userId: string,
  clinicId: string,
): Promise<ServiceRow[]> {
  return withRls(userId, async (tx) => {
    const rows = await tx
      .select()
      .from(services)
      .where(eq(services.clinicId, clinicId))
      .orderBy(asc(services.name));
    const links = await tx
      .select({
        serviceId: servicePractitioners.serviceId,
        name: memberships.displayName,
      })
      .from(servicePractitioners)
      .innerJoin(
        memberships,
        eq(memberships.id, servicePractitioners.membershipId),
      )
      .where(eq(servicePractitioners.clinicId, clinicId))
      .orderBy(asc(memberships.displayName));
    return rows
      .map((s) => ({
        ...s,
        physios: links
          .filter((l) => l.serviceId === s.id)
          .map((l) => l.name ?? "Physio"),
      }))
      .sort((x, y) => Number(y.active) - Number(x.active));
  });
}

/** One service of the clinic with the membership ids of its physios, or null. */
export async function getService(
  userId: string,
  clinicId: string,
  serviceId: string,
): Promise<(Service & { practitionerIds: string[] }) | null> {
  return withRls(userId, async (tx) => {
    const [service] = await tx
      .select()
      .from(services)
      .where(and(eq(services.clinicId, clinicId), eq(services.id, serviceId)));
    if (!service) return null;
    const links = await tx
      .select({ id: servicePractitioners.membershipId })
      .from(servicePractitioners)
      .where(eq(servicePractitioners.serviceId, serviceId));
    return { ...service, practitionerIds: links.map((l) => l.id) };
  });
}

/** True when the clinic has at least one service, hidden ones included. */
export async function hasServices(
  userId: string,
  clinicId: string,
): Promise<boolean> {
  const rows = await withRls(userId, (tx) =>
    tx
      .select({ id: services.id })
      .from(services)
      .where(eq(services.clinicId, clinicId))
      .limit(1),
  );
  return rows.length > 0;
}

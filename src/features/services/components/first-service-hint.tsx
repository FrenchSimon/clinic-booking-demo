import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { hasServices } from "../queries";

/** Owners only: shown on Today until the clinic has its first service. */
export async function FirstServiceHint({
  userId,
  clinicId,
}: {
  userId: string;
  clinicId: string;
}) {
  if (await hasServices(userId, clinicId)) return null;
  return (
    <section
      aria-labelledby="first-service-title"
      className="flex flex-col gap-3 rounded-[18px] border bg-accent p-5 sm:p-8"
    >
      <h2
        id="first-service-title"
        className="font-heading font-semibold text-xl"
      >
        Add your first service
      </h2>
      <p>
        Patients book a session type, like an initial assessment, with its
        length and price. Add the sessions you offer and the physios who give
        them.
      </p>
      <Link
        href="/clinic/services/new"
        className={buttonVariants({ className: "self-start" })}
      >
        Add a service
      </Link>
    </section>
  );
}

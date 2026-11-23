import { getDictionary } from "@/i18n/server";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "../table";

// Always a label, never a color alone (DESIGN.md, booking statuses). The
// labels are in the dictionary (booking.status).
const STATUS: Record<BookingStatus, string> = {
  confirmed: "bg-status-confirmed text-status-confirmed-foreground",
  pending_payment: "bg-status-pending text-status-pending-foreground",
  expired: "bg-status-closed text-status-closed-foreground",
  cancelled: "bg-status-closed text-status-closed-foreground",
  refunded: "bg-status-closed text-status-closed-foreground",
};

export async function StatusPill({ status }: { status: BookingStatus }) {
  const { t } = await getDictionary();
  const label = t.booking.status[status];
  const className = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 font-semibold text-xs",
        className,
      )}
    >
      {label}
    </span>
  );
}

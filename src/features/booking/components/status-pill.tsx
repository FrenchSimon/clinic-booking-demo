import { cn } from "@/lib/utils";
import type { BookingStatus } from "../table";

// Always a label, never a color alone (DESIGN.md, booking statuses).
const STATUS: Record<BookingStatus, { label: string; className: string }> = {
  confirmed: {
    label: "Confirmed",
    className: "bg-status-confirmed text-status-confirmed-foreground",
  },
  pending_payment: {
    label: "Pending payment",
    className: "bg-status-pending text-status-pending-foreground",
  },
  expired: {
    label: "Not paid",
    className: "bg-status-closed text-status-closed-foreground",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-status-closed text-status-closed-foreground",
  },
  refunded: {
    label: "Refunded",
    className: "bg-status-closed text-status-closed-foreground",
  },
};

export function StatusPill({ status }: { status: BookingStatus }) {
  const { label, className } = STATUS[status];
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

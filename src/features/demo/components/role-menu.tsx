"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  type KeyboardEvent,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { MembershipRole } from "@/features/clinics/table";
import { cn } from "@/lib/utils";
import { type DemoState, viewAs } from "../actions";

const ROLES: { role: MembershipRole; label: string }[] = [
  { role: "owner", label: "Owner" },
  { role: "practitioner", label: "Practitioner" },
  { role: "patient", label: "Patient" },
];

/**
 * "View the demo as" (checklist #20): a menu of the three roles. Each one
 * changes the visitor's real role on the server; the checked one is the
 * role they hold now. Closes on a click outside, Escape or a choice; the
 * arrow keys move between roles.
 */
export function RoleMenu({ current }: { current: MembershipRole }) {
  const [state, action, pending] = useActionState<DemoState, FormData>(
    viewAs,
    {},
  );
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();
  const label = ROLES.find((r) => r.role === current)?.label ?? "Owner";

  useEffect(() => {
    if (!open) return;
    items.current[ROLES.findIndex((r) => r.role === current)]?.focus();
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open, current]);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      button.current?.focus();
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const at = items.current.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    const step = e.key === "ArrowDown" ? 1 : -1;
    items.current[(at + step + ROLES.length) % ROLES.length]?.focus();
  }

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={pending}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-demo-foreground/35 px-3 font-semibold disabled:opacity-80 sm:px-3.5"
      >
        <span className="sr-only">View the demo as </span>
        {pending ? "Switching…" : label}
        <ChevronDown aria-hidden="true" className="size-4" />
      </button>
      <form action={action} hidden={!open}>
        <div
          id={menuId}
          role="menu"
          aria-label="View the demo as"
          onKeyDown={onKeyDown}
          className="absolute top-[calc(100%+6px)] right-0 z-50 flex w-[230px] flex-col rounded-[14px] border bg-card p-1.5 text-foreground shadow-[0_8px_24px_rgba(30,43,36,0.16)]"
        >
          <span
            aria-hidden="true"
            className="px-3 py-1.5 text-muted-foreground text-xs"
          >
            View the demo as
          </span>
          {ROLES.map(({ role, label }, i) => (
            <button
              key={role}
              ref={(el) => {
                items.current[i] = el;
              }}
              type="submit"
              name="role"
              value={role}
              role="menuitemradio"
              aria-checked={role === current}
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className={cn(
                "flex min-h-11 items-center justify-between rounded-[10px] px-3 text-left focus-visible:outline-2 focus-visible:outline-primary",
                role === current ? "bg-accent font-semibold" : "hover:bg-muted",
              )}
            >
              {label}
              {role === current && (
                <Check aria-hidden="true" className="size-4" />
              )}
            </button>
          ))}
        </div>
      </form>
      {state.error && (
        <p
          role="alert"
          className="absolute top-full right-0 z-50 mt-1.5 w-60 rounded-[10px] bg-card p-3 text-foreground"
        >
          {state.error}
        </p>
      )}
    </div>
  );
}

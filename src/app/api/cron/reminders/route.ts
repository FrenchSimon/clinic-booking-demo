import { handleRemindersCron } from "@/features/booking/reminders-cron";

// Vercel calls this once a day (vercel.json) to send tomorrow's reminders
// (checklist #15). No requireUser(): there is no signed-in user, the
// CRON_SECRET bearer token is the check.
export function GET(request: Request): Promise<Response> {
  return handleRemindersCron(request);
}

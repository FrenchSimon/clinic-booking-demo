import { handleDemoCleanupCron } from "@/features/demo/cleanup";

// Vercel calls this once a day (vercel.json) to delete the demo clinics older
// than 24 hours (checklist #19) and the assistant's question counts of past
// days (checklist #18). "Try the demo" also cleans up on each new
// visitor. No requireUser(): the CRON_SECRET bearer token is the check.
export function GET(request: Request): Promise<Response> {
  return handleDemoCleanupCron(request);
}

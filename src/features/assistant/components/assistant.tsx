import { getDictionary } from "@/i18n/server";
import { AssistantChat } from "./assistant-chat";

/**
 * "Questions? Ask us" on the booking page (checklist #18), in the page's
 * language: the chat itself is a client component and gets its strings here.
 */
export async function Assistant({
  slug,
  clinic,
}: {
  slug: string;
  clinic: string;
}) {
  const { locale, t } = await getDictionary();
  return (
    <AssistantChat
      slug={slug}
      clinic={clinic}
      locale={locale}
      t={t.assistant.chat}
    />
  );
}

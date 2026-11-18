"use client";

import { ArrowRight, ChevronLeft, MessageCircle } from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { askAssistant } from "../actions";
import { AssistantThread, type Message } from "./assistant-thread";

const FALLBACK = "The assistant is resting, you can still book below.";
const LIMIT = `That's all the questions for today. ${FALLBACK}`;

/**
 * "Questions? Ask us" and the chat it opens (checklist #18). A native
 * <dialog> gives focus handling and Escape for free. The thread lives in
 * this component only: nothing is stored.
 */
export function Assistant({ slug, clinic }: { slug: string; clinic: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, startTransition] = useTransition();

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on each new message
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages, pending]);

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const question = String(new FormData(form).get("question") ?? "").trim();
    if (!question || pending) return;
    form.reset();
    const thread: Message[] = [
      ...messages,
      { role: "user", content: question },
    ];
    setMessages(thread);
    startTransition(async () => {
      const turns = thread
        .filter((m) => !m.fallback)
        .map(({ role, content }) => ({ role, content }));
      const result = await askAssistant({ slug, turns }).catch(() => null);
      const reply: Message =
        result && "reply" in result
          ? { role: "assistant", content: result.reply, slot: result.slot }
          : {
              role: "assistant",
              content: result?.error === "limit" ? LIMIT : FALLBACK,
              fallback: true,
            };
      setMessages((current) => [...current, reply]);
    });
  }

  const close = () => dialog.current?.close();

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
        className="inline-flex min-h-13 items-center gap-2.5 rounded-full bg-foreground py-0 pr-5 pl-4 font-semibold text-background shadow-lg"
      >
        <MessageCircle aria-hidden className="size-5" />
        Questions? Ask us
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="assistant-title"
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none flex-col bg-background text-foreground open:flex backdrop:bg-foreground/40 sm:left-auto sm:w-[420px] sm:border-l"
      >
        <header className="flex items-center gap-1.5 border-b py-3 pr-3 pl-2">
          <Button
            variant="ghost"
            aria-label="Back to booking"
            onClick={close}
            className="size-11 px-0"
          >
            <ChevronLeft aria-hidden className="size-6" />
          </Button>
          <div className="flex flex-col">
            <h2
              id="assistant-title"
              className="font-heading font-semibold text-primary text-xl"
            >
              Ask {clinic}
            </h2>
            <p className="text-muted-foreground text-sm">
              Prices, opening hours and free slots
            </p>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <AssistantThread
            messages={messages}
            pending={pending}
            onPickSlot={close}
          />
          <div ref={end} />
        </div>
        <form
          onSubmit={send}
          aria-label="Ask a question"
          className="flex flex-col gap-2 border-t bg-card px-3 pt-3 pb-4"
        >
          <Label htmlFor="assistant-question">Your question</Label>
          <div className="flex gap-2">
            <Input
              id="assistant-question"
              name="question"
              type="text"
              autoComplete="off"
              enterKeyHint="send"
              maxLength={500}
              required
              placeholder="Are you open on Saturday?"
              className="min-h-12 rounded-full bg-muted px-4 text-base"
            />
            <Button
              type="submit"
              aria-label="Send"
              disabled={pending}
              className="size-12 px-0"
            >
              <ArrowRight aria-hidden className="size-5" />
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}

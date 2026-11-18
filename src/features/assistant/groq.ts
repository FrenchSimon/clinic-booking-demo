import "server-only";
import { z } from "zod";
import { env } from "@/lib/env";

// Groq's chat API, in the OpenAI format: replacing the provider means
// changing this file only. Free models only (checklist #18): gpt-oss-120b,
// then gpt-oss-20b if the first one is down or out of quota.

const URL = "https://api.groq.com/openai/v1/chat/completions";
const MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];
const TIMEOUT_MS = 10_000;

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; name: string; content: string };

const reply = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().nullish(),
          tool_calls: z
            .array(
              z.object({
                id: z.string(),
                type: z.literal("function"),
                function: z.object({ name: z.string(), arguments: z.string() }),
              }),
            )
            .nullish(),
        }),
      }),
    )
    .min(1),
});

export type Completion = { content: string; toolCalls: ToolCall[] };

/** True when a Groq key is set: without it, the assistant stays off. */
export function groqConfigured(): boolean {
  return Boolean(env.GROQ_API_KEY);
}

/** One model turn. Throws when every model fails, so the caller shows the fallback. */
export async function complete(
  messages: ChatMessage[],
  tools: readonly object[],
): Promise<Completion> {
  let lastError: unknown = new Error("GROQ_API_KEY is not set");
  for (const model of env.GROQ_API_KEY ? MODELS : []) {
    try {
      return await completeWith(model, messages, tools, env.GROQ_API_KEY);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function completeWith(
  model: string,
  messages: ChatMessage[],
  tools: readonly object[],
  key = "",
): Promise<Completion> {
  const response = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      // The last turn sends no tool, so the model has to answer in words.
      tools: tools.length > 0 ? tools : undefined,
      temperature: 0.2,
      reasoning_effort: "low",
      include_reasoning: false,
      max_completion_tokens: 800,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Groq ${model}: HTTP ${response.status}`);
  const message = reply.parse(await response.json()).choices[0]?.message;
  return {
    content: message?.content?.trim() ?? "",
    toolCalls: message?.tool_calls ?? [],
  };
}

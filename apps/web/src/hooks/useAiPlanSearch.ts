import { useMemo, useState } from "react";
import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { apiUrl } from "../lib/api";
import type { Filters } from "../types/plan";

type Options = {
  onParsed: (filters: Filters, payload: unknown) => void;
  onStart: () => void;
};

export function useAiPlanSearch({ onParsed, onStart }: Options) {
  const [prompt, setPrompt] = useState("");
  const { messages, sendMessage, isLoading, error } = useChat({
    connection: fetchServerSentEvents(apiUrl("/api/chat")),
    onFinish: (message) => {
      for (const part of message.parts) {
        if (part.type !== "tool-call" || part.name !== "parse_floor_plan_filters" || !part.output) continue;
        const output = part.output as { filters: Filters };
        onParsed(output.filters, {
          source: "parse_floor_plan_filters", receivedAt: new Date().toISOString(), ...output,
        });
      }
    },
  });

  const assistantText = useMemo(() => [...messages].reverse()
    .find((message) => message.role === "assistant")?.parts
    .filter((part) => part.type === "text")
    .map((part) => part.content).join("") ?? "", [messages]);

  async function submit() {
    const message = prompt.trim();
    if (!message) return;
    setPrompt("");
    onStart();
    await sendMessage(message);
  }

  return { prompt, setPrompt, submit, isLoading, error, assistantText };
}

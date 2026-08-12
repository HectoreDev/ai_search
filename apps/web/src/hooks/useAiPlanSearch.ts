import { useMemo, useState } from "react";
import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { apiUrl } from "../lib/api";
import type { Filters, SearchResponse } from "../types/plan";

type Options = {
  onResults: (filters: Filters, results: SearchResponse, payload: unknown) => void;
  onStart: () => void;
};

export function useAiPlanSearch({ onResults, onStart }: Options) {
  const [prompt, setPrompt] = useState("");
  const { messages, sendMessage, isLoading, error } = useChat({
    connection: fetchServerSentEvents(apiUrl("/api/chat")),
    onFinish: (message) => {
      for (const part of message.parts) {
        if (part.type !== "tool-call" || part.name !== "search_floor_plans" || !part.output) continue;
        const output = part.output as { filters: Filters; results: SearchResponse };
        onResults(output.filters, output.results, {
          source: "search_floor_plans", receivedAt: new Date().toISOString(), ...output,
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

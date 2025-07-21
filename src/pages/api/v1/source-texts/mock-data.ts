import type { SourceTextResponse } from "./types";

export function createMockSourceText(textContent: string): SourceTextResponse {
  const newId = `text-${Date.now()}`;
  const now = new Date().toISOString();

  return {
    id: newId,
    textContent,
    createdAt: now,
  };
}

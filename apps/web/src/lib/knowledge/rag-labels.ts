export function ragProviderLabel(provider: string | undefined): string {
  if (provider === "GEMINI_FILE_SEARCH") return "Gemini File Search";
  return "pgvector (local)";
}

import type { RagChunk } from "@agenttoruk/shared";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const UPLOAD_BASE = "https://generativelanguage.googleapis.com/upload/v1beta";

export interface GeminiOperation {
  name: string;
  done?: boolean;
  error?: { message?: string; code?: number };
  response?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface GeminiFileSearchStore {
  name: string;
  displayName?: string;
}

interface GroundingChunk {
  retrievedContext?: {
    uri?: string;
    title?: string;
    text?: string;
  };
  web?: {
    uri?: string;
    title?: string;
  };
}

interface GenerateContentResponse {
  candidates?: Array<{
    groundingMetadata?: {
      groundingChunks?: GroundingChunk[];
      groundingSupports?: Array<{
        confidenceScores?: number[];
        groundingChunkIndices?: number[];
      }>;
    };
  }>;
}

export class GeminiFileSearchClient {
  private readonly apiKey: string;
  private readonly searchModel: string;

  constructor(apiKey: string, searchModel = "gemini-2.0-flash") {
    this.apiKey = apiKey;
    this.searchModel = searchModel;
  }

  private url(path: string, upload = false): string {
    const base = upload ? UPLOAD_BASE : API_BASE;
    const separator = path.includes("?") ? "&" : "?";
    return `${base}${path}${separator}key=${this.apiKey}`;
  }

  private async parseError(response: Response): Promise<string> {
    const text = await response.text();
    try {
      const json = JSON.parse(text) as { error?: { message?: string } };
      return json.error?.message ?? text;
    } catch {
      return text;
    }
  }

  async createStore(displayName: string): Promise<GeminiFileSearchStore> {
    const response = await fetch(this.url("/fileSearchStores"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create File Search store: ${await this.parseError(response)}`,
      );
    }

    return (await response.json()) as GeminiFileSearchStore;
  }

  async uploadToStore(input: {
    storeName: string;
    displayName: string;
    mimeType: string;
    data: Buffer;
    filename: string;
    customMetadata?: Array<{ key: string; stringValue: string }>;
  }): Promise<GeminiOperation> {
    const form = new FormData();
    form.append("displayName", input.displayName);
    form.append("mimeType", input.mimeType);
    if (input.customMetadata?.length) {
      form.append("customMetadata", JSON.stringify(input.customMetadata));
    }
    form.append(
      "file",
      new Blob([new Uint8Array(input.data)], { type: input.mimeType }),
      input.filename,
    );

    const path = `/${input.storeName}:uploadToFileSearchStore`;
    const response = await fetch(this.url(path, true), {
      method: "POST",
      headers: { Accept: "application/json" },
      body: form,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to upload to File Search store: ${await this.parseError(response)}`,
      );
    }

    return (await response.json()) as GeminiOperation;
  }

  async getOperation(operationName: string): Promise<GeminiOperation> {
    const path = operationName.startsWith("/")
      ? operationName
      : `/${operationName}`;
    const response = await fetch(this.url(path), { method: "GET" });

    if (!response.ok) {
      throw new Error(
        `Failed to poll operation: ${await this.parseError(response)}`,
      );
    }

    return (await response.json()) as GeminiOperation;
  }

  async waitForOperation(
    operation: GeminiOperation,
    timeoutMs = 120_000,
  ): Promise<GeminiOperation> {
    const started = Date.now();
    let current = operation;

    while (!current.done) {
      if (Date.now() - started > timeoutMs) {
        throw new Error("File Search indexing timed out");
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      current = await this.getOperation(current.name);
    }

    if (current.error) {
      throw new Error(
        current.error.message ?? "File Search indexing failed",
      );
    }

    return current;
  }

  async deleteDocument(documentName: string): Promise<void> {
    const path = documentName.startsWith("/")
      ? documentName
      : `/${documentName}`;
    const response = await fetch(`${this.url(path)}&force=true`, {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(
        `Failed to delete File Search document: ${await this.parseError(response)}`,
      );
    }
  }

  async searchStore(input: {
    storeName: string;
    query: string;
    limit: number;
    documentIdMap: Map<string, { id: string; name: string }>;
  }): Promise<RagChunk[]> {
    const response = await fetch(
      this.url(`/models/${this.searchModel}:generateContent`),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Find the most relevant knowledge base excerpts for this question. Be brief.\n\nQuestion: ${input.query}`,
                },
              ],
            },
          ],
          tools: [
            {
              fileSearch: {
                fileSearchStoreNames: [input.storeName],
              },
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 256,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `File Search query failed: ${await this.parseError(response)}`,
      );
    }

    const data = (await response.json()) as GenerateContentResponse;
    const metadata = data.candidates?.[0]?.groundingMetadata;
    const chunks = metadata?.groundingChunks ?? [];
    const supports = metadata?.groundingSupports ?? [];

    const scoreByIndex = new Map<number, number>();
    for (const support of supports) {
      const indices = support.groundingChunkIndices ?? [];
      const scores = support.confidenceScores ?? [];
      indices.forEach((index, i) => {
        const score = scores[i] ?? scores[0] ?? 0.75;
        const existing = scoreByIndex.get(index);
        if (existing == null || score > existing) {
          scoreByIndex.set(index, score);
        }
      });
    }

    const results: RagChunk[] = [];

    chunks.forEach((chunk, index) => {
      const retrieved = chunk.retrievedContext;
      const web = chunk.web;
      const text = retrieved?.text ?? retrieved?.title ?? web?.title;
      if (!text?.trim()) return;

      const uri = retrieved?.uri ?? web?.uri ?? "";
      const title = retrieved?.title ?? web?.title ?? "Knowledge document";
      const mapped = resolveDocumentMapping(uri, title, input.documentIdMap);

      results.push({
        id: uri || `gemini-chunk-${index}`,
        content: text,
        documentId: mapped.id,
        documentName: mapped.name,
        score: scoreByIndex.get(index) ?? 0.75,
        metadata: uri ? { uri } : undefined,
      });
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, input.limit);
  }
}

function resolveDocumentMapping(
  uri: string,
  fallbackTitle: string,
  documentIdMap: Map<string, { id: string; name: string }>,
): { id: string; name: string } {
  for (const [externalId, doc] of Array.from(documentIdMap.entries())) {
    if (uri && (uri.includes(externalId) || externalId.includes(uri))) {
      return doc;
    }
  }

  for (const doc of Array.from(documentIdMap.values())) {
    if (doc.name === fallbackTitle) {
      return doc;
    }
  }

  const first = documentIdMap.values().next().value;
  return first ?? { id: "unknown", name: fallbackTitle };
}

export function extractDocumentName(operation: GeminiOperation): string | null {
  const response = operation.response;
  if (!response) return null;

  if (typeof response.name === "string") {
    return response.name;
  }

  const document = response.document as { name?: string } | undefined;
  if (document?.name) return document.name;

  return null;
}

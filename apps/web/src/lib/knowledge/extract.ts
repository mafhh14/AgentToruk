import { readFile } from "fs/promises";
import path from "path";

export async function extractTextFromFile(
  filePath: string,
  mimeType?: string | null,
): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = await readFile(filePath);

  if (
    mimeType === "application/pdf" ||
    ext === ".pdf"
  ) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text ?? "";
    } finally {
      await parser.destroy();
    }
  }

  if (
    mimeType?.includes("text") ||
    ext === ".txt" ||
    ext === ".md"
  ) {
    return buffer.toString("utf-8");
  }

  throw new Error(`Unsupported file type: ${ext || mimeType || "unknown"}`);
}

export async function extractTextFromUrl(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "AgentToruk-Bot/1.0" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  const html = await response.text();
  return stripHtml(html);
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

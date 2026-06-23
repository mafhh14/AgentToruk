import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const widgetPath = path.join(
      process.cwd(),
      "..",
      "widget",
      "dist",
      "widget.iife.js",
    );
    const content = await readFile(widgetPath, "utf-8");
    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Widget not built. Run: npm run build -w @agenttoruk/widget" },
      { status: 404 },
    );
  }
}

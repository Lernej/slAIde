import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createReadStream, statSync } from "fs";
import { basename } from "path";
import { readFile as readFileCb } from "fs";
import { promisify } from "util";

export const runtime = "nodejs";

const readFile = promisify(readFileCb);

function stripFencesOutsideCode(html: string): string {
  const blocksRegex =
    /(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<pre\b[^>]*>[\s\S]*?<\/pre>)/gi;
  const parts = html.split(blocksRegex);
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;
    // Skip code-containing blocks (they match the regex exactly)
    if (
      /^<\/(?:script|style|pre)>/i.test(part) ||
      /^(?:<script|<style|<pre)/i.test(part)
    ) {
      continue;
    }
    // Operate only on non-code parts
    let cleaned = part;
    // Remove fence tokens appearing between tags or as standalone text
    cleaned = cleaned.replace(/>(\s*```[a-zA-Z]*\s*)</g, "><");
    cleaned = cleaned.replace(/>(\s*'''[a-zA-Z]*\s*)</g, "><");
    // Remove fence-only lines
    cleaned = cleaned.replace(/(^|\n)\s*```[a-zA-Z]*\s*(?=\n|$)/g, "$1");
    cleaned = cleaned.replace(/(^|\n)\s*'''[a-zA-Z]*\s*(?=\n|$)/g, "$1");
    // Remove any remaining raw fence tokens
    cleaned = cleaned.replace(/```[a-zA-Z]*/g, "");
    cleaned = cleaned.replace(/'''[a-zA-Z]*/g, "");
    parts[i] = cleaned;
  }
  return parts.join("");
}

function sanitizeHtmlStrayFences(html: string): string {
  let out = html;

  // Trim common fence wrappers at document edges
  out = out.replace(/^\s*```[a-zA-Z]*\s*/i, "");
  out = out.replace(/^\s*'''[a-zA-Z]*\s*/i, "");
  out = out.replace(/\s*```[a-zA-Z]*\s*$/i, "");
  out = out.replace(/\s*'''[a-zA-Z]*\s*$/i, "");

  // Remove fences outside of code/script/style/pre blocks
  out = stripFencesOutsideCode(out);

  return out;
}

// Streams an artifact (HTML or PDF) from disk to the client.
// Accepts either ?path=/absolute/path or an inline POST/JSON { html } for HTML-only responses.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  try {
    const stats = statSync(path);

    const isPdf = path.toLowerCase().endsWith(".pdf");
    const isHtml =
      path.toLowerCase().endsWith(".html") ||
      path.toLowerCase().endsWith(".htm");

    const headers = new Headers();
    headers.set("Cache-Control", "no-store");
    headers.set("Content-Disposition", `inline; filename="${basename(path)}"`);

    if (isPdf) {
      headers.set("Content-Length", String(stats.size));
      headers.set("Content-Type", "application/pdf");
      const stream = createReadStream(path);
      return new NextResponse(stream as any, { headers });
    }

    if (isHtml) {
      // Read and sanitize stray fence markers without altering scripts
      let text = await readFile(path, { encoding: "utf-8" });
      text = sanitizeHtmlStrayFences(text);
      headers.set("Content-Type", "text/html; charset=utf-8");
      headers.set("Content-Length", String(Buffer.byteLength(text, "utf-8")));
      return new NextResponse(text, { headers });
    }

    // Fallback: binary stream
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Length", String(stats.size));
    const stream = createReadStream(path);
    return new NextResponse(stream as any, { headers });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Not found", details: String(e?.message || e) },
      { status: 404 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Fallback: some Host responses return raw HTML; allow posting it to get a URL back
  try {
    const { html } = await req.json();
    if (typeof html !== "string") {
      return NextResponse.json({ error: "Missing html" }, { status: 400 });
    }
    const cleaned = sanitizeHtmlStrayFences(html);
    return new NextResponse(cleaned, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Bad request", details: String(e?.message || e) },
      { status: 400 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { stat as statCb, readFile as readFileCb } from "fs";
import { promisify } from "util";

export const runtime = "nodejs";

const stat = promisify(statCb);
const readFile = promisify(readFileCb);

async function waitForStableFile(
  path: string,
  opts: { kind: "html" | "pdf"; timeoutMs?: number; intervalMs?: number } = {
    kind: "html",
  }
) {
  const timeoutMs = opts.timeoutMs ?? 5000;
  const intervalMs = opts.intervalMs ?? 150;
  const started = Date.now();
  let lastSize = -1;

  while (Date.now() - started < timeoutMs) {
    try {
      const s = await stat(path);
      if (s.size > 0) {
        // If HTML, also sanity-check the tail for closing tag
        if (opts.kind === "html") {
          const len = Math.min(4096, s.size);
          const buf = await readFile(path, { encoding: "utf-8" });
          const tail = buf.slice(-len);
          if (tail.includes("</html>")) {
            // Ensure size is stable across two checks
            if (lastSize === s.size) return true;
            lastSize = s.size;
          }
        } else {
          if (lastSize === s.size) return true; // pdf size stable
          lastSize = s.size;
        }
      }
    } catch {
      // file not yet available
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

// Proxy to the slAIde Host agent to generate either HTML or PDF
// Normalizes the response to { kind: 'html'|'pdf', filePath: string }
export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Call the Host convenience endpoint which decides Presentation vs Summary.
    const hostUrl = process.env.SLAIDE_HOST_URL || "http://localhost:8000";
    const resp = await fetch(`${hostUrl}/render-html`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return NextResponse.json(
        { error: `Host error ${resp.status}`, details: text },
        { status: 502 }
      );
    }

    const data = await resp.json().catch(() => ({} as any));

    // Robustly detect the returned artifact path from the Host's response.
    // Presentation case: path to mine.html (various possible keys)
    const htmlPath =
      data?.html_path ||
      data?.mine_path ||
      data?.mine_html_path ||
      data?.mine_html ||
      data?.path;

    // Summary case: pdf path
    const pdfPath = data?.pdf_path || data?.pdf || data?.path_pdf;

    if (pdfPath && typeof pdfPath === "string") {
      // Wait for PDF file to be fully written
      await waitForStableFile(pdfPath, { kind: "pdf" });
      return NextResponse.json({ kind: "pdf", filePath: pdfPath });
    }

    if (htmlPath && typeof htmlPath === "string") {
      // Wait for HTML file to be fully written and complete
      await waitForStableFile(htmlPath, { kind: "html" });
      return NextResponse.json({ kind: "html", filePath: htmlPath });
    }

    // Some Host variants may return the raw HTML string directly
    const htmlRaw: unknown = data?.result || data?.html || data?.content;
    if (typeof htmlRaw === "string" && /<\s*html[\s>]/i.test(htmlRaw)) {
      return NextResponse.json({ kind: "html-inline", html: htmlRaw });
    }

    return NextResponse.json(
      { error: "Unrecognized Host response", data },
      { status: 500 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}

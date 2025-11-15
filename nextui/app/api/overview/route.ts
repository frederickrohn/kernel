import { NextRequest, NextResponse } from "next/server";

const APP_NAME = "ts-stagehand-v3";
const ACTION_NAME = "google-ai-overview-check";
const ACTION_VERSION = "latest";
// NOTE: no /v1 here; the spec shows base https://api.onkernel.com and path /invocations
const KERNEL_API_BASE = "https://api.onkernel.com";

export async function POST(req: NextRequest) {
  const apiKey = process.env.KERNEL_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Kernel API key is not configured on the server." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("query" in body) ||
    typeof (body as Record<string, unknown>).query !== "string"
  ) {
    return NextResponse.json(
      { error: "Request body must include a 'query' string." },
      { status: 400 }
    );
  }

  const url = new URL(`${KERNEL_API_BASE}/invocations`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      // payload must be a JSON-encoded string
      body: JSON.stringify({
        app_name: APP_NAME,
        action_name: ACTION_NAME,
        version: ACTION_VERSION,
        // add async: true here if you want a guaranteed 202
        // async: true,
        payload: JSON.stringify({ query: (body as { query: string }).query }),
      }),
      cache: "no-store",
    });

    const invocation: Record<string, unknown> | null = await response
      .json()
      .catch(() => null);
    console.log("🔍 Kernel invocation response:", response.status, invocation);

    if (!response.ok || !invocation || typeof invocation !== "object") {
      return NextResponse.json(
        {
          error: "Kernel invocation failed.",
          detail: invocation ?? null,
        },
        { status: response.status || 500 }
      );
    }

    if (invocation.status !== "succeeded") {
      return NextResponse.json(
        {
          error: "Kernel invocation did not finish in time.",
          detail: invocation,
        },
        { status: 502 }
      );
    }

    const rawOutput = invocation.output;
    const parsedOutput =
      typeof rawOutput === "string"
        ? (() => {
            try {
              return JSON.parse(rawOutput);
            } catch {
              return rawOutput;
            }
          })()
        : rawOutput;
    const aiOverview =
      parsedOutput &&
      typeof parsedOutput === "object" &&
      "aiOverview" in parsedOutput &&
      typeof (parsedOutput as Record<string, unknown>).aiOverview === "string"
        ? (parsedOutput as { aiOverview: string }).aiOverview
        : null;

    return NextResponse.json({
      id: invocation.id,
      action_name: invocation.action_name,
      status: invocation.status,
      status_reason: invocation.status_reason ?? null,
      aiOverview,
      output: parsedOutput,
      raw: invocation, // keep for debugging; remove if you don’t want to expose it
    });
  } catch (error) {
    console.error("Kernel invocation error:", error);
    return NextResponse.json(
      { error: "Unexpected error invoking Kernel action." },
      { status: 500 }
    );
  }
}

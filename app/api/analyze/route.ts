import OpenAI from "openai";
import {
  buildAnalysisPrompt,
  buildMockAnalysisMarkdown,
} from "@/lib/ai-prompt";
import type { AnalystRequestPayload } from "@/lib/types";

export const runtime = "nodejs";

const MODEL = "gpt-4o-mini";

function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function createTextStream(
  text: string,
  headers: Record<string, string>,
): Response {
  const encoder = new TextEncoder();
  let index = 0;
  const chunkSize = 24;

  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index >= text.length) {
        controller.close();
        return;
      }
      const chunk = text.slice(index, index + chunkSize);
      index += chunkSize;
      controller.enqueue(encoder.encode(chunk));
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function validatePayload(body: unknown): AnalystRequestPayload {
  if (!body || typeof body !== "object") {
    throw new Error("リクエスト本文が不正です。");
  }

  const payload = body as AnalystRequestPayload;
  if (!payload.input || !payload.result || !payload.portfolioLabel) {
    throw new Error("分析に必要な入力データが不足しています。");
  }

  return payload;
}

export async function GET() {
  return Response.json({ configured: isOpenAiConfigured() });
}

export async function POST(request: Request) {
  let payload: AnalystRequestPayload;

  try {
    payload = validatePayload(await request.json());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "リクエストが不正です。";
    return Response.json({ error: message }, { status: 400 });
  }

  const modeHeaders = {
    "X-AI-Mode": isOpenAiConfigured() ? "live" : "mock",
  };

  if (!isOpenAiConfigured()) {
    return createTextStream(buildMockAnalysisMarkdown(payload), modeHeaders);
  }

  const { system, user } = buildAnalysisPrompt(payload);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      stream: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        ...modeHeaders,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "AI 分析の生成に失敗しました。";
    return Response.json({ error: message }, { status: 502 });
  }
}

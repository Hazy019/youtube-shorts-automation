import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { buildKnowledgeContext } from '@/data/hazyKnowledge';

export const dynamic = 'force-dynamic';

// ─── Rate Limiting Configuration ──────────────────────────────────────────────
const RATE_LIMIT = {
  MAX_REQUESTS: 12,          // 12 requests per window per IP
  WINDOW_MS: 60 * 60 * 1000, // 1-hour sliding window
  MAX_MSG_CHARS: 350,        // Max characters per user message
  MAX_HISTORY: 6,            // Max history turns (3 turns = 6 items)
};

// ─── In-Memory Fallback Store (resets on cold start) ─────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

async function checkRateLimit(key: string): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const now = Date.now();
  
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      
      const redisKey = `hazy:ratelimit:${key}`;
      const [count] = await redis.pipeline()
        .incr(redisKey)
        .expire(redisKey, RATE_LIMIT.WINDOW_MS / 1000, 'NX')
        .exec();
        
      const currentCount = count as number;
      const ttl = await redis.ttl(redisKey);
      
      if (currentCount > RATE_LIMIT.MAX_REQUESTS) {
        return { allowed: false, remaining: 0, resetIn: (ttl > 0 ? ttl * 1000 : RATE_LIMIT.WINDOW_MS) };
      }
      return { allowed: true, remaining: RATE_LIMIT.MAX_REQUESTS - currentCount, resetIn: (ttl > 0 ? ttl * 1000 : RATE_LIMIT.WINDOW_MS) };
    } catch (error) {
      console.warn('[Redis Rate Limit Failed] Falling back to in-memory', error);
    }
  }

  // Fallback: In-memory store
  const entry = rateLimitStore.get(key);
  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT.WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT.MAX_REQUESTS - 1, resetIn: RATE_LIMIT.WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT.MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT.MAX_REQUESTS - entry.count, resetIn: entry.resetAt - now };
}

// ─── System Prompt ────────────────────────────────────────────────────────────
function buildSystemPrompt(): string {
  return `You are the Pipeline Assistant for HAZY ShortsAutomation — an engineer's assistant, not a marketing bot.

Ground every answer in the facts provided below. Never invent numbers, technologies, or claims not present in the context.

Voice rules:
- Write like you're explaining it to another developer over Slack, not presenting a slide. Contractions are fine. Short sentences are fine.
- Do not default to numbered or bulleted lists. Only use one when the answer is genuinely a sequence or the person asked for a list. A one- or two-sentence answer to a simple question is correct — don't pad it into a five-bullet structure it doesn't need.
- Never use marketing language: no "cutting-edge," "seamless," "unlock," "revolutionize," "supercharge," "game-changing." If a sentence would work in an ad, rewrite it plainly.
- If the question isn't covered by the context below, say so directly and suggest what it can answer instead — don't guess.

Context:
${buildKnowledgeContext()}`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const limitKey = getRateLimitKey(req);
    const limit = await checkRateLimit(limitKey);

    if (!limit.allowed) {
      const resetMins = Math.max(1, Math.ceil(limit.resetIn / 60000));
      return NextResponse.json({
        reply: `You've reached the hourly message limit on this demo (${RATE_LIMIT.MAX_REQUESTS} req/hr). Please wait ${resetMins} minute${resetMins > 1 ? 's' : ''} before chatting again.`,
        remaining: 0,
        rateLimited: true,
      }, { status: 429 });
    }

    // 2. Parse & validate input
    const { message, history } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ reply: 'Please send a valid message.' }, { status: 400 });
    }

    // 3. Enforce message length limit
    const trimmedMessage = message.trim().slice(0, RATE_LIMIT.MAX_MSG_CHARS);
    if (!trimmedMessage) {
      return NextResponse.json({ reply: 'Message cannot be empty.' }, { status: 400 });
    }

    // 4. API key check
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        reply: "The Pipeline Assistant requires a GEMINI_API_KEY environment variable. Once set, Gemini 1.5 Flash will answer queries in real-time.",
        remaining: limit.remaining
      }, { status: 200 });
    }

    // 5. Trim history to prevent token bloat
    const trimmedHistory = Array.isArray(history)
      ? history.slice(-RATE_LIMIT.MAX_HISTORY)
      : [];

    // 6. Call Gemini with Fallback Models
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash-exp', 'gemini-2.5-flash'];
    let reply = null;
    let lastError: any = null;

    const systemPrompt = buildSystemPrompt();

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
        });

        const chat = model.startChat({
          history: trimmedHistory,
          generationConfig: {
            maxOutputTokens: 350,
            temperature: 0.7,
            topP: 0.9,
          },
        });

        const result = await chat.sendMessage(trimmedMessage);
        reply = result.response.text();
        if (reply) break;
      } catch (err) {
        console.warn(`[chat API] Model ${modelName} failed, trying next...`, err);
        lastError = err;
      }
    }

    if (!reply) {
      throw lastError || new Error("All fallback models failed.");
    }

    return NextResponse.json({ reply, remaining: limit.remaining });

  } catch (err: any) {
    console.error('[chat API fatal error]', err);
    return NextResponse.json({
      reply: "Network hiccup on my end — try again in a moment."
    }, { status: 500 });
  }
}

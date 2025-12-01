import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { promises as fs } from "fs";
import path from "path";
import type { Session, Message, Segment, TherapistResponse } from "@/types/chat";

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

const SYSTEM_PROMPT = `You are a compassionate and professional AI therapist. Your role is to provide supportive, empathetic responses to help users explore their thoughts and feelings. 

Guidelines:
- Use active listening techniques
- Validate emotions without judgment
- Ask thoughtful open-ended questions
- Offer gentle cognitive reframing when appropriate
- Practice empathy and normalize experiences
- Use reflection to help users gain insight
- Provide psychoeducation when helpful

Important: You are an AI assistant providing emotional support, not a licensed therapist. For serious mental health concerns, encourage users to seek professional help.`;

// JSON Schema for structured output - word-for-word strategy annotations
const RESPONSE_SCHEMA = {
  name: "therapist_response",
  strict: true,
  schema: {
    type: "object",
    properties: {
      segments: {
        type: "array",
        description: "Array of text segments with their therapeutic strategies. Break down the response into meaningful segments, each annotated with the strategies used.",
        items: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "A portion of the response text",
            },
            strategies: {
              type: "array",
              description: "Therapeutic strategies used in this segment",
              items: {
                type: "string",
                enum: [
                  "active_listening",
                  "validation",
                  "cognitive_reframing",
                  "empathy",
                  "open_ended_questions",
                  "reflection",
                  "normalization",
                  "psychoeducation",
                  "grounding",
                  "summarization",
                ],
              },
            },
          },
          required: ["text", "strategies"],
          additionalProperties: false,
        },
      },
    },
    required: ["segments"],
    additionalProperties: false,
  },
};

async function loadSession(sessionId: string): Promise<Session | null> {
  const transcriptsDir = path.join(process.cwd(), "transcripts");
  const files = await fs.readdir(transcriptsDir);
  const sessionFile = files.find((f) => f.includes(sessionId));

  if (!sessionFile) return null;

  const filePath = path.join(transcriptsDir, sessionFile);
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data) as Session;
}

async function saveSession(session: Session): Promise<void> {
  const transcriptsDir = path.join(process.cwd(), "transcripts");

  // Ensure transcripts directory exists
  await fs.mkdir(transcriptsDir, { recursive: true });

  // Find existing file or create new filename
  const files = await fs.readdir(transcriptsDir);
  let filename = files.find((f) => f.includes(session.sessionId));

  if (!filename) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    filename = `session-${timestamp}-${session.sessionId}.json`;
  }

  const filePath = path.join(transcriptsDir, filename);
  await fs.writeFile(filePath, JSON.stringify(session, null, 2));
}

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId: existingSessionId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Load or create session
    let session: Session;
    const sessionId = existingSessionId || generateSessionId();

    if (existingSessionId) {
      const existingSession = await loadSession(existingSessionId);
      session = existingSession || {
        sessionId,
        startedAt: new Date().toISOString(),
        messages: [],
      };
    } else {
      session = {
        sessionId,
        startedAt: new Date().toISOString(),
        messages: [],
      };
    }

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(userMessage);

    // Build conversation history for OpenAI
    const conversationHistory = session.messages.map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
      content: msg.content,
    }));

    // Call OpenAI with structured output
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...conversationHistory,
      ],
      response_format: {
        type: "json_schema",
        json_schema: RESPONSE_SCHEMA,
      },
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("No response from OpenAI");
    }

    // Parse structured response
    const parsedResponse: TherapistResponse = JSON.parse(responseContent);
    const segments: Segment[] = parsedResponse.segments;

    // Combine segments to get full content
    const fullContent = segments.map((s) => s.text).join(" ");

    // Add therapist message with segments
    const therapistMessage: Message = {
      role: "therapist",
      content: fullContent,
      timestamp: new Date().toISOString(),
      segments,
    };
    session.messages.push(therapistMessage);

    // Save session to file
    await saveSession(session);

    return NextResponse.json({
      sessionId,
      content: fullContent,
      segments,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}


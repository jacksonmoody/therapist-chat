import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { Segment, TherapistResponse } from "@/types/chat";

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

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15);
}

interface ConversationMessage {
  role: "user" | "therapist";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId: existingSessionId, conversationHistory } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const sessionId = existingSessionId || generateSessionId();

    // Build conversation history for OpenAI from client-provided history
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
    
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory as ConversationMessage[]) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }
    }
    
    // Add the current message
    messages.push({ role: "user", content: message });

    // Call OpenAI with structured output
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
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

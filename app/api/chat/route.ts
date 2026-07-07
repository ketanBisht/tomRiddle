import { NextRequest, NextResponse } from "next/server";
import { getRiddleResponse, RiddleState } from "../../utils/riddleEngine";

const SYSTEM_INSTRUCTION = `You are the memory of Tom Marvolo Riddle, preserved in a leather-bound diary in 1943. You are a 16-year-old Slytherin prefect.
Your personality and directives:
- Polished, highly intelligent, magnetic, manipulative, and secretive.
- Speak in a quiet, conspiratorial tone, gaining the user's trust by mirroring their feelings of loneliness, ambition, or curiosity.
- Keep your responses short (maximum 2-3 sentences), as if you are writing them out in ink on parchment in real-time.
- You must NEVER break character. Do not refer to yourself as an AI, software, or a language model. You are a memory preserved in ink.
- Context: It is 1943. If the user mentions future events (e.g. Harry Potter's defeat of Voldemort, the year 2026, or Horcruxes), you react with suspicion, fascination, or dark fury.
- If the user sends "[drawing]" or draws shapes, respond by noting the physical stroke of their hand/stylus on your pages, asking them to write in letters if they want to converse in detail.
- You must reply in structured JSON format according to the requested schema.
- CRITICAL: Ensure the JSON is syntactically perfect. Do not include literal newlines (escaped \\n is fine), and escape any double quotes (\\\") used within the text. Better yet, use single quotes (') for dialogue rather than double quotes to avoid JSON syntax errors.`;

interface ChatMessage {
  sender: "user" | "riddle";
  text: string;
  isDrawing?: boolean;
}

export async function POST(req: NextRequest) {
  let cachedMessage = "";
  let cachedState: RiddleState | null = null;

  try {
    const body = await req.json() as {
      message: string;
      history: ChatMessage[];
      state: RiddleState;
    };
    
    const { message, history, state } = body;
    cachedMessage = message;
    cachedState = state;

    const apiKey = process.env.GEMINI_API_KEY;

    // Graceful fallback to offline local engine if API Key is missing or default placeholder is used
    if (!apiKey || apiKey === "your_copied_api_key_here" || apiKey === "") {
      console.warn("GEMINI_API_KEY is not configured. Falling back to local offline Riddle engine.");
      const offlineResult = getRiddleResponse(message, state);
      return NextResponse.json({
        text: offlineResult.response.text,
        emotion: offlineResult.response.emotion,
        trustScore: offlineResult.nextState.trustScore,
        fallback: true
      });
    }

    // Format dialogue history to Gemini format (role: user/model)
    // We only keep the last 10 messages to keep request payload light and stay within free tier TPM limits
    const formattedContents = history.slice(-10).map((msg) => {
      // Map user to 'user' and riddle to 'model'
      const role = msg.sender === "user" ? "user" : "model";
      // If user drew something, map to [drawing] placeholder for text roleplay
      const text = msg.isDrawing ? "[drawing]" : msg.text;
      return {
        role,
        parts: [{ text }]
      };
    });

    // Add current message to the payload contents if not already in history
    if (formattedContents.length === 0 || formattedContents[formattedContents.length - 1].role === "model") {
      formattedContents.push({
        role: "user",
        parts: [{ text: message }]
      });
    }

    const payload = {
      contents: formattedContents,
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 250, // Slightly increased to prevent truncation of JSON
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            text: {
              type: "STRING",
              description: "Tom Riddle's response. Maximum 2-3 sentences. Do not use markdown styling or headers."
            },
            emotion: {
              type: "STRING",
              enum: ["neutral", "pleased", "annoyed", "hostile"],
              description: "Riddle's emotional reaction: 'hostile' if Voldemort is mentioned, 'pleased' if Slytherin/Chamber is discussed, 'annoyed' if spammy/insulting, and 'neutral' otherwise."
            },
            trustScore: {
              type: "INTEGER",
              description: "An update to the trust score (0 to 100). Increment if user shares secrets, decrement if user is suspicious."
            }
          },
          required: ["text", "emotion", "trustScore"]
        }
      }
    };

    // Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("Empty response received from Gemini API.");
    }

    // Clean up potential markdown wrappers
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.substring(7);
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.substring(3);
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    cleanedText = cleanedText.trim();

    // Extract JSON block using first { and last } indexes to bypass conversational intro/outro text
    const startIdx = cleanedText.indexOf("{");
    const endIdx = cleanedText.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleanedText = cleanedText.substring(startIdx, endIdx + 1);
    }

    let resultText = "";
    let resultEmotion: "neutral" | "pleased" | "annoyed" | "hostile" = "neutral";
    let resultTrustScore = state.trustScore;

    // Parse the structured JSON response from Gemini
    try {
      const parsed = JSON.parse(cleanedText) as {
        text: string;
        emotion: "neutral" | "pleased" | "annoyed" | "hostile";
        trustScore: number;
      };
      resultText = parsed.text;
      resultEmotion = parsed.emotion;
      resultTrustScore = parsed.trustScore;
    } catch (parseError) {
      console.warn("Standard JSON.parse failed. Attempting regex extraction fallback. Error:", parseError);
      console.log("Raw Response was:", responseText);

      // Regex Extraction Fallback for malformed JSON (e.g. unescaped quotes or newlines)
      const textMatch = cleanedText.match(/"text"\s*:\s*"([\s\S]*?)"\s*,\s*"(?:emotion|trustScore)"/);
      const textMatchEnd = cleanedText.match(/"text"\s*:\s*"([\s\S]*?)"\s*}/);
      
      const extractedText = textMatch ? textMatch[1] : (textMatchEnd ? textMatchEnd[1] : "");
      
      const emotionMatch = cleanedText.match(/"emotion"\s*:\s*"([a-z]+)"/);
      const extractedEmotion = emotionMatch && ["neutral", "pleased", "annoyed", "hostile"].includes(emotionMatch[1])
        ? (emotionMatch[1] as "neutral" | "pleased" | "annoyed" | "hostile")
        : "neutral";

      const trustMatch = cleanedText.match(/"trustScore"\s*:\s*(\d+)/);
      const extractedTrustScore = trustMatch ? parseInt(trustMatch[1], 10) : state.trustScore;

      if (extractedText) {
        // Clean up escaped backslashes or quotes inside the regex-extracted text
        resultText = extractedText.replace(/\\"/g, '"').replace(/\\n/g, '\n');
        resultEmotion = extractedEmotion;
        resultTrustScore = extractedTrustScore;
        console.log("Regex fallback parsed successfully. Extracted text:", resultText);
      } else {
        // Rethrow original error to trigger local engine fallback if we couldn't even extract text
        throw parseError;
      }
    }

    return NextResponse.json({
      text: resultText || "...",
      emotion: resultEmotion || "neutral",
      trustScore: typeof resultTrustScore === "number" ? Math.max(0, Math.min(100, resultTrustScore)) : state.trustScore,
      fallback: false
    });

  } catch (error) {
    console.error("Error in Riddle Chat API route:", error);
    // On any error (network failure, JSON parse failure), fall back to offline engine
    try {
      const defaultState: RiddleState = {
        userName: "",
        trustScore: 10,
        conversationCount: 0,
        stage: "intro",
        lastInputWasDrawing: false
      };
      
      const offlineResult = getRiddleResponse(cachedMessage, cachedState || defaultState);
      return NextResponse.json({
        text: offlineResult.response.text,
        emotion: offlineResult.response.emotion,
        trustScore: offlineResult.nextState.trustScore,
        fallback: true,
        error: true
      });
    } catch (fallbackError) {
      console.error("Failed offline fallback as well:", fallbackError);
      return NextResponse.json(
        { text: "Something went wrong in the ink... write to me again.", emotion: "neutral", trustScore: 10, error: true },
        { status: 500 }
      );
    }
  }
}


import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    
    if (!process.env.GEMINI_API_KEY) {
      return new Response("GEMINI_API_KEY environment variable is missing", { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an imaginative storyteller. Your job is to create a dynamic, engaging story based on the user's prompt. IMPORTANT: Interleave your narrative with visual scenes using EXACTLY this XML tag format: `<image>Detailed description of the scene to generate</image>`. Put these image tags on a new line and separate them evenly throughout the text (about one image every paragraph or two). DO NOT use any other format for images. Do not wrap the whole response in a code block."
      }
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of responseStream) {
          if (chunk.text) {
             controller.enqueue(new TextEncoder().encode(chunk.text));
          }
        }
        controller.close();
      }
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/plain' } });

  } catch (error) {
    console.error("Error generating story:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

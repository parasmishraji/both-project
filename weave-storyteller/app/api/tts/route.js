import textToSpeech from '@google-cloud/text-to-speech';

export const runtime = 'nodejs';

// Initialize the client. Note: This requires GOOGLE_APPLICATION_CREDENTIALS to be set
// to a valid service account JSON file, or running `gcloud auth application-default login`
let client;
try {
  client = new textToSpeech.TextToSpeechClient();
} catch (e) {
  console.warn("Text-to-speech client could not be initialized (missing credentials). Audio will be mock disabled.");
}

export async function POST(req) {
  try {
    const { text } = await req.json();
    
    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), { status: 400 });
    }

    if (!client) {
       return new Response(JSON.stringify({ error: "TTS Client not initialized. Please configure GCP credentials." }), { status: 500 });
    }

    const request = {
      input: { text },
      // Journey voice is premium and high quality
      voice: { languageCode: 'en-US', name: 'en-US-Journey-F' },
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await client.synthesizeSpeech(request);

    return new Response(JSON.stringify({ 
      audioContent: response.audioContent.toString('base64')
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Error generating speech:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

require("dotenv").config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Sends audio/video bytes to OpenAI Whisper and returns the transcript text
async function transcribeMedia({ buffer, fileName, mimetype }) {
  const form = new FormData();
  form.append(
    "file",
    new Blob([buffer], { type: mimetype || "video/mp4" }),
    fileName || "media.mp4",
  );
  form.append("model", "whisper-1");

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: form,
    },
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`caption_generation_failed: ${errBody}`);
  }

  const data = await response.json();
  return data.text;
}

module.exports = { transcribeMedia };

import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables from .env file
dotenv.config();

// Initialize Google Generative AI with the correct API key
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Fix for __dirname in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create the 'images' and 'audio' directories if they don't exist
const imagesDir = join(__dirname, "images");
const audioDir = join(__dirname, "audio");
if (!existsSync(imagesDir)) {
  mkdirSync(imagesDir);
}
if (!existsSync(audioDir)) {
  mkdirSync(audioDir);
}

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/images", express.static(imagesDir));

// Root route
app.get("/", (req, res) => {
  res.send("Hello World...!!!");
});

// Image generation route
app.post("/generate-image", async (req, res) => {
  const { prompt, height, width, guidanceScale, steps, maxSequence } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
      {
        inputs: prompt,
        height: height ?? 1024,
        width: width ?? 1024,
        guidance_scale: guidanceScale ?? 3.5,
        num_inference_steps: steps ?? 50,
        max_sequence_length: maxSequence ?? 512,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    const filename = `${uuidv4()}.png`;
    const filePath = join(imagesDir, filename);
    writeFileSync(filePath, response.data);

    const imageUrl = `${req.protocol}://${req.get("host")}/images/${filename}`;
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error("Error generating image:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    res
      .status(500)
      .json({ error: "Error generating image", details: error.message });
  }
});

//////////////////////////////////////////////////////////////////////////////

// Text generation route
app.post("/generateText", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    const text = result.response.text();
    res.status(200).json({ text });
  } catch (error) {
    console.error("Error generating text:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    res
      .status(500)
      .json({ error: "Error generating text", details: error.message });
  }
});

//////////////////////////////////////////////////////////////////////////////

// Text-to-speech route using Eleven Labs API
app.post("/generate-audio", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  try {
    const response = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech/pFZP5JQG7iQjIQuC4Bku",
      {
        text,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
        model_id: "eleven_monolingual_v1",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        responseType: "arraybuffer",
      }
    );

    const audioFilename = `${uuidv4()}.mp3`;
    const audioFilePath = join(audioDir, audioFilename);
    writeFileSync(audioFilePath, response.data);

    const audioUrl = `${req.protocol}://${req.get(
      "host"
    )}/audio/${audioFilename}`;
    res.status(200).json({ audioUrl });
  } catch (error) {
    console.error("Error generating audio:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    res
      .status(500)
      .json({ error: "Error generating audio", details: error.message });
  }
});

//////////////////////////////////////////////////////////////////////////////

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

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

// New orchestrated API route
app.post("/generate-full-process", async (req, res) => {
  const { topic, points, duration } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }
  if (!points) {
    return res.status(400).json({ error: "Points are required" });
  }
  if (!duration) {
    return res.status(400).json({ error: "Duration is required" });
  }

  try {
    // 1. Call /generateText API to create the podcast episode
    const textResponse1 = await axios.post(
      `${req.protocol}://${req.get("host")}/generateText`,
      {
        prompt: `Create a professional podcast episode focused on ${topic}. The episode should begin with an engaging introduction, introducing the host (Ambre Itesh) and the purpose of the podcast. Then, dive deep into ${points} with expert analysis and real-world examples. Maintain a conversational tone, but ensure the information is well-researched and fact-checked. The podcast should last around ${duration}, include smooth transitions between segments, conclude with actionable takeaways for the audience and give a clear understanding of the podcast's focus without any special characters and don't mention about music.`,
      }
    );
    const fullPodcast = textResponse1.data.text
      .replace(/#/g, "")
      .split("*")
      .join("")
      .replace(/\n/g, "")
      .replace(/\\/g, "");

    console.log(fullPodcast);

    // 2. Call /generateText API again for the podcast title
    const textResponse2 = await axios.post(
      `${req.protocol}://${req.get("host")}/generateText`,
      {
        prompt: `Generate a single without any symbols 1-5 words compelling, niche-specific podcast title that captures the essence of a podcast focused on ${topic}. The title should be concise yet descriptive, with a creative twist that sparks curiosity and invites listeners to explore the content. Ensure the title clearly conveys the podcast's value and appeals directly to every age group, using action words, power phrases, or intriguing questions. The title should be easy to remember, search-friendly, and make listeners eager to click and listen, while giving a clear understanding of the podcast's focus and purpose without any special characters.`,
      }
    );
    const podcastTitle = textResponse2.data.text
      .replace(/#/g, "")
      .split("*")
      .join("")
      .replace(/\n/g, "")
      .replace(/\\/g, "");

    console.log(podcastTitle);

    // // 3. Call /generate-image API with the podcast title
    // const imageResponse = await axios.post(
    //   `${req.protocol}://${req.get("host")}/generate-image`,
    //   {
    //     prompt: `Design a professional poster for a podcast titled '${podcastTitle}'. The theme should reflect the podcast's focus on ${topic}, incorporating a modern and sleek aesthetic. Use bold and legible fonts for the title and key details, such as the episode title, host name, and release date. Include relevant visuals like a microphone, headphones, or abstract soundwaves in the background. Ensure a clean layout with vibrant colors that contrast well, drawing attention to the title. Add social media icons and a QR code for easy access. The overall design should feel dynamic, engaging, and polished.`,
    //   }
    // );
    // const podcastPoster = imageResponse.data.imageUrl; // Changed variable name for consistency

    // // 4. Call /generate-audio API with the full podcast text
    // const audioResponse = await axios.post(
    //   `${req.protocol}://${req.get("host")}/generate-audio`,
    //   { text: fullPodcast } // Use fullPodcast as input for audio generation
    // );
    // const podcastAudio = audioResponse.data.audioUrl;

    // Return final result
    res.status(200).json({
      podcastTitle,
      fullPodcast,
      // podcastPoster,
      // podcastAudio,
    });
  } catch (error) {
    console.error("Error in full process:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    res
      .status(500)
      .json({ error: "Error in full process", details: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

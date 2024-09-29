// import express from "express";
// import axios from "axios";
// import dotenv from "dotenv";
// // Import Node.js built-in modules with ES module syntax
// import { writeFileSync, existsSync, mkdirSync } from "fs";
// import { join, dirname } from "path";
// import { v4 as uuidv4 } from "uuid";
// import { fileURLToPath } from "url";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// // Access your API key as an environment variable
// const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// // Fix for __dirname in ES module context
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // Load environment variables from .env file
// dotenv.config();

// // Create the 'images' directory if it doesn't exist
// const imagesDir = join(__dirname, "images");
// if (!existsSync(imagesDir)) {
//   mkdirSync(imagesDir); // Create the directory
// }

// const app = express();
// const port = process.env.PORT || 3000;

// app.use(express.json());
// // Serve images statically
// app.use("/images", express.static(imagesDir));

// app.get("/", (req, res) => {
//   console.log("Hello World...!!!");
//   res.send("Hello World...!!!");
// });

// app.post("/generate-image", async (req, res) => {
//   const { prompt, height, width, guidanceScale, steps, maxSequence } = req.body;

//   if (!prompt) {
//     return res.status(400).json({ error: "Prompt is required" });
//   }

//   // Log API key to ensure it's being loaded
//   console.log("HUGGINGFACE_API_KEY:", process.env.HUGGINGFACE_API_KEY);

//   try {
//     const response = await axios.post(
//       "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
//       {
//         inputs: prompt,
//         height: height ?? 1024,
//         width: width ?? 1024,
//         guidance_scale: guidanceScale ?? 3.5,
//         num_inference_steps: steps ?? 50,
//         max_sequence_length: maxSequence ?? 512,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//         responseType: "arraybuffer",
//       }
//     );

//     // Generate a unique filename for the image
//     const filename = `${uuidv4()}.png`;
//     const filePath = join(imagesDir, filename);

//     // Save the image to the 'images' directory
//     writeFileSync(filePath, response.data);

//     // Return the URL to the saved image
//     const imageUrl = `${req.protocol}://${req.get("host")}/images/${filename}`;
//     res.status(200).json({ imageUrl });
//   } catch (error) {
//     // Detailed error logging
//     console.error("Error generating image:", error.message);
//     if (error.response) {
//       console.error("Status:", error.response.status); // Log HTTP status
//       console.error("Data:", error.response.data); // Log response data
//     } else {
//       console.error("Error without response:", error);
//     }
//     res
//       .status(500)
//       .json({ error: "Error generating image", details: error.message });
//   }
// });

// //////////////////////////////////////////////////////////////////////////

// app.post("/text", async (req, res) => {
//   const { prompt } = req.body;

//   if (!prompt) {
//     return res.status(400).json({ error: "Prompt is required" });
//   }

//   try {
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//     const result = await model.generateContent(prompt);
//     console.log(result.response.text());
//     res.send(result.response.text());
//   } catch (error) {
//     // Detailed error logging
//     console.error("Error:", error.message);
//     if (error.response) {
//       console.error("Status:", error.response.status); // Log HTTP status
//       console.error("Data:", error.response.data); // Log response data
//     } else {
//       console.error("Error without response:", error);
//     }
//     res
//       .status(500)
//       .json({ error: "Error generating text", details: error.message });
//   }
// });

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import gTTS from "gtts"; // Import gTTS

// Load environment variables from .env file
dotenv.config();

// Initialize Google Generative AI with the correct API key
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Fix for __dirname in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create the 'images' directory if it doesn't exist
const imagesDir = join(__dirname, "images");
if (!existsSync(imagesDir)) {
  mkdirSync(imagesDir);
}

// Create the 'audio' directory if it doesn't exist
const audioDir = join(__dirname, "audio");
if (!existsSync(audioDir)) {
  mkdirSync(audioDir);
}

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/images", express.static(imagesDir));

app.get("/", (req, res) => {
  res.send("Hello World...!!!");
});

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

app.post("/generateText", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    // Await the text() method and return it properly
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

//////////////////////////////////////////////////////////////////////////////////////////
app.post("/convert-to-audio", (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    // Convert the prompt to speech
    const gtts = new gTTS(prompt, "en");

    // Generate a unique filename for the audio file
    const filename = `${uuidv4()}.mp3`;
    const filePath = join(audioDir, filename);

    // Save the audio file
    gtts.save(filePath, (err) => {
      if (err) {
        throw new Error(err);
      }

      // Return the URL to the saved audio file
      const audioUrl = `${req.protocol}://${req.get("host")}/audio/${filename}`;
      res.status(200).json({ audioUrl });
    });
  } catch (error) {
    console.error("Error generating audio:", error.message);
    res
      .status(500)
      .json({ error: "Error generating audio", details: error.message });
  }
});

// Serve audio files statically
app.use("/audio", express.static(audioDir));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
// Import Node.js built-in modules with ES module syntax
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
// Serve images statically
app.use('/images', express.static(join(__dirname, 'images')));

app.post('/generate-image', async (req, res) => {
  const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
          }

            try {
                const response = await axios.post(
                      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
                            { inputs: prompt },
                                  {
                                          headers: {
                                                    Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                                                              'Content-Type': 'application/json',
                                                                      },
                                                                              responseType: 'arraybuffer',
                                                                                    }
                                                                                        );

                                                                                            // Generate a unique filename for the image
                                                                                                const filename = `${uuidv4()}.png`;
                                                                                                    const filePath = join(__dirname, 'images', filename);

                                                                                                        // Save the image to the 'images' directory
                                                                                                            writeFileSync(filePath, response.data);

                                                                                                                // Return the URL to the saved image
                                                                                                                    const imageUrl = `${req.protocol}://${req.get('host')}/images/${filename}`;
                                                                                                                        res.status(200).json({ imageUrl });

                                                                                                                          } catch (error) {
                                                                                                                              console.error('Error generating image:', error.response?.status, error.response?.data);
                                                                                                                                  res.status(500).json({ error: 'Error generating image' });
                                                                                                                                    }
                                                                                                                                    });

                                                                                                                                    app.listen(port, () => {
                                                                                                                                      console.log(`Server is running on port ${port}`);
                                                                                                                                      });
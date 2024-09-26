// server.js
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/generate-image', async (req, res) => {
  const { prompt } = req.body;

    try {
        // Call Hugging Face API for image generation using stable-diffusion-xl-base-1.0
            const response = await axios.post(
                  'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
                        { inputs: prompt },
                              {
                                      headers: {
                                                Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                                                        },
                                                                responseType: 'arraybuffer',
                                                                      }
                                                                          );

                                                                              // Convert the image to base64 to return as a URL
                                                                                  const base64Image = Buffer.from(response.data, 'binary').toString('base64');
                                                                                      const imageUrl = `data:image/png;base64,${base64Image}`;

                                                                                          res.status(200).json({ imageUrl });
                                                                                            } catch (error) {
                                                                                                res.status(500).json({ message: 'Error generating image', error: error.message });
                                                                                                  }
                                                                                                  });

                                                                                                  app.listen(port, () => {
                                                                                                    console.log(`Server is running on port ${port}`);
                                                                                                    });
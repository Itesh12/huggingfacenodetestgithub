// server.js
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, world! This is a basic GET request.');
});

app.post('/generate-image', async (req, res) => {
  const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
          }

            // Log API key to ensure it's being loaded
              console.log('Using API Key:', process.env.HUGGINGFACE_API_KEY);

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

                                                                                                const base64Image = Buffer.from(response.data, 'binary').toString('base64');
                                                                                                    const imageUrl = `data:image/png;base64,${base64Image}`;

                                                                                                        res.status(200).json({ imageUrl });
                                                                                                          } catch (error) {
                                                                                                              console.error('Error generating image:', error.response?.status, error.response?.data);
                                                                                                                  res.status(500).json({ error: 'Error generating image' });
                                                                                                                    }
                                                                                                                    });

                                                                                                                    app.listen(port, () => {
                                                                                                                      console.log(`Server is running on port ${port}`);
                                                                                                                      });
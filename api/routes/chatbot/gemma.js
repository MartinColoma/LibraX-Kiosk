const express = require('express');
const axios = require('axios');
const router = express.Router();

const CLARIFAI_API_URL = 'https://clarifai.com/earlypearly/local-runner-app/models/local-runner-model/outputs'; // Your public Clarifai runner API URL
const CLARIFAI_PAT = process.env.CLARIFAI_PAT; // Store your Clarifai PAT securely in .env

router.post('/gemma', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const clarifaiResponse = await axios.post(
      CLARIFAI_API_URL,
      {
        inputs: [
          {
            data: {
              text: {
                raw: message
              }
            }
          }
        ]
      },
      {
        headers: {
          Authorization: `Key ${CLARIFAI_PAT}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract the AI response from Clarifai's output. Adjust this path if your response structure is different.
    const answer = clarifaiResponse.data?.outputs?.[0]?.data?.text?.raw || 'No answer from Gemma model.';
    res.json({ answer });
  } catch (error) {
    console.error('Error querying Clarifai API:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get response from Gemma model' });
  }
});

module.exports = router;

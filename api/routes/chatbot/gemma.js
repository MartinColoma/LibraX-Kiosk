const express = require('express');
const axios = require('axios');
const router = express.Router();

const CLARIFAI_API_URL = 'https://api.clarifai.com/v2/users/earlypearly/apps/local-runner-app/models/local-runner-model/versions/4314047cd3e84381a798b5057869579f/outputs';
const CLARIFAI_PAT = process.env.CLARIFAI_PAT;

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

    // Extract the AI response text from Clarifai's output (adjust if response schema changes)
    const answer = clarifaiResponse.data?.outputs?.[0]?.data?.text?.raw || 'No answer from Gemma model.';
    res.json({ answer });

  } catch (error) {
    console.error('Error querying Clarifai API:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get response from Gemma model' });
  }
});

module.exports = router;

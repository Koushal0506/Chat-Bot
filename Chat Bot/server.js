require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        if (!userMessage) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
            return res.status(500).json({ error: 'Valid API key is missing in .env file' });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const requestBody = {
            contents: [{
                parts: [{ text: userMessage }]
            }]
        };

        const response = await axios.post(apiUrl, requestBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const generatedText = response.data.candidates[0].content.parts[0].text;
        res.json({ response: generatedText });

    } catch (error) {
        console.error('Error calling Gemini API:', error?.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to generate response properly',
            details: error?.response?.data || error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`VanshuBot Server is running on http://localhost:${PORT}`);
});

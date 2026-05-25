// File: api/run-ai.js
// Ye ek Master Backend File hai jo aapke saare 50+ AI tools ke liye kaam karegi.

export default async function handler(req, res) {
    // 1. CORS Headers (Taki aapki website se hi request aaye)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST request is allowed' });
    }

    try {
        // 2. Frontend se aaya hua Data nikalna
        // 'systemPrompt' batayega ki AI ko kya banna hai (eg. You are a Blog Writer)
        // 'userPrompt' batayega ki user ne kya type kiya hai (eg. Car ke upar blog likho)
        const { systemPrompt, userPrompt } = req.body;

        if (!userPrompt) {
            return res.status(400).json({ error: 'User prompt is missing' });
        }

        // 3. Vercel se chupi hui API Key nikalna
        const API_KEY = process.env.OPENROUTER_API_KEY;

        if (!API_KEY) {
            return res.status(500).json({ error: 'API Key is missing in Vercel settings' });
        }

        // 4. OpenRouter (AI) ko request bhejna
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://orbitnova.vercel.app", // Apni site ka naam
                "X-Title": "OrbitNova Tools"
            },
            body: JSON.stringify({
                // Hum free model use kar rahe hain
                "model": "meta-llama/llama-3-8b-instruct:free", 
                "messages": [
                    { "role": "system", "content": systemPrompt || "You are a helpful AI assistant." },
                    { "role": "user", "content": userPrompt }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "AI Provider Error");
        }

        // 5. Result wapas Frontend ko bhej dena
        const finalAnswer = data.choices[0].message.content;
        return res.status(200).json({ result: finalAnswer });

    } catch (error) {
        console.error("Backend Error:", error);
        return res.status(500).json({ error: 'Failed to generate response. Please try again later.' });
    }
}

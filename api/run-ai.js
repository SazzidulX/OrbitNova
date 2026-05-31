export default async function handler(req, res) {
    // Sabhi domains allow karne ke liye
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { userPrompt, systemPrompt } = req.body;

        const key1 = process.env.OPENROUTER_API_KEY_1;
        const key2 = process.env.OPENROUTER_API_KEY_2;
        const apiKeys = [key1, key2].filter(key => key); 

        if (apiKeys.length === 0) {
            return res.status(500).json({ error: 'VERCEL ERROR: API Key Environment Variables me nahi mili.' });
        }

        let responseData = null;
        let success = false;
        let exactOpenRouterError = "";

        // OpenRouter strict hai ki request kahan se aayi, isliye dynamically link bhejna zaroori hai
        const siteUrl = req.headers.origin || req.headers.referer || "https://orbit-nova.vercel.app";

        for (let i = 0; i < apiKeys.length; i++) {
            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKeys[i]}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": siteUrl, 
                        "X-Title": "OrbitNova"
                    },
                    body: JSON.stringify({
                        model: "google/gemini-2.0-flash-exp:free", // Free Model
                        messages: [
                            { role: "system", content: systemPrompt || "You are a helpful assistant." },
                            { role: "user", content: userPrompt }
                        ]
                    })
                });

                const data = await response.json();

                if (response.ok && data.choices) {
                    responseData = data;
                    success = true;
                    break; 
                } else {
                    // YAHAN SE ASLI ERROR PATA CHALEGA!
                    exactOpenRouterError = data.error ? data.error.message : `HTTP Status: ${response.status}`;
                }
            } catch (err) {
                exactOpenRouterError = err.message;
            }
        }

        if (success) {
            return res.status(200).json({ result: responseData.choices[0].message.content });
        } else {
            // Frontend ko real error send karega
            return res.status(500).json({ error: `OPENROUTER REJECTED: ${exactOpenRouterError}` });
        }

    } catch (error) {
        return res.status(500).json({ error: 'SERVER LOGIC ERROR: ' + error.message });
    }
}

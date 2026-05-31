export default async function handler(req, res) {
    // === Security Layer (CORS) ===
    // Abhi test mode me hai, isliye "*" use kar rahe hain (Allow All). 
    // Jab domain lenge, tab isko change karke specific domain dalenge.
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { userPrompt, systemPrompt, model } = req.body;

        // Fetching API keys from Vercel Environment Variables
        const key1 = process.env.OPENROUTER_API_KEY_1;
        const key2 = process.env.OPENROUTER_API_KEY_2;
        const apiKeys = [key1, key2].filter(key => key); 

        if (apiKeys.length === 0) {
            return res.status(500).json({ error: 'API Keys missing in server environment.' });
        }

        let responseData = null;
        let success = false;

        // Fallback Logic: Try keys one by one
        for (let i = 0; i < apiKeys.length; i++) {
            const currentKey = apiKeys[i];
            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${currentKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://orbitnova.com", // Temporary identifier
                        "X-Title": "OrbitNova Tools"
                    },
                    body: JSON.stringify({
                        model: model || "google/gemini-2.5-flash-free",
                        messages: [
                            { role: "system", content: systemPrompt || "You are a helpful assistant." },
                            { role: "user", content: userPrompt }
                        ]
                    })
                });

                if (response.ok) {
                    responseData = await response.json();
                    success = true;
                    break; // Exit loop if successful
                } else {
                    console.warn(`API Key ${i + 1} failed with status: ${response.status}`);
                }
            } catch (err) {
                console.warn(`API Key ${i + 1} encountered an error:`, err);
            }
        }

        // Return successful data to frontend
        if (success && responseData.choices && responseData.choices.length > 0) {
            return res.status(200).json({ result: responseData.choices[0].message.content });
        } else {
            return res.status(500).json({ error: 'All API limits reached or network issue.' });
        }

    } catch (error) {
        console.error("Backend Error:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

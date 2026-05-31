export default async function handler(req, res) {
    // Sirf POST request accept karega
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { userPrompt, systemPrompt, model } = req.body;

        // Vercel se dono keys uthana
        const key1 = process.env.OPENROUTER_API_KEY_1;
        const key2 = process.env.OPENROUTER_API_KEY_2;
        
        // Dono keys ko ek list (array) me daal diya. Jo khali hogi wo ignore ho jayegi.
        const apiKeys = [key1, key2].filter(key => key); 

        if (apiKeys.length === 0) {
            return res.status(500).json({ error: 'API Keys missing in server.' });
        }

        let responseData = null;
        let success = false;

        // "Fallback System" - Ek ke baad ek key try karega
        for (let i = 0; i < apiKeys.length; i++) {
            const currentKey = apiKeys[i];
            
            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${currentKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://orbitnova.com", // Apni website ka link
                        "X-Title": "OrbitNova Tools"
                    },
                    body: JSON.stringify({
                        model: model || "google/gemini-2.5-flash-free",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt }
                        ]
                    })
                });

                // Agar response sahi (200 OK) hai, toh data save karo aur Loop tod do (break)
                if (response.ok) {
                    responseData = await response.json();
                    success = true;
                    break; 
                } else {
                    // Agar Key-1 fail hui toh console me print karega aur Key-2 try karega
                    console.warn(`Key ${i + 1} failed with status: ${response.status}`);
                }
            } catch (err) {
                console.warn(`Key ${i + 1} encountered an error:`, err);
            }
        }

        // Loop ke baad check karenge ki kya kisi bhi ek key ne result diya?
        if (success && responseData.choices && responseData.choices.length > 0) {
            // Frontend ko AI ka result bhej do
            return res.status(200).json({ result: responseData.choices[0].message.content });
        } else {
            // Dono key fail ho gayi toh frontend ko error bhejo
            return res.status(500).json({ error: 'All API limits reached. Try again later.' });
        }

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

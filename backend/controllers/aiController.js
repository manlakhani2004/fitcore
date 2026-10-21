const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-mock-key-for-development'
});

// @desc    AI Chat endpoint
// @route   POST /api/ai/chat
// @access  Private
exports.chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        if (!process.env.OPENAI_API_KEY) {
            // Fallback for development if no key is provided
            console.warn("OPENAI_API_KEY is not set. Using fallback mock response.");
            const msgLower = message.toLowerCase();
            let responseText = "I'm FitBot! (Mock Mode) I can help you with nutrition, workout tips, or motivation.";
            
            if (msgLower.includes('protein')) responseText = "Mock: Aim for 0.8-1g of protein per pound of body weight.";
            if (msgLower.includes('workout')) responseText = "Mock: Make sure you're focusing on progressive overload.";

            return res.status(200).json({ success: true, data: { reply: responseText } });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are FitBot, a highly motivating and knowledgeable fitness and nutrition AI assistant. Provide concise, helpful advice." },
                { role: "user", content: message }
            ],
            max_tokens: 150,
        });

        res.status(200).json({ success: true, data: { reply: completion.choices[0].message.content } });
    } catch (err) {
        console.error("AI Error:", err);
        res.status(500).json({ success: false, message: 'Server Error communicating with AI' });
    }
};

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const translateMessage = async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;

        if (!text?.trim()) {
            return res.status(400).json({
                message: "Text is required"
            });
        }

        if (!targetLanguage?.trim()) {
            return res.status(400).json({
                message: "Target language is required"
            });
        }

        const prompt = `
You are the translation assistant for a messaging application.

Translate this message into ${targetLanguage}.

Rules:
- Return ONLY the translated message.
- Do not explain anything.
- Preserve emojis.
- Preserve names.
- Preserve the original meaning and tone.
- Do not add quotation marks.

Message:
${text}
`;

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt
        });

        const translatedText =
            response.text?.trim();

        if (!translatedText) {
            return res.status(500).json({
                message: "Translation was empty"
            });
        }

        return res.status(200).json({
            translatedText
        });

    } catch (error) {
        console.error(
            "AI translation error:",
            error
        );

        return res.status(500).json({
            message: "AI translation failed"
        });
    }
};

module.exports = {
    translateMessage
};
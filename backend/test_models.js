require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Access the model directly to list models if possible, or try a known model
        // The SDK doesn't have a direct listModels method on the client instance in all versions,
        // but let's try to just instantiate a model and see if we can get a clearer error or if there's a way to list.
        // Actually, the error message says "Call ListModels to see the list of available models".
        // In the Node SDK, this is often done via the ModelManager or similar, but simpler is to just try a few standard ones.

        // Let's try to fetch the model info if possible.
        // Since I can't easily browse the SDK docs right now, I will try to use the 'gemini-1.5-flash' which SHOULD work.
        // The previous error for 1.5-flash was also 404.

        console.log("Testing gemini-1.5-flash...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("Hello");
            console.log("gemini-1.5-flash worked!");
            return;
        } catch (e) {
            console.log("gemini-1.5-flash failed: " + e.message);
        }

        console.log("Testing gemini-1.5-pro...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
            const result = await model.generateContent("Hello");
            console.log("gemini-1.5-pro worked!");
            return;
        } catch (e) {
            console.log("gemini-1.5-pro failed: " + e.message);
        }

         console.log("Testing gemini-1.0-pro...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
            const result = await model.generateContent("Hello");
            console.log("gemini-1.0-pro worked!");
            return;
        } catch (e) {
            console.log("gemini-1.0-pro failed: " + e.message);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();

require('dotenv').config();

console.log('Environment Variables Check:');
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
console.log('VAPI_API_KEY exists:', !!process.env.VAPI_API_KEY);

// Test Gemini API directly
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiAPI() {
    try {
        console.log('\nTesting Gemini API...');

        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not found');
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = "Hello, can you help me with a simple health question?";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ Gemini API test successful!');
        console.log('Response length:', text.length);
        console.log('Response preview:', text.substring(0, 100) + '...');

        return true;
    } catch (error) {
        console.log('❌ Gemini API test failed:');
        console.log('Error:', error.message);
        return false;
    }
}

// Test the service
async function testServices() {
    try {
        const geminiService = require('./services/geminiService');
        console.log('\nTesting GeminiService...');

        const result = await geminiService.generateHealthResponse(
            "Hello, I have a headache. What should I do?",
            {},
            'en'
        );

        if (result.success) {
            console.log('✅ GeminiService test successful!');
            console.log('Response:', result.response.substring(0, 100) + '...');
        } else {
            console.log('❌ GeminiService test failed:');
            console.log('Error:', result.error);
            console.log('Fallback:', result.fallbackResponse);
        }
    } catch (error) {
        console.log('❌ Service test error:', error.message);
    }
}

async function runTests() {
    await testGeminiAPI();
    await testServices();
}

runTests();
const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

// Test gemini-1.5-flash again
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

const payload = {
  contents: [{
    parts: [{ text: "Hello" }]
  }]
};

async function testEndpoint() {
  console.log(`Testing: ${url.split('?')[0]}`);
  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (response.status === 200) {
      console.log(`✅ SUCCESS! Status: ${response.status}`);
      console.log('Response:', response.data.candidates[0].content.parts[0].text);
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status} - ${error.response.statusText}`);
    }
  }
}

testEndpoint();

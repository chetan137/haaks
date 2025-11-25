const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function testMultipleFileUpload() {
  try {
    console.log('🚀 Testing multiple file upload...');

    // Create FormData
    const formData = new FormData();

    // Add both sample files
    formData.append('files', fs.createReadStream('./engine/data/sample.cpy'));
    formData.append('files', fs.createReadStream('./engine/data/sample.dat'));

    // Upload to server
    const response = await axios.post('http://localhost:3001/processFile', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('✅ Upload successful!');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));

    const jobId = response.data.jobId;
    console.log(`📊 Job ID: ${jobId}`);

    // Poll for status
    console.log('⏳ Polling for completion...');
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const statusResponse = await axios.get(`http://localhost:3001/status/${jobId}`);
        const status = statusResponse.data;

        console.log(`📈 Progress: ${status.progress}% - ${status.logs[status.logs.length - 1]}`);

        if (status.status === 'completed') {
          completed = true;
          console.log('🎉 Processing completed!');

          // Get final results
          const resultResponse = await axios.get(`http://localhost:3001/result/${jobId}`);
          console.log('📄 Final Results:');
          console.log(`   - Schema tables: ${resultResponse.data.result.schema?.tables?.length || 0}`);
          console.log(`   - API endpoints: ${resultResponse.data.result.apiDesign?.endpoints?.length || 0}`);
          console.log(`   - Confidence: ${Math.round((resultResponse.data.result.confidence || 0) * 100)}%`);
          console.log(`   - Files processed: ${resultResponse.data.result.processedFiles?.length || 0}`);

          if (resultResponse.data.result.processedFiles) {
            console.log('📁 Processed files:');
            resultResponse.data.result.processedFiles.forEach(file => {
              console.log(`   - ${file.name} (${file.type}, ${file.size} bytes)`);
            });
          }

        } else if (status.status === 'failed') {
          console.error('❌ Processing failed:', status.error);
          break;
        }
      } catch (statusError) {
        console.error('⚠️ Status check failed:', statusError.message);
      }

      attempts++;
    }

    if (!completed) {
      console.log('⏰ Polling timeout - check server logs for details');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📄 Server response:', error.response.data);
    }
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await axios.get('http://localhost:3001/health');
    console.log('✅ Server is running');
    console.log('🤖 AI System Ready:', response.data.aiSystemReady);
    return true;
  } catch (error) {
    console.error('❌ Server not running on http://localhost:3001');
    console.error('💡 Start the server with: cd engine && npm start');
    return false;
  }
}

async function main() {
  console.log('🔍 Checking server status...');
  const serverRunning = await checkServer();

  if (serverRunning) {
    await testMultipleFileUpload();
  }
}

main();
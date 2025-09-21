const { parseCopybook, callGeminiAPI } = require('./controllers/modernizeController');

// Test data
const testCopybookContent = `
       01  ACCT-FIELDS.
           05  ACCT-NO            PIC X(8).
           05  ACCT-LIMIT         PIC S9(7)V99 COMP-3.
           05  LAST-NAME          PIC X(20).
           05  CLIENT-ADDR.
               10  STREET-ADDR    PIC X(25).
               10  CITY           PIC X(15).
`;

const testDataContent = `12345678      5000000Johnson             123 Main Street         Springfield
87654321      7500000Smith               456 Oak Avenue          Denver
11111111      2500000Brown               789 Pine Road           Austin         `;

async function testModernizeAPI() {
    console.log('🧪 Testing AS/400 Modernization API...\n');

    try {
        // Test 1: Parse Copybook
        console.log('📝 Test 1: Parsing COBOL Copybook...');
        const parsedSchema = parseCopybook(testCopybookContent);
        console.log('✅ Copybook parsed successfully:');
        console.log(JSON.stringify(parsedSchema, null, 2));
        console.log('\n');

        // Test 2: Call Gemini API (only if you want to test the actual API call)
        console.log('🤖 Test 2: Calling Gemini AI for modernization...');
        const modernizationResult = await callGeminiAPI(parsedSchema, testDataContent);
        console.log('✅ Gemini AI response received:');
        console.log(JSON.stringify(modernizationResult, null, 2));
        console.log('\n');

        console.log('🎉 All tests passed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testModernizeAPI();
}

module.exports = { testModernizeAPI };
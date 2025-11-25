const AIClient = require('../../engine/aiClient');
const { MongoClient } = require('mongodb');

// Initialize AI Client
const aiClient = new AIClient();

// MongoDB connection
let mongoClient = null;
let db = null;

// Initialize MongoDB connection
async function initializeDatabase() {
    if (!mongoClient) {
        try {
            mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/modernization');
            await mongoClient.connect();
            db = mongoClient.db('modernization');
            console.log('Connected to MongoDB successfully');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }
    return db;
}

/**
 * Parse COBOL Copybook Content
 * Extracts field definitions from COBOL copybook and returns structured JSON
 * @param {string} copybookContent - Raw content of the .cpy file
 * @returns {Object} Parsed copybook schema
 */
function parseCopybook(copybookContent) {
    try {
        const lines = copybookContent.split('\n');
        const fields = [];
        let recordName = '';
        let currentGroup = null;
        let groupStack = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip empty lines and comments
            if (!line || line.startsWith('*')) continue;

            // Extract record name (01 level)
            const recordMatch = line.match(/^\s*01\s+([A-Za-z0-9\-_]+)/);
            if (recordMatch) {
                recordName = recordMatch[1];
                continue;
            }

            // Parse field definitions
            const fieldMatch = line.match(/^\s*(\d{2})\s+([A-Za-z0-9\-_]+)(?:\s+(PIC\s+[^.\s]+(?:\s+COMP\-\d)?))?\s*\.?/);
            if (fieldMatch) {
                const level = fieldMatch[1];
                const name = fieldMatch[2];
                const picClause = fieldMatch[3];

                const field = {
                    level: level,
                    name: name
                };

                // Handle group items (no PIC clause)
                if (!picClause) {
                    field.isGroup = true;
                    field.fields = [];

                    // If this is a group, we'll nest subsequent fields
                    if (parseInt(level) === 5) {
                        currentGroup = field;
                        fields.push(field);
                    } else if (parseInt(level) > 5 && currentGroup) {
                        currentGroup.fields.push(field);
                    }
                } else {
                    field.type = picClause;

                    // Add to current group or main fields array
                    if (currentGroup && parseInt(level) > 5) {
                        currentGroup.fields.push(field);
                    } else {
                        currentGroup = null; // Reset group context
                        fields.push(field);
                    }
                }
            }
        }

        return {
            recordName: recordName || 'UNNAMED-RECORD',
            fields: fields
        };

    } catch (error) {
        console.error('Error parsing copybook:', error);
        throw new Error('Failed to parse COBOL copybook: ' + error.message);
    }
}
/**
 * Call Gemini AI API for legacy modernization
 * @param {Object} parsedSchema - Parsed COBOL schema
 * @param {string} datafileContent - Raw content of the .dat file
 * @returns {Object} AI-generated modernization assets
 */
async function callGeminiAPI(parsedSchema, datafileContent) {
    try {
        const prompt = `You are an expert AS/400 modernization architect. Your task is to convert a legacy COBOL file definition and its data into a complete set of modern assets.

Here is the parsed COBOL copybook schema:
${JSON.stringify(parsedSchema, null, 2)}

Here are the first few records from the data file for context:
${datafileContent.substring(0, 500)}

Based on this, generate a single, valid JSON object as your response. Do not include any other text or explanations. The JSON object must contain the following five keys: "dbSchema", "restApi", "jsonData", "microservices", and "microserviceDiagram".

1. **dbSchema**: Generate a single CREATE TABLE SQL statement for a modern PostgreSQL database that accurately represents the copybook schema. Use appropriate modern data types (e.g., VARCHAR, INTEGER, DECIMAL, TEXT).

2. **restApi**: Generate the complete code for a simple Node.js Express REST API. This API should have a GET all endpoint (/api/accounts) and a GET by ID endpoint (/api/accounts/:id). The code should be fully functional. Keep the code concise.

3. **jsonData**: Convert the provided raw data file content into a clean, human-readable JSON array of objects. Limit to first 5 records only.

4. **microservices**: Suggest two potential microservices that could be built from this data, including a one-line description for each.

5. **microserviceDiagram**: Based on the two microservices you suggested, generate a simple component diagram using Mermaid.js graph TD syntax. The diagram should show a 'User' interacting with a 'Load Balancer', which then directs traffic to the two suggested microservices.

IMPORTANT: Keep your response concise. Ensure your response is valid JSON that can be parsed directly. Do not truncate the JSON - make sure all strings are properly closed.`;

        console.log('Calling AI Client for modernization...');
        const text = await aiClient.generateContent(prompt, {
            temperature: 0.2,
            maxOutputTokens: 8192,
            systemPrompt: 'You are an expert AS/400 modernization architect. Always return complete, valid JSON.'
        });

        console.log('AI Response received, length:', text.length);

        // Clean the response and parse JSON
        let cleanedText = text.trim();

        // Remove markdown code blocks
        cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/i, '');

        // Remove any leading/trailing whitespace
        cleanedText = cleanedText.trim();

        console.log('Cleaned response length:', cleanedText.length);
        console.log('First 200 chars:', cleanedText.substring(0, 200));
        console.log('Last 200 chars:', cleanedText.substring(cleanedText.length - 200));

        try {
            const parsed = JSON.parse(cleanedText);
            console.log('Successfully parsed JSON response');
            return parsed;
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError.message);
            console.error('Error at position:', parseError.message.match(/position (\d+)/)?.[1]);
            console.error('Full raw response:', text);

            // Try to find and extract valid JSON object
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    console.log('Attempting to parse extracted JSON...');
                    const extracted = jsonMatch[0];

                    // Check if the JSON is truncated (common issue)
                    if (!extracted.endsWith('}')) {
                        console.error('JSON appears to be truncated');
                        throw new Error('Response was truncated - incomplete JSON received');
                    }

                    const parsed = JSON.parse(extracted);
                    console.log('Successfully parsed extracted JSON');
                    return parsed;
                } catch (extractError) {
                    console.error('Failed to parse extracted JSON:', extractError.message);
                }
            }

            // If all parsing attempts fail, throw detailed error
            throw new Error(`Invalid JSON response from AI: ${parseError.message}. Response length: ${text.length} chars. Check logs for full response.`);
        }

    } catch (error) {
        console.error('=== AI Client Error ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        throw new Error('Failed to process with AI Client: ' + error.message);
    }
}

/**
 * The Insight Engine - AI-powered ROI Analysis
 * Generates Return on Investment analysis for legacy modernization
 * @param {Object} parsedSchema - Parsed COBOL schema
 * @returns {Object} ROI analysis results
 */
async function getInsightEngineAnalysis(parsedSchema) {
    try {
        const prompt = `You are an expert AI-powered IT project management consultant specializing in legacy system modernization. Your task is to analyze the provided COBOL copybook schema and generate a concise Return on Investment (ROI) analysis, which will be branded as "The Insight Engine".

Here is the parsed COBOL schema:
${JSON.stringify(parsedSchema, null, 2)}

Your response MUST be a single, valid JSON object and nothing else. The JSON object must follow this exact structure:
{
  "analysisTitle": "The Insight Engine",
  "manualEffort": { "hours": "string", "timeline": "string", "costUSD": "string" },
  "automatedTool": { "time": "string", "costUSD": "string" },
  "summary": "string"
}

Provide realistic estimates based on the complexity of the schema. Consider factors like number of fields, data types, and typical enterprise development rates. The summary should be a concise 2-3 sentence explanation of the ROI benefits.`;

        console.log('Calling AI Client for Insight Engine analysis...');
        const text = await aiClient.generateContent(prompt, {
            temperature: 0.2,
            systemPrompt: 'You are an expert IT consultant.'
        });

        // Clean the response and parse JSON
        let cleanedText = text.trim();
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');

        try {
            return JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('JSON Parse Error in Insight Engine:', parseError);

            // Fallback: try to extract JSON from the response
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            throw new Error('Invalid JSON response');
        }

    } catch (error) {
        console.error('Insight Engine Analysis Error:', error);

        // Return fallback analysis in case of API failure
        return {
            analysisTitle: "The Insight Engine",
            manualEffort: {
                hours: "480-720",
                timeline: "3-4 months",
                costUSD: "$48,000-$72,000"
            },
            automatedTool: {
                time: "2-3 weeks",
                costUSD: "$5,000-$8,000"
            },
            summary: "Automated modernization tools can reduce development time by 85% and costs by 80% compared to manual migration approaches."
        };
    }
}

/**
 * Modernize Legacy Files - Main controller function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function modernizeLegacyFiles(req, res) {
    try {
        console.log('=== Modernization Request Started ===');
        console.log('Files received:', req.files);
        console.log('User:', req.user);

        // Validate that files were uploaded
        if (!req.files || !req.files.copybook || !req.files.datafile) {
            console.error('Missing files. Received:', req.files);
            return res.status(400).json({
                success: false,
                error: 'Both copybook (.cpy) and datafile (.dat) are required',
                received: {
                    hasCopybook: !!(req.files && req.files.copybook),
                    hasDatafile: !!(req.files && req.files.datafile),
                    filesReceived: req.files ? Object.keys(req.files) : []
                }
            });
        }

        if (!req.files.copybook[0] || !req.files.datafile[0]) {
            console.error('Empty file arrays');
            return res.status(400).json({
                success: false,
                error: 'Both copybook and datafile must be provided'
            });
        }

        const copybookFile = req.files.copybook[0];
        const dataFile = req.files.datafile[0];

        // Validate file extensions
        if (!copybookFile.originalname.toLowerCase().endsWith('.cpy')) {
            return res.status(400).json({
                success: false,
                error: 'Copybook file must have .cpy extension'
            });
        }

        if (!dataFile.originalname.toLowerCase().endsWith('.dat')) {
            return res.status(400).json({
                success: false,
                error: 'Data file must have .dat extension'
            });
        }

        // Convert buffers to strings
        const copybookContent = copybookFile.buffer.toString('utf-8');
        const datafileContent = dataFile.buffer.toString('utf-8');

        // Validate file contents
        if (!copybookContent.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Copybook file is empty or invalid'
            });
        }

        if (!datafileContent.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Data file is empty or invalid'
            });
        }

        console.log(`Processing files for user: ${req.user.email}`);
        console.log(`Copybook: ${copybookFile.originalname} (${copybookFile.size} bytes)`);
        console.log(`Data file: ${dataFile.originalname} (${dataFile.size} bytes)`);

        // Step 1: Parse the COBOL copybook
        const parsedSchema = parseCopybook(copybookContent);
        console.log('Parsed schema:', JSON.stringify(parsedSchema, null, 2));

        // Step 2: Call Gemini AI for modernization
        const modernizationResult = await callGeminiAPI(parsedSchema, datafileContent);
        console.log('Primary modernization completed');

        // Step 3: Call The Insight Engine for ROI analysis
        const insightEngineResult = await getInsightEngineAnalysis(parsedSchema);
        console.log('Insight Engine analysis completed');

        // Step 4: Combine results into final modernization assets
        const combinedAssets = {
            dbSchema: modernizationResult.dbSchema,
            restApi: modernizationResult.restApi,
            jsonData: modernizationResult.jsonData,
            microservices: modernizationResult.microservices,
            microserviceDiagram: modernizationResult.microserviceDiagram,
            insightEngine: insightEngineResult
        };

        // Step 5: Prepare the final response
        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            user: req.user.email,
            files: {
                copybook: copybookFile.originalname,
                datafile: dataFile.originalname
            },
            parsedSchema: parsedSchema,
            modernizationAssets: combinedAssets
        };

        // Step 6: Optionally save to user's profile in MongoDB
        try {
            // Example: Add to user's modernization history
        } catch (dbError) {
            console.error('Database save error:', dbError);
        }

        // Step 7: Send the response
        res.status(200).json(response);

    } catch (error) {
        console.error('=== Modernization Error ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Error details:', error);

        res.status(500).json({
            success: false,
            error: error.message || 'An error occurred during modernization',
            timestamp: new Date().toISOString(),
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

/**
 * Talk to your Data - Convert natural language questions to MongoDB queries and execute them
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function queryData(req, res) {
    try {
        // Validate request body
        const { question } = req.body;

        if (!question || typeof question !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Question field is required and must be a string'
            });
        }

        // Initialize database connection
        const database = await initializeDatabase();

        // Call Gemini AI to convert question to MongoDB query
        let mongoQueryObject;

        const prompt = `You are an expert AI data analyst that specializes in converting natural language questions into valid MongoDB find queries.

The data is stored in a collection named 'accounts', and the documents have fields like: ACCT_NO, ACCT_LIMIT, ACCT_BALANCE, LAST_NAME, FIRST_NAME, STREET_ADDR, CITY_COUNTY, USA_STATE, COMMENTS.

The user's question is:
"${question}"

Your response must be a single, valid JSON object and nothing else. The JSON object must contain one key, "mongoQuery", which is the MongoDB find query object.

Example: If the question is "list all customers from New York", your output should be:
{ "mongoQuery": { "USA_STATE": "New York" } }

Example: If the question is "find the customer with the last name Stark", your output should be:
{ "mongoQuery": { "LAST_NAME": "Stark" } }`;

        console.log('Calling AI Client for data query...');
        const text = await aiClient.generateContent(prompt, {
            temperature: 0.1,
            systemPrompt: 'You are an expert AI data analyst.'
        });

        // Clean and parse the AI response
        let cleanedText = text.trim();
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');

        try {
            const aiResponse = JSON.parse(cleanedText);
            mongoQueryObject = aiResponse.mongoQuery;
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            console.error('Raw AI response:', text);
            throw new Error('Invalid query response from AI');
        }

        console.log('Generated MongoDB query:', JSON.stringify(mongoQueryObject, null, 2));

        // Execute the MongoDB query
        const collection = database.collection('accounts');
        const queryResults = await collection.find(mongoQueryObject).limit(100).toArray();

        console.log(`Query executed successfully. Found ${queryResults.length} results.`);

        // Return the results
        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            user: req.user.email,
            question: question,
            mongoQuery: mongoQueryObject,
            resultCount: queryResults.length,
            data: queryResults
        });

    } catch (error) {
        console.error('Data query error:', error);

        res.status(500).json({
            success: false,
            error: error.message || 'An error occurred while querying data',
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * AI Co-Pilot - Refine generated code based on user instructions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function refineGeneratedCode(req, res) {
    try {
        // Validate request body
        const { code, instruction } = req.body;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Code field is required and must be a string'
            });
        }

        if (!instruction || typeof instruction !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Instruction field is required and must be a string'
            });
        }

        console.log(`Processing code refinement for user: ${req.user.email}`);
        console.log(`Instruction: ${instruction}`);
        console.log(`Code length: ${code.length} characters`);

        // Call Gemini AI to refine the code
        let refinedCode;

        const prompt = `You are an expert AI Code Refinement Assistant. Your task is to take a block of existing code and modify it based on a user's instruction. You must only return the complete, new block of code and nothing else. Do not add any explanations or markdown formatting.

Here is the code you need to modify:
\`\`\`javascript
${code}
\`\`\`

Here is the user's instruction:
"${instruction}"

Now, generate and return the complete, fully updated code block that incorporates the user's change.`;

        console.log('Calling AI Client for code refinement...');
        const text = await aiClient.generateContent(prompt, {
            temperature: 0.1,
            systemPrompt: 'You are an expert AI Code Refinement Assistant.'
        });

        refinedCode = text.trim();

        // Clean up any markdown formatting if present
        let cleanedCode = refinedCode;
        cleanedCode = cleanedCode.replace(/^```javascript\s*/, '').replace(/\s*```$/, '');
        cleanedCode = cleanedCode.replace(/^```\s*/, '').replace(/\s*```$/, '');

        console.log('Code refinement completed successfully');

        // Return the refined code
        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            user: req.user.email,
            instruction: instruction,
            originalCodeLength: code.length,
            refinedCodeLength: cleanedCode.length,
            refinedCode: cleanedCode
        });

    } catch (error) {
        console.error('Code refinement error:', error);

        res.status(500).json({
            success: false,
            error: error.message || 'An error occurred while refining code',
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = {
    modernizeLegacyFiles,
    parseCopybook,
    callGeminiAPI,
    getInsightEngineAnalysis,
    queryData,
    refineGeneratedCode
};

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are an expert AS/400 modernization architect. Your task is to convert a legacy COBOL file definition and its data into a complete set of modern assets.

Here is the parsed COBOL copybook schema:
${JSON.stringify(parsedSchema, null, 2)}

Here are the first few records from the data file for context:
${datafileContent.substring(0, 500)}

Based on this, generate a single, valid JSON object as your response. Do not include any other text or explanations. The JSON object must contain the following four keys: "dbSchema", "restApi", "jsonData", and "microservices".

1. **dbSchema**: Generate a single CREATE TABLE SQL statement for a modern PostgreSQL database that accurately represents the copybook schema. Use appropriate modern data types (e.g., VARCHAR, INTEGER, DECIMAL, TEXT).

2. **restApi**: Generate the complete code for a simple Node.js Express REST API. This API should have a GET all endpoint (/api/accounts) and a GET by ID endpoint (/api/accounts/:id). The code should be fully functional.

3. **jsonData**: Convert the provided raw data file content into a clean, human-readable JSON array of objects.

4. **microservices**: Suggest two potential microservices that could be built from this data, including a one-line description for each.

Ensure your response is valid JSON that can be parsed directly.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean the response and parse JSON
        let cleanedText = text.trim();

        // Remove any markdown code block markers if present
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');

        try {
            return JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Raw Response:', text);

            // Fallback: try to extract JSON from the response
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            throw new Error('Invalid JSON response from AI');
        }

    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('Failed to process with Gemini AI: ' + error.message);
    }
}

/**
 * Main controller function to handle legacy file modernization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function modernizeLegacyFiles(req, res) {
    try {
        // Validate file uploads
        if (!req.files || !req.files.copybook || !req.files.datafile) {
            return res.status(400).json({
                success: false,
                error: 'Both copybook (.cpy) and datafile (.dat) are required'
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

        // Step 3: Prepare the final response
        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            user: req.user.email,
            files: {
                copybook: copybookFile.originalname,
                datafile: dataFile.originalname
            },
            parsedSchema: parsedSchema,
            modernizationAssets: modernizationResult
        };

        // Step 4: Optionally save to user's profile in MongoDB
        // You can implement this based on your User model structure
        try {
            // Example: Add to user's modernization history
            // await User.findByIdAndUpdate(req.user._id, {
            //     $push: {
            //         modernizationHistory: {
            //             timestamp: new Date(),
            //             copybookName: copybookFile.originalname,
            //             datafileName: dataFile.originalname,
            //             parsedSchema: parsedSchema,
            //             result: modernizationResult
            //         }
            //     }
            // });
        } catch (dbError) {
            console.error('Database save error:', dbError);
            // Don't fail the request if DB save fails
        }

        // Step 5: Send the response
        res.status(200).json(response);

    } catch (error) {
        console.error('Modernization error:', error);

        res.status(500).json({
            success: false,
            error: error.message || 'An error occurred during modernization',
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = {
    modernizeLegacyFiles,
    parseCopybook,
    callGeminiAPI
};
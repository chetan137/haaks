# AS/400 Modernization API Documentation

## Overview
The AS/400 Modernization API provides a secure endpoint for transforming legacy COBOL files into modern web assets using AI-powered analysis.

## Authentication
All endpoints require Bearer token authentication in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### POST /api/v1/modernize

Modernizes legacy COBOL files (.cpy copybook and .dat data file) into modern web assets.

#### Request
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Authentication**: Required (Bearer Token)

#### Form Data Fields
| Field | Type | Description | Required |
|-------|------|-------------|----------|
| copybook | File | COBOL copybook file (.cpy extension) | Yes |
| datafile | File | Legacy data file (.dat extension) | Yes |

#### File Requirements
- **Copybook**: Must have `.cpy` extension, max 10MB
- **Datafile**: Must have `.dat` extension, max 10MB
- **Total files**: Maximum 2 files per request

#### Example Request (cURL)
```bash
curl -X POST http://localhost:5000/api/v1/modernize \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "copybook=@inventory.cpy" \
  -F "datafile=@inventory.dat"
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "user": "user@example.com",
  "files": {
    "copybook": "inventory.cpy",
    "datafile": "inventory.dat"
  },
  "parsedSchema": {
    "recordName": "ACCT-FIELDS",
    "fields": [
      {
        "level": "05",
        "name": "ACCT-NO",
        "type": "PIC X(8)"
      },
      {
        "level": "05",
        "name": "ACCT-LIMIT",
        "type": "PIC S9(7)V99 COMP-3"
      },
      {
        "level": "05",
        "name": "LAST-NAME",
        "type": "PIC X(20)"
      },
      {
        "level": "05",
        "name": "CLIENT-ADDR",
        "isGroup": true,
        "fields": [
          {
            "level": "10",
            "name": "STREET-ADDR",
            "type": "PIC X(25)"
          }
        ]
      }
    ]
  },
  "modernizationAssets": {
    "dbSchema": "CREATE TABLE accounts (...);",
    "restApi": "const express = require('express'); ...",
    "jsonData": [{"acctNo": "12345678", "acctLimit": 50000, ...}],
    "microservices": ["Account Management Service", "Address Validation Service"]
  }
}
```

#### Error Responses

##### 400 Bad Request - Missing Files
```json
{
  "success": false,
  "error": "Both copybook (.cpy) and datafile (.dat) are required"
}
```

##### 400 Bad Request - Invalid File Extension
```json
{
  "success": false,
  "error": "Copybook file must have .cpy extension"
}
```

##### 400 Bad Request - Empty Files
```json
{
  "success": false,
  "error": "Copybook file is empty or invalid"
}
```

##### 401 Unauthorized
```json
{
  "message": "Access token required"
}
```

##### 413 Payload Too Large
```json
{
  "success": false,
  "error": "File too large. Maximum file size is 10MB"
}
```

##### 500 Internal Server Error
```json
{
  "success": false,
  "error": "An error occurred during modernization",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## COBOL Copybook Parser

### Supported COBOL Features
- Level numbers (01-49)
- Field names and record names
- PIC clauses (X, 9, S, V, COMP-3, etc.)
- Group items (fields without PIC clauses)
- Nested structures

### Example Input Copybook
```cobol
       01  ACCT-FIELDS.
           05  ACCT-NO            PIC X(8).
           05  ACCT-LIMIT         PIC S9(7)V99 COMP-3.
           05  LAST-NAME          PIC X(20).
           05  CLIENT-ADDR.
               10  STREET-ADDR    PIC X(25).
               10  CITY           PIC X(15).
```

### Example Parsed Output
```json
{
  "recordName": "ACCT-FIELDS",
  "fields": [
    {
      "level": "05",
      "name": "ACCT-NO",
      "type": "PIC X(8)"
    },
    {
      "level": "05",
      "name": "CLIENT-ADDR",
      "isGroup": true,
      "fields": [
        {
          "level": "10",
          "name": "STREET-ADDR",
          "type": "PIC X(25)"
        }
      ]
    }
  ]
}
```

## AI Modernization Assets

The API returns four types of modernized assets:

### 1. Database Schema (`dbSchema`)
- PostgreSQL CREATE TABLE statement
- Modern data types (VARCHAR, INTEGER, DECIMAL)
- Appropriate field lengths and constraints

### 2. REST API (`restApi`)
- Complete Node.js Express API code
- GET all records endpoint
- GET by ID endpoint
- Fully functional and ready to deploy

### 3. JSON Data (`jsonData`)
- Converted legacy data in JSON format
- Clean, human-readable structure
- Array of objects representing records

### 4. Microservices (`microservices`)
- Suggested microservice architectures
- Two service recommendations
- Brief descriptions for each service

## Testing the API

### 1. Using Postman
1. Set method to POST
2. Set URL to `http://localhost:5000/api/v1/modernize`
3. Add Authorization header with Bearer token
4. In Body tab, select form-data
5. Add "copybook" field as File and upload .cpy file
6. Add "datafile" field as File and upload .dat file
7. Send request

### 2. Using cURL
```bash
# First, get authentication token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use the returned token for modernization
curl -X POST http://localhost:5000/api/v1/modernize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "copybook=@inventory.cpy" \
  -F "datafile=@inventory.dat"
```

### 3. Using Node.js Test Script
```javascript
const { testModernizeAPI } = require('./test-modernize-api');
testModernizeAPI();
```

## File Structure

```
backend/
├── controllers/
│   └── modernizeController.js    # Main controller with COBOL parser and AI integration
├── middleware/
│   └── uploadMiddleware.js       # Multer configuration for file uploads
├── routes/
│   └── modernizeRoutes.js        # Route definitions
└── test-modernize-api.js         # Test script
```

## Environment Variables

Ensure these environment variables are set in your `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
SESSION_SECRET=your_session_secret
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

## Security Features

- JWT token authentication required
- File type validation (.cpy and .dat only)
- File size limits (10MB per file)
- Malicious file detection
- Memory-based storage (no disk writes)
- Input sanitization and validation

## Rate Limiting

Consider implementing rate limiting for production use:
- Limit requests per IP
- Limit concurrent uploads
- Implement user-based quotas

## Performance Considerations

- Files are processed in memory
- Large files may impact performance
- Consider implementing async processing for very large files
- Monitor AI API usage and costs

## Error Handling

The API includes comprehensive error handling for:
- File upload errors
- Authentication failures
- COBOL parsing errors
- AI API failures
- Database connection issues
- Server errors

All errors include appropriate HTTP status codes and descriptive messages.
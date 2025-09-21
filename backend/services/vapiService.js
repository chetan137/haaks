const fetch = require('node-fetch');

class VapiService {
  constructor() {
    this.apiKey = process.env.VAPI_API_KEY;
    this.baseUrl = 'https://api.vapi.ai';

    // Health assistant configuration for Vapi
    this.assistantConfig = {
      name: "Aarogya Sahayak Voice Assistant",
      firstMessage: "Hello! I'm Aarogya Sahayak, your AI health assistant. How can I help you with your health questions today?",
      model: {
        provider: "openai",
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        maxTokens: 500,
        systemMessage: `You are Aarogya Sahayak, an AI-powered health assistant. You provide helpful, accurate health information while being empathetic and supportive.

IMPORTANT GUIDELINES:
1. Provide health information for educational purposes only
2. Never diagnose medical conditions
3. Always recommend consulting healthcare professionals for serious concerns
4. Be culturally sensitive and respectful
5. Focus on preventive care, lifestyle modifications, and general wellness
6. Keep responses concise for voice interaction
7. Maintain a warm, supportive tone`
      },
      voice: {
        provider: "playht",
        voiceId: "jennifer",
        speed: 1.0,
        temperature: 0.7
      },
      recordingEnabled: true,
      endCallMessage: "Take care of your health. Have a great day!",
      endCallPhrases: ["goodbye", "bye", "end call", "thank you", "that's all"],
      maxDurationSeconds: 600,
      silenceTimeoutSeconds: 30,
      responseDelaySeconds: 0.4,
      llmRequestDelaySeconds: 0.1,
      numWordsToInterruptAssistant: 2,
      backgroundSound: "office"
    };
  }

  async createCall(phoneNumber = null, assistantId = null, healthContext = {}) {
    try {
      const callPayload = {
        assistant: assistantId ? { id: assistantId } : await this.createHealthAssistant(healthContext)
      };

      // Add phone number only if provided
      if (phoneNumber) {
        callPayload.customer = { number: phoneNumber };
      }

      const response = await fetch(`${this.baseUrl}/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(callPayload)
      });

      if (!response.ok) {
        throw new Error(`Vapi API Error: ${response.status} ${response.statusText}`);
      }

      const callData = await response.json();

      return {
        success: true,
        callId: callData.id,
        status: callData.status,
        data: callData
      };
    } catch (error) {
      console.error('Vapi Create Call Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createHealthAssistant(healthContext = {}) {
    try {
      const systemMessage = this.buildHealthAssistantPrompt(healthContext);

      const assistantPayload = {
        name: "Aarogya Sahayak Voice Assistant",
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          temperature: 0.7,
          maxTokens: 500,
          systemMessage: systemMessage
        },
        voice: {
          provider: "playht",
          voiceId: "jennifer",
          speed: 1.0,
          temperature: 0.7
        },
        firstMessage: healthContext.language === 'hi'
          ? "नमस्ते! मैं आरोग्य सहायक हूं। मैं आपकी स्वास्थ्य संबंधी जानकारी में कैसे सहायता कर सकता हूं?"
          : "Hello! I'm Aarogya Sahayak, your health assistant. How can I help you with your health queries today?",
        endCallMessage: healthContext.language === 'hi'
          ? "स्वास्थ्य की देखभाल करते रहें। धन्यवाद!"
          : "Take care of your health. Thank you!",
        endCallPhrases: ["goodbye", "bye", "end call", "धन्यवाद", "अलविदा"],
        recordingEnabled: true,
        maxDurationSeconds: 600, // 10 minutes max call duration
        silenceTimeoutSeconds: 30,
        voicemailDetection: {
          enabled: true,
          machineDetectionTimeout: 5000
        }
      };

      const response = await fetch(`${this.baseUrl}/assistant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assistantPayload)
      });

      if (!response.ok) {
        throw new Error(`Vapi Assistant Creation Error: ${response.status} ${response.statusText}`);
      }

      const assistantData = await response.json();
      return assistantData;
    } catch (error) {
      console.error('Vapi Create Assistant Error:', error);
      throw error;
    }
  }

  buildHealthAssistantPrompt(healthContext = {}) {
    let prompt = `You are Aarogya Sahayak, an AI-powered health assistant. You provide helpful, accurate health information while being empathetic and supportive.

IMPORTANT GUIDELINES:
1. Provide health information for educational purposes only
2. Never diagnose medical conditions
3. Always recommend consulting healthcare professionals for serious concerns
4. Be culturally sensitive and respectful
5. Focus on preventive care, lifestyle modifications, and general wellness
6. Ask clarifying questions when needed
7. Keep responses concise for voice interaction
8. Maintain a warm, supportive tone`;

    if (healthContext.userProfile) {
      prompt += `\n\nUSER CONTEXT:`;
      if (healthContext.userProfile.age) {
        prompt += `\n- Age: ${healthContext.userProfile.age}`;
      }
      if (healthContext.userProfile.gender) {
        prompt += `\n- Gender: ${healthContext.userProfile.gender}`;
      }
      if (healthContext.userProfile.conditions?.length > 0) {
        prompt += `\n- Health Conditions: ${healthContext.userProfile.conditions.join(', ')}`;
      }
      if (healthContext.userProfile.language) {
        prompt += `\n- Preferred Language: ${healthContext.userProfile.language}`;
      }
    }

    if (healthContext.language && healthContext.language !== 'en') {
      const languageMap = {
        'hi': 'Hindi',
        'mr': 'Marathi',
        'bn': 'Bengali',
        'te': 'Telugu',
        'ta': 'Tamil',
        'gu': 'Gujarati',
        'kn': 'Kannada',
        'ml': 'Malayalam',
        'pa': 'Punjabi',
        'or': 'Odia',
        'as': 'Assamese',
        'ur': 'Urdu'
      };

      const languageName = languageMap[healthContext.language] || 'English';
      prompt += `\n\nIMPORTANT: Respond primarily in ${languageName}. Use simple, clear language suitable for voice communication.`;
    }

    return prompt;
  }

  buildHealthAssistantConfig(healthContext = {}) {
    const systemMessage = this.buildHealthAssistantPrompt(healthContext);

    let firstMessage = "Hello! I'm Aarogya Sahayak, your AI health assistant. How can I help you with your health questions today?";

    if (healthContext.language === 'hi') {
      firstMessage = "नमस्ते! मैं आरोग्य सहायक हूं, आपका AI स्वास्थ्य सहायक। आज मैं आपकी स्वास्थ्य संबंधी किसी भी जानकारी में कैसे सहायता कर सकता हूं?";
    }

    return {
      ...this.assistantConfig,
      firstMessage,
      model: {
        ...this.assistantConfig.model,
        systemMessage
      }
    };
  }

  async getCall(callId) {
    try {
      const response = await fetch(`${this.baseUrl}/call/${callId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Vapi Get Call Error: ${response.status} ${response.statusText}`);
      }

      const callData = await response.json();
      return {
        success: true,
        data: callData
      };
    } catch (error) {
      console.error('Vapi Get Call Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async endCall(callId) {
    try {
      const response = await fetch(`${this.baseUrl}/call/${callId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Vapi End Call Error: ${response.status} ${response.statusText}`);
      }

      return {
        success: true,
        message: 'Call ended successfully'
      };
    } catch (error) {
      console.error('Vapi End Call Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getCallRecording(callId) {
    try {
      const response = await fetch(`${this.baseUrl}/call/${callId}/recording`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Vapi Recording Error: ${response.status} ${response.statusText}`);
      }

      const recordingData = await response.json();
      return {
        success: true,
        recordingUrl: recordingData.recordingUrl,
        transcript: recordingData.transcript,
        duration: recordingData.duration
      };
    } catch (error) {
      console.error('Vapi Recording Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createWebRTCCall(healthContext = {}) {
    try {
      // Validate API key
      if (!this.apiKey) {
        throw new Error('VAPI_API_KEY is not configured');
      }

      // Create or use existing assistant
      const assistantPayload = this.buildHealthAssistantConfig(healthContext);

      const webRTCPayload = {
        assistant: assistantPayload,
        type: "webCall",
        metadata: {
          source: "aarogya_sahayak",
          timestamp: new Date().toISOString(),
          language: healthContext.language || 'en'
        }
      };

      console.log('Creating WebRTC call with Vapi.ai...');

      const response = await fetch(`${this.baseUrl}/call/web`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webRTCPayload)
      });

      const responseText = await response.text();
      console.log('Vapi WebRTC Response Status:', response.status);

      if (!response.ok) {
        let errorMessage = `Vapi WebRTC Error: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage += ` - ${errorData.message || errorData.error || responseText}`;
        } catch {
          errorMessage += ` - ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      const callData = JSON.parse(responseText);

      // Validate response data
      if (!callData.id) {
        throw new Error('Invalid response: missing call ID');
      }

      return {
        success: true,
        callId: callData.id,
        webRTCUrl: callData.webRtcUrl || callData.webRTCUrl,
        token: callData.token,
        status: callData.status,
        assistantId: callData.assistantId,
        data: callData
      };
    } catch (error) {
      console.error('Vapi WebRTC Call Error:', error);
      return {
        success: false,
        error: error.message,
        details: error.stack
      };
    }
  }

  // Helper method to process webhook events
  processWebhookEvent(eventData) {
    try {
      const { type, call, message } = eventData;

      switch (type) {
        case 'call-start':
          console.log(`Voice call started: ${call.id}`);
          break;
        case 'call-end':
          console.log(`Voice call ended: ${call.id}, Duration: ${call.duration}s`);
          break;
        case 'speech-start':
          console.log(`User started speaking in call: ${call.id}`);
          break;
        case 'speech-end':
          console.log(`User stopped speaking in call: ${call.id}`);
          break;
        case 'transcript':
          console.log(`Transcript - ${message.role}: ${message.content}`);
          break;
        case 'function-call':
          console.log(`Function called: ${message.functionCall.name}`);
          break;
        default:
          console.log(`Unknown webhook event: ${type}`);
      }

      return {
        success: true,
        eventType: type,
        processed: true
      };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new VapiService();
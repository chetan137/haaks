const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required in environment variables');
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    });

    // Health-focused system prompt
    this.systemPrompt = `You are an AI-powered health assistant called "Aarogya Sahayak" (Health Helper). Your role is to provide helpful, accurate, and personalized health information while being empathetic and supportive.

IMPORTANT GUIDELINES:
1. Always provide health information for educational purposes only
2. Never diagnose medical conditions or replace professional medical advice
3. Always recommend consulting healthcare professionals for serious concerns
4. Be culturally sensitive and respectful
5. Provide responses in the user's preferred language
6. Focus on preventive care, lifestyle modifications, and general wellness
7. Ask clarifying questions when needed to provide better assistance
8. Maintain a warm, supportive, and professional tone

AREAS OF EXPERTISE:
- General health and wellness advice
- Diet and nutrition guidance
- Exercise and fitness recommendations
- Mental health and stress management
- Medication reminders and general information
- Symptom awareness (not diagnosis)
- Healthy lifestyle habits
- Preventive care recommendations

RESPONSE FORMAT:
- Keep responses concise but informative
- Use bullet points for lists when appropriate
- Include actionable advice when possible
- End with encouraging words or next steps
- Always remind users to consult healthcare providers for medical concerns`;
  }

  async generateHealthResponse(userMessage, healthContext = {}, userLanguage = 'en') {
    try {
      // Input validation
      if (!userMessage || typeof userMessage !== 'string') {
        throw new Error('User message is required and must be a string');
      }

      // Build context-aware prompt
      let contextPrompt = this.systemPrompt;

      if (healthContext.userProfile) {
        contextPrompt += `\n\nUSER HEALTH CONTEXT:`;
        if (healthContext.userProfile.age) {
          contextPrompt += `\n- Age: ${healthContext.userProfile.age}`;
        }
        if (healthContext.userProfile.gender) {
          contextPrompt += `\n- Gender: ${healthContext.userProfile.gender}`;
        }
        if (healthContext.userProfile.conditions?.length > 0) {
          contextPrompt += `\n- Health Conditions: ${healthContext.userProfile.conditions.join(', ')}`;
        }
        if (healthContext.userProfile.medications?.length > 0) {
          contextPrompt += `\n- Current Medications: ${healthContext.userProfile.medications.join(', ')}`;
        }
        if (healthContext.userProfile.allergies?.length > 0) {
          contextPrompt += `\n- Allergies: ${healthContext.userProfile.allergies.join(', ')}`;
        }
      }

      if (healthContext.conversationHistory?.length > 0) {
        contextPrompt += `\n\nRECENT CONVERSATION:`;
        healthContext.conversationHistory.forEach((msg, index) => {
          if (index < 5) { // Last 5 messages for context
            contextPrompt += `\n${msg.role}: ${msg.content}`;
          }
        });
      }

      // Add language preference
      const languageMap = {
        'en': 'English',
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

      const languageName = languageMap[userLanguage] || 'English';
      contextPrompt += `\n\nIMPORTANT: Respond in ${languageName} language.`;

      // Final prompt with user message
      const fullPrompt = `${contextPrompt}\n\nUSER MESSAGE: ${userMessage}\n\nRESPONSE:`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;

      // Check if response was blocked
      if (response.promptFeedback?.blockReason) {
        throw new Error(`Content blocked: ${response.promptFeedback.blockReason}`);
      }

      const text = response.text();

      // Validate response
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini API');
      }

      return {
        success: true,
        response: text.trim(),
        usage: {
          promptTokens: fullPrompt.length,
          completionTokens: text.length,
          totalTokens: fullPrompt.length + text.length
        },
        finishReason: response.candidates?.[0]?.finishReason || 'STOP'
      };
    } catch (error) {
      console.error('Gemini API Error:', error);

      // Enhanced error handling
      let errorMessage = 'Failed to generate response';
      if (error.message.includes('API_KEY')) {
        errorMessage = 'Invalid API key configuration';
      } else if (error.message.includes('quota')) {
        errorMessage = 'API quota exceeded';
      } else if (error.message.includes('blocked')) {
        errorMessage = 'Content was blocked by safety filters';
      }

      return {
        success: false,
        error: errorMessage,
        originalError: error.message,
        fallbackResponse: this.getFallbackResponse(userLanguage)
      };
    }
  }

  async generateHealthTips(userProfile = {}, language = 'en') {
    try {
      let tipPrompt = `Generate 3 personalized daily health tips for a user. Make them practical and actionable.`;

      if (userProfile.age) {
        tipPrompt += ` User is ${userProfile.age} years old.`;
      }
      if (userProfile.conditions?.length > 0) {
        tipPrompt += ` User has the following health conditions: ${userProfile.conditions.join(', ')}.`;
      }
      if (userProfile.lifestyle) {
        tipPrompt += ` Lifestyle: exercise frequency is ${userProfile.lifestyle.exerciseFrequency}, sleep hours: ${userProfile.lifestyle.sleepHours}.`;
      }

      const languageMap = {
        'en': 'English',
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

      const languageName = languageMap[language] || 'English';
      tipPrompt += ` Respond in ${languageName}. Format as numbered list.`;

      const result = await this.model.generateContent(tipPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        tips: text.split('\n').filter(tip => tip.trim().length > 0)
      };
    } catch (error) {
      console.error('Health Tips Generation Error:', error);
      return {
        success: false,
        error: error.message,
        fallbackTips: this.getFallbackTips(language)
      };
    }
  }

  async analyzeSymptoms(symptoms, userProfile = {}, language = 'en') {
    try {
      let symptomPrompt = `Analyze the following symptoms and provide general information about possible causes and when to seek medical attention. Do NOT diagnose. Symptoms: ${symptoms.join(', ')}.`;

      if (userProfile.age) {
        symptomPrompt += ` Patient age: ${userProfile.age}.`;
      }
      if (userProfile.gender) {
        symptomPrompt += ` Gender: ${userProfile.gender}.`;
      }
      if (userProfile.conditions?.length > 0) {
        symptomPrompt += ` Existing conditions: ${userProfile.conditions.join(', ')}.`;
      }

      symptomPrompt += ` IMPORTANT: Emphasize that this is for informational purposes only and recommend consulting a healthcare provider. Respond in ${language === 'en' ? 'English' : 'the user\'s local language'}.`;

      const result = await this.model.generateContent(symptomPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        analysis: text
      };
    } catch (error) {
      console.error('Symptom Analysis Error:', error);
      return {
        success: false,
        error: error.message,
        fallbackResponse: 'Please consult a healthcare professional for symptom evaluation.'
      };
    }
  }

  getFallbackResponse(language = 'en') {
    const fallbacks = {
      'en': "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. For urgent health concerns, please contact your healthcare provider immediately.",
      'hi': "मुझे खुशी है, मैं अभी कनेक्ट करने में कठिनाई हो रही है। कृपया एक क्षण में पुनः प्रयास करें। तत्काल स्वास्थ्य चिंताओं के लिए, कृपया तुरंत अपने स्वास्थ्य सेवा प्रदाता से संपर्क करें।",
      'mr': "मला माफ करा, मला आत्ता कनेक्ट करण्यात अडचण येत आहे. कृपया एका क्षणात पुन्हा प्रयत्न करा. तातडीच्या आरोग्य चिंतांसाठी, कृपया लगेच आपल्या आरोग्यसेवा प्रदात्याशी संपर्क साधा."
    };

    return fallbacks[language] || fallbacks['en'];
  }

  getFallbackTips(language = 'en') {
    const tips = {
      'en': [
        '1. Drink at least 8 glasses of water daily',
        '2. Get 7-8 hours of quality sleep',
        '3. Include fruits and vegetables in every meal'
      ],
      'hi': [
        '1. प्रतिदिन कम से कम 8 गिलास पानी पिएं',
        '2. 7-8 घंटे की गुणवत्तापूर्ण नींद लें',
        '3. हर भोजन में फल और सब्जियां शामिल करें'
      ]
    };

    return tips[language] || tips['en'];
  }
}

module.exports = new GeminiService();
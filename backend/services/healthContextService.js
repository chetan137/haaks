const HealthProfile = require('../models/HealthProfile');
const HealthRecord = require('../models/HealthRecord');
const ChatConversation = require('../models/ChatConversation');
const User = require('../models/User');

class HealthContextService {
  constructor() {
    this.contextCache = new Map(); // Simple in-memory cache
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
  }

  async getUserHealthContext(userId, includeHistory = true) {
    try {
      const cacheKey = `health_context_${userId}`;

      // Check cache first
      if (this.contextCache.has(cacheKey)) {
        const cached = this.contextCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
        this.contextCache.delete(cacheKey);
      }

      // Fetch user data
      const user = await User.findById(userId).select('name email language location dateOfBirth');
      if (!user) {
        throw new Error('User not found');
      }

      // Fetch health profile
      const healthProfile = await HealthProfile.findOne({ userId });

      // Fetch recent health records
      const recentHealthRecords = await HealthRecord.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10);

      // Fetch recent conversation history if requested
      let conversationHistory = [];
      if (includeHistory) {
        const recentConversations = await ChatConversation.find({ userId, isActive: true })
          .sort({ updatedAt: -1 })
          .limit(3);

        conversationHistory = recentConversations.flatMap(conv =>
          conv.messages.slice(-5) // Last 5 messages from each conversation
        );
      }

      // Build comprehensive health context
      const healthContext = this.buildHealthContext(user, healthProfile, recentHealthRecords, conversationHistory);

      // Cache the result
      this.contextCache.set(cacheKey, {
        data: healthContext,
        timestamp: Date.now()
      });

      return healthContext;
    } catch (error) {
      console.error('Health Context Service Error:', error);
      throw error;
    }
  }

  buildHealthContext(user, healthProfile, healthRecords, conversationHistory) {
    const context = {
      user: {
        name: user.name,
        language: user.language || 'en',
        location: user.location
      },
      userProfile: {},
      healthSummary: {},
      recentActivity: {},
      conversationHistory: conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }))
    };

    // Calculate age if date of birth is available
    if (user.dateOfBirth || healthProfile?.personalInfo?.dateOfBirth) {
      const dob = user.dateOfBirth || healthProfile.personalInfo.dateOfBirth;
      context.userProfile.age = this.calculateAge(dob);
    }

    if (healthProfile) {
      // Personal information
      if (healthProfile.personalInfo) {
        context.userProfile.gender = healthProfile.personalInfo.gender;
        context.userProfile.bloodType = healthProfile.personalInfo.bloodType;
      }

      // Current health conditions
      if (healthProfile.medicalHistory?.conditions?.length > 0) {
        context.userProfile.conditions = healthProfile.medicalHistory.conditions
          .filter(condition => condition.status === 'active')
          .map(condition => condition.name);
      }

      // Current medications
      if (healthProfile.currentMedications?.length > 0) {
        context.userProfile.medications = healthProfile.currentMedications
          .map(med => med.name);
      }

      // Allergies
      if (healthProfile.medicalHistory?.allergies?.length > 0) {
        context.userProfile.allergies = healthProfile.medicalHistory.allergies
          .map(allergy => allergy.allergen);
      }

      // Lifestyle information
      if (healthProfile.lifestyle) {
        context.userProfile.lifestyle = {
          exerciseFrequency: healthProfile.lifestyle.exerciseFrequency,
          sleepHours: healthProfile.lifestyle.sleepHours,
          dietType: healthProfile.lifestyle.dietType,
          smokingStatus: healthProfile.lifestyle.smokingStatus,
          alcoholConsumption: healthProfile.lifestyle.alcoholConsumption,
          stressLevel: healthProfile.lifestyle.stressLevel
        };
      }

      // Recent vital signs
      if (healthProfile.vitalSigns?.length > 0) {
        const latestVitals = healthProfile.vitalSigns[healthProfile.vitalSigns.length - 1];
        context.healthSummary.latestVitals = {
          date: latestVitals.date,
          bloodPressure: latestVitals.bloodPressure,
          heartRate: latestVitals.heartRate,
          weight: latestVitals.weight,
          bmi: latestVitals.bmi
        };
      }

      // Health preferences
      if (healthProfile.preferences) {
        context.userProfile.preferences = {
          communicationMethod: healthProfile.preferences.communicationMethod,
          healthGoals: healthProfile.preferences.healthGoals,
          dietaryRestrictions: healthProfile.preferences.dietaryRestrictions
        };
      }
    }

    // Process recent health records
    if (healthRecords?.length > 0) {
      context.recentActivity = this.analyzeRecentHealthRecords(healthRecords);
    }

    return context;
  }

  analyzeRecentHealthRecords(healthRecords) {
    const analysis = {
      recordCount: healthRecords.length,
      lastRecordDate: null,
      vitalTrends: {},
      symptomsPattern: [],
      medicationCompliance: null
    };

    if (healthRecords.length === 0) return analysis;

    // Sort by date for trend analysis
    const sortedRecords = healthRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    analysis.lastRecordDate = sortedRecords[0].date;

    // Analyze vital sign trends
    const vitalSigns = ['bloodPressure', 'heartRate', 'weight', 'bloodSugar'];

    vitalSigns.forEach(vital => {
      const values = sortedRecords
        .map(record => record.vitals?.[vital])
        .filter(value => value !== undefined && value !== null);

      if (values.length >= 2) {
        const recent = values[0];
        const previous = values[1];

        if (vital === 'bloodPressure') {
          analysis.vitalTrends[vital] = {
            current: recent,
            trend: this.calculateBPTrend(recent, previous),
            status: this.assessBPStatus(recent)
          };
        } else {
          analysis.vitalTrends[vital] = {
            current: recent,
            trend: recent > previous ? 'increasing' : recent < previous ? 'decreasing' : 'stable',
            changePercent: previous !== 0 ? ((recent - previous) / previous * 100).toFixed(1) : 0
          };
        }
      }
    });

    // Analyze symptoms pattern
    const recentSymptoms = sortedRecords
      .slice(0, 5) // Last 5 records
      .flatMap(record => record.symptoms || [])
      .filter(symptom => symptom);

    if (recentSymptoms.length > 0) {
      const symptomCounts = {};
      recentSymptoms.forEach(symptom => {
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
      });

      analysis.symptomsPattern = Object.entries(symptomCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3) // Top 3 symptoms
        .map(([symptom, count]) => ({ symptom, frequency: count }));
    }

    return analysis;
  }

  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  calculateBPTrend(current, previous) {
    if (!current?.systolic || !previous?.systolic) return 'unknown';

    const currentAvg = (current.systolic + current.diastolic) / 2;
    const previousAvg = (previous.systolic + previous.diastolic) / 2;

    const diff = currentAvg - previousAvg;

    if (Math.abs(diff) < 3) return 'stable';
    return diff > 0 ? 'increasing' : 'decreasing';
  }

  assessBPStatus(bp) {
    if (!bp?.systolic || !bp?.diastolic) return 'unknown';

    const { systolic, diastolic } = bp;

    if (systolic < 120 && diastolic < 80) return 'normal';
    if (systolic < 130 && diastolic < 80) return 'elevated';
    if (systolic < 140 || diastolic < 90) return 'stage1_hypertension';
    if (systolic < 180 || diastolic < 120) return 'stage2_hypertension';
    return 'crisis';
  }

  generateHealthInsights(healthContext) {
    const insights = [];

    // BMI insights
    if (healthContext.healthSummary?.latestVitals?.bmi) {
      const bmi = parseFloat(healthContext.healthSummary.latestVitals.bmi);
      if (bmi < 18.5) {
        insights.push({
          type: 'bmi',
          level: 'attention',
          message: 'Your BMI indicates underweight. Consider consulting a nutritionist for a healthy weight gain plan.'
        });
      } else if (bmi > 25) {
        insights.push({
          type: 'bmi',
          level: 'attention',
          message: 'Your BMI indicates overweight. Consider a balanced diet and regular exercise.'
        });
      }
    }

    // Exercise insights
    if (healthContext.userProfile?.lifestyle?.exerciseFrequency) {
      const exercise = healthContext.userProfile.lifestyle.exerciseFrequency;
      if (exercise === 'never' || exercise === 'rarely') {
        insights.push({
          type: 'exercise',
          level: 'recommendation',
          message: 'Regular physical activity is crucial for good health. Start with 30 minutes of moderate exercise 3-4 times per week.'
        });
      }
    }

    // Sleep insights
    if (healthContext.userProfile?.lifestyle?.sleepHours) {
      const sleep = healthContext.userProfile.lifestyle.sleepHours;
      if (sleep < 7) {
        insights.push({
          type: 'sleep',
          level: 'attention',
          message: 'You may not be getting enough sleep. Adults need 7-9 hours of quality sleep for optimal health.'
        });
      }
    }

    // Medication reminders
    if (healthContext.userProfile?.medications?.length > 0) {
      insights.push({
        type: 'medication',
        level: 'reminder',
        message: `Remember to take your medications as prescribed: ${healthContext.userProfile.medications.join(', ')}`
      });
    }

    return insights;
  }

  async updateHealthContext(userId, updates) {
    try {
      // Clear cache for this user
      this.contextCache.delete(`health_context_${userId}`);

      // Update health profile if provided
      if (updates.healthProfile) {
        await HealthProfile.findOneAndUpdate(
          { userId },
          updates.healthProfile,
          { upsert: true, new: true }
        );
      }

      // Return updated context
      return await this.getUserHealthContext(userId);
    } catch (error) {
      console.error('Update Health Context Error:', error);
      throw error;
    }
  }

  clearCache(userId = null) {
    if (userId) {
      this.contextCache.delete(`health_context_${userId}`);
    } else {
      this.contextCache.clear();
    }
  }
}

module.exports = new HealthContextService();
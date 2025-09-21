const healthThresholds = {
  "blood_pressure": {
    "normal": {
      "systolic": { "min": 90, "max": 119 },
      "diastolic": { "min": 60, "max": 79 },
      "feedback": "Normal blood pressure ✅",
      "category": "normal",
      "suggestions": [
        "Maintain your current healthy lifestyle",
        "Continue regular exercise",
        "Keep a balanced diet with low sodium"
      ]
    },
    "elevated": {
      "systolic": { "min": 120, "max": 129 },
      "diastolic": { "max": 80 },
      "feedback": "Elevated blood pressure ⚠ (monitor regularly)",
      "category": "warning",
      "suggestions": [
        "Monitor blood pressure regularly",
        "Reduce sodium intake to less than 2300mg/day",
        "Increase physical activity to 30 minutes daily",
        "Practice stress management techniques"
      ]
    },
    "high_stage_1": {
      "systolic": { "min": 130, "max": 139 },
      "diastolic": { "min": 80, "max": 89 },
      "feedback": "High BP (Stage 1) 🚨 - lifestyle changes recommended",
      "category": "alert",
      "suggestions": [
        "Consult your doctor about treatment options",
        "Adopt DASH diet (rich in fruits, vegetables, whole grains)",
        "Limit alcohol consumption",
        "Maintain healthy weight",
        "Monitor BP daily and keep a log"
      ]
    },
    "high_stage_2": {
      "systolic": { "min": 140 },
      "diastolic": { "min": 90 },
      "feedback": "High BP (Stage 2) 🚨 - consult doctor",
      "category": "danger",
      "suggestions": [
        "Schedule immediate appointment with your doctor",
        "May require medication along with lifestyle changes",
        "Follow prescribed treatment plan strictly",
        "Monitor BP twice daily",
        "Avoid smoking and excessive caffeine"
      ]
    },
    "hypertensive_crisis": {
      "systolic": { "min": 180 },
      "diastolic": { "min": 120 },
      "feedback": "Hypertensive crisis 🚨 - seek emergency care",
      "category": "emergency",
      "suggestions": [
        "Seek emergency medical care immediately",
        "Call emergency services or go to nearest ER",
        "Do not drive yourself to hospital",
        "This requires immediate medical intervention"
      ]
    }
  },

  "blood_sugar": {
    "fasting": {
      "low": {
        "max": 69,
        "feedback": "Low blood sugar 🚨 - consult doctor",
        "category": "danger",
        "suggestions": [
          "Consume 15g fast-acting carbs immediately",
          "Check sugar again in 15 minutes",
          "Contact your doctor if frequent low episodes",
          "Always carry glucose tablets or snacks"
        ]
      },
      "normal": {
        "min": 70,
        "max": 99,
        "feedback": "Normal fasting sugar ✅",
        "category": "normal",
        "suggestions": [
          "Maintain current healthy eating habits",
          "Continue regular physical activity",
          "Keep consistent meal timing"
        ]
      },
      "prediabetes": {
        "min": 100,
        "max": 125,
        "feedback": "Prediabetes range ⚠",
        "category": "warning",
        "suggestions": [
          "Focus on weight management if overweight",
          "Increase physical activity to 150 min/week",
          "Choose complex carbohydrates over simple sugars",
          "Consider consulting a nutritionist",
          "Regular monitoring recommended"
        ]
      },
      "high": {
        "min": 126,
        "feedback": "High fasting sugar 🚨 - possible diabetes",
        "category": "alert",
        "suggestions": [
          "Schedule appointment with doctor for diabetes screening",
          "Monitor blood sugar regularly",
          "Limit refined carbohydrates and sugary foods",
          "Increase fiber intake",
          "Consider HbA1c test for better assessment"
        ]
      }
    },
    "post_meal": {
      "normal": {
        "max": 140,
        "feedback": "Normal post-meal sugar ✅",
        "category": "normal",
        "suggestions": [
          "Good glucose management after meals",
          "Continue balanced meal portions",
          "Maintain regular eating schedule"
        ]
      },
      "prediabetes": {
        "min": 141,
        "max": 199,
        "feedback": "Prediabetes range ⚠",
        "category": "warning",
        "suggestions": [
          "Consider smaller, more frequent meals",
          "Include protein and fiber with carbohydrates",
          "Take a 10-15 minute walk after meals",
          "Avoid large portions of high-carb foods"
        ]
      },
      "high": {
        "min": 200,
        "feedback": "High post-meal sugar 🚨 - possible diabetes",
        "category": "alert",
        "suggestions": [
          "Consult healthcare provider immediately",
          "Monitor what you eat and blood sugar response",
          "Consider portion control and meal timing",
          "May need professional dietary guidance"
        ]
      }
    }
  },

  "weight_bmi": {
    "underweight": {
      "max": 18.4,
      "feedback": "Underweight ⚠ - increase nutrition",
      "category": "warning",
      "suggestions": [
        "Consult nutritionist for healthy weight gain plan",
        "Focus on nutrient-dense, calorie-rich foods",
        "Include healthy fats like nuts, avocados, olive oil",
        "Consider strength training to build muscle mass",
        "Rule out underlying health conditions"
      ]
    },
    "normal": {
      "min": 18.5,
      "max": 24.9,
      "feedback": "Normal BMI ✅",
      "category": "normal",
      "suggestions": [
        "Maintain current healthy weight",
        "Continue balanced diet and regular exercise",
        "Focus on muscle maintenance through strength training"
      ]
    },
    "overweight": {
      "min": 25,
      "max": 29.9,
      "feedback": "Overweight ⚠ - maintain lifestyle",
      "category": "warning",
      "suggestions": [
        "Aim for 1-2 pounds weight loss per week",
        "Increase daily physical activity",
        "Focus on portion control",
        "Choose whole foods over processed foods",
        "Track food intake for awareness"
      ]
    },
    "obese": {
      "min": 30,
      "feedback": "Obese 🚨 - health action needed",
      "category": "alert",
      "suggestions": [
        "Consult healthcare provider for weight management plan",
        "Consider professional dietary counseling",
        "Start with low-impact exercises like walking",
        "Set realistic, gradual weight loss goals",
        "Address underlying health conditions",
        "Consider joining support groups"
      ]
    }
  },

  "cholesterol": {
    "total": {
      "optimal": {
        "max": 199,
        "feedback": "Optimal total cholesterol ✅",
        "category": "normal",
        "suggestions": [
          "Maintain heart-healthy diet",
          "Continue regular physical activity",
          "Keep current healthy lifestyle"
        ]
      },
      "borderline": {
        "min": 200,
        "max": 239,
        "feedback": "Borderline high cholesterol ⚠",
        "category": "warning",
        "suggestions": [
          "Reduce saturated fat intake",
          "Increase soluble fiber foods (oats, beans, fruits)",
          "Exercise regularly (150 min/week)",
          "Maintain healthy weight",
          "Consider plant sterols/stanols"
        ]
      },
      "high": {
        "min": 240,
        "feedback": "High cholesterol 🚨 - medical attention needed",
        "category": "alert",
        "suggestions": [
          "Consult doctor about treatment options",
          "May require medication (statins)",
          "Follow therapeutic lifestyle changes",
          "Limit trans fats and saturated fats",
          "Regular monitoring required"
        ]
      }
    },
    "ldl": {
      "optimal": {
        "max": 99,
        "feedback": "Optimal LDL (bad) cholesterol ✅",
        "category": "normal",
        "suggestions": [
          "Excellent LDL management",
          "Continue heart-healthy habits"
        ]
      },
      "near_optimal": {
        "min": 100,
        "max": 129,
        "feedback": "Near optimal LDL cholesterol",
        "category": "normal",
        "suggestions": [
          "Maintain current diet and exercise",
          "Monitor periodically"
        ]
      },
      "borderline": {
        "min": 130,
        "max": 159,
        "feedback": "Borderline high LDL ⚠",
        "category": "warning",
        "suggestions": [
          "Reduce dietary cholesterol and saturated fat",
          "Increase physical activity",
          "Add more vegetables and whole grains"
        ]
      },
      "high": {
        "min": 160,
        "max": 189,
        "feedback": "High LDL cholesterol 🚨",
        "category": "alert",
        "suggestions": [
          "Consult doctor for treatment plan",
          "Strict dietary modifications needed",
          "Regular exercise essential"
        ]
      },
      "very_high": {
        "min": 190,
        "feedback": "Very high LDL 🚨 - immediate action",
        "category": "danger",
        "suggestions": [
          "Immediate medical consultation required",
          "Likely need medication",
          "Aggressive lifestyle changes"
        ]
      }
    },
    "hdl": {
      "low_men": {
        "max": 39,
        "feedback": "Low HDL (good) cholesterol 🚨 (Men)",
        "category": "alert",
        "suggestions": [
          "Increase physical activity significantly",
          "Quit smoking if applicable",
          "Include healthy fats (omega-3)",
          "Lose weight if overweight"
        ]
      },
      "low_women": {
        "max": 49,
        "feedback": "Low HDL (good) cholesterol 🚨 (Women)",
        "category": "alert",
        "suggestions": [
          "Increase aerobic exercise",
          "Include nuts and olive oil in diet",
          "Maintain healthy weight",
          "Avoid trans fats"
        ]
      },
      "optimal_men": {
        "min": 40,
        "feedback": "Good HDL cholesterol ✅ (Men)",
        "category": "normal",
        "suggestions": [
          "Maintain current exercise routine",
          "Continue heart-healthy diet"
        ]
      },
      "optimal_women": {
        "min": 50,
        "feedback": "Good HDL cholesterol ✅ (Women)",
        "category": "normal",
        "suggestions": [
          "Excellent HDL levels",
          "Keep up healthy lifestyle"
        ]
      }
    }
  }
};

/**
 * Analyze vital signs and provide feedback
 * @param {string} vitalType - Type of vital (blood_pressure, blood_sugar, weight_bmi, cholesterol)
 * @param {object} values - The vital sign values
 * @param {object} userProfile - User profile for personalized analysis
 * @returns {object} Analysis result with feedback and suggestions
 */
function analyzeVital(vitalType, values, userProfile = {}) {
  const thresholds = healthThresholds[vitalType];
  if (!thresholds) {
    return { error: 'Invalid vital type' };
  }

  let result = {
    vitalType,
    values,
    category: 'unknown',
    feedback: 'Unable to analyze',
    suggestions: [],
    timestamp: new Date()
  };

  try {
    switch (vitalType) {
      case 'blood_pressure':
        result = analyzeBP(values, thresholds);
        break;
      case 'blood_sugar':
        result = analyzeBloodSugar(values, thresholds);
        break;
      case 'weight_bmi':
        result = analyzeBMI(values, thresholds);
        break;
      case 'cholesterol':
        result = analyzeCholesterol(values, thresholds, userProfile);
        break;
    }
  } catch (error) {
    result.error = error.message;
  }

  return result;
}

function analyzeBP(values, thresholds) {
  const { systolic, diastolic } = values;

  // Check for hypertensive crisis first
  if (systolic >= 180 || diastolic >= 120) {
    return {
      ...thresholds.hypertensive_crisis,
      values,
      vitalType: 'blood_pressure'
    };
  }

  // Check Stage 2 hypertension
  if (systolic >= 140 || diastolic >= 90) {
    return {
      ...thresholds.high_stage_2,
      values,
      vitalType: 'blood_pressure'
    };
  }

  // Check Stage 1 hypertension
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return {
      ...thresholds.high_stage_1,
      values,
      vitalType: 'blood_pressure'
    };
  }

  // Check elevated
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
    return {
      ...thresholds.elevated,
      values,
      vitalType: 'blood_pressure'
    };
  }

  // Normal range
  if (systolic >= 90 && systolic <= 119 && diastolic >= 60 && diastolic <= 79) {
    return {
      ...thresholds.normal,
      values,
      vitalType: 'blood_pressure'
    };
  }

  return {
    category: 'abnormal',
    feedback: 'Unusual blood pressure reading - consult healthcare provider',
    suggestions: ['Verify reading accuracy', 'Consult healthcare provider'],
    values,
    vitalType: 'blood_pressure'
  };
}

function analyzeBloodSugar(values, thresholds) {
  const { value, type } = values; // type: 'fasting' or 'post_meal'
  const ranges = thresholds[type];

  if (!ranges) {
    throw new Error('Invalid blood sugar type');
  }

  // Check each range
  for (const [key, range] of Object.entries(ranges)) {
    if (range.max && value <= range.max) {
      return {
        ...range,
        values,
        vitalType: 'blood_sugar',
        subType: type
      };
    }
    if (range.min && value >= range.min && (!range.max || value <= range.max)) {
      return {
        ...range,
        values,
        vitalType: 'blood_sugar',
        subType: type
      };
    }
    if (range.min && value >= range.min && !range.max) {
      return {
        ...range,
        values,
        vitalType: 'blood_sugar',
        subType: type
      };
    }
  }

  return {
    category: 'abnormal',
    feedback: 'Unusual blood sugar reading',
    suggestions: ['Verify reading accuracy', 'Consult healthcare provider'],
    values,
    vitalType: 'blood_sugar'
  };
}

function analyzeBMI(values, thresholds) {
  const { weight, height, bmi } = values;
  const bmiValue = bmi || (weight / ((height / 100) ** 2));

  for (const [key, range] of Object.entries(thresholds)) {
    if (range.max && bmiValue <= range.max) {
      return {
        ...range,
        values: { ...values, calculatedBMI: bmiValue.toFixed(1) },
        vitalType: 'weight_bmi'
      };
    }
    if (range.min && bmiValue >= range.min && (!range.max || bmiValue <= range.max)) {
      return {
        ...range,
        values: { ...values, calculatedBMI: bmiValue.toFixed(1) },
        vitalType: 'weight_bmi'
      };
    }
    if (range.min && bmiValue >= range.min && !range.max) {
      return {
        ...range,
        values: { ...values, calculatedBMI: bmiValue.toFixed(1) },
        vitalType: 'weight_bmi'
      };
    }
  }

  return {
    category: 'abnormal',
    feedback: 'Unusual BMI calculation',
    suggestions: ['Verify measurements', 'Consult healthcare provider'],
    values: { ...values, calculatedBMI: bmiValue.toFixed(1) },
    vitalType: 'weight_bmi'
  };
}

function analyzeCholesterol(values, thresholds, userProfile) {
  const { total, ldl, hdl, type } = values;
  const results = [];

  if (total && thresholds.total) {
    results.push(analyzeSpecificCholesterol(total, thresholds.total, 'total'));
  }

  if (ldl && thresholds.ldl) {
    results.push(analyzeSpecificCholesterol(ldl, thresholds.ldl, 'ldl'));
  }

  if (hdl && thresholds.hdl) {
    const gender = userProfile.gender || 'men';
    results.push(analyzeHDL(hdl, thresholds.hdl, gender));
  }

  return {
    type: 'cholesterol_panel',
    results,
    values,
    vitalType: 'cholesterol',
    overallRisk: calculateOverallCholesterolRisk(results)
  };
}

function analyzeSpecificCholesterol(value, ranges, cholesterolType) {
  for (const [key, range] of Object.entries(ranges)) {
    if (range.max && value <= range.max) {
      return { ...range, cholesterolType, value };
    }
    if (range.min && value >= range.min && (!range.max || value <= range.max)) {
      return { ...range, cholesterolType, value };
    }
    if (range.min && value >= range.min && !range.max) {
      return { ...range, cholesterolType, value };
    }
  }
}

function analyzeHDL(value, ranges, gender) {
  const genderKey = gender.toLowerCase() === 'female' ? 'women' : 'men';

  if (value < (genderKey === 'women' ? 50 : 40)) {
    return {
      ...ranges[`low_${genderKey}`],
      cholesterolType: 'hdl',
      value
    };
  } else {
    return {
      ...ranges[`optimal_${genderKey}`],
      cholesterolType: 'hdl',
      value
    };
  }
}

function calculateOverallCholesterolRisk(results) {
  const categories = results.map(r => r.category);

  if (categories.includes('danger')) return 'high_risk';
  if (categories.includes('alert')) return 'moderate_risk';
  if (categories.includes('warning')) return 'mild_risk';
  return 'low_risk';
}

module.exports = {
  healthThresholds,
  analyzeVital
};
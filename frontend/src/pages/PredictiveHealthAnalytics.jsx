import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const PredictiveHealthAnalytics = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  // State management
  const [healthData, setHealthData] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState(7);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [riskSummary, setRiskSummary] = useState([]);

  // API configuration
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Available users for selection (could be fetched from API in real implementation)
  const [availableUsers] = useState([
    { id: user?._id || 'demo-user', name: user?.name || 'Demo User', isCurrentUser: true },
    // Additional users could be added here for admin/doctor view
  ]);

  // Risk prediction algorithm
  const calculatePredictions = (data) => {
    if (!data || data.length < 2) return null;

    const latest = data[data.length - 1];
    const previous = data[data.length - 2];

    // Calculate trends
    const bloodSugarTrend = latest.bloodSugar - previous.bloodSugar;
    const bloodPressureTrend = latest.bloodPressure.systolic - previous.bloodPressure.systolic;
    const weightTrend = latest.weight - previous.weight;
    const heartRateTrend = latest.heartRate - previous.heartRate;

    // Calculate BMI (assuming height of 170cm for demo)
    const height = 1.7; // meters
    const bmi = latest.weight / (height * height);

    // Risk calculations
    const diabetesRisk = calculateDiabetesRisk(latest.bloodSugar, bloodSugarTrend, bmi);
    const hypertensionRisk = calculateHypertensionRisk(latest.bloodPressure, bloodPressureTrend);
    const cardiovascularRisk = calculateCardiovascularRisk(latest, bmi, heartRateTrend);
    const obesityRisk = calculateObesityRisk(bmi, weightTrend);

    return {
      diabetesRisk,
      hypertensionRisk,
      cardiovascularRisk,
      obesityRisk,
      overallScore: Math.round((diabetesRisk.score + hypertensionRisk.score + cardiovascularRisk.score + obesityRisk.score) / 4)
    };
  };

  const calculateDiabetesRisk = (bloodSugar, trend, bmi) => {
    let score = 0;
    let level = 'Low';
    let color = 'green';

    if (bloodSugar > 126) score += 40;
    else if (bloodSugar > 100) score += 20;

    if (trend > 10) score += 20;
    else if (trend > 5) score += 10;

    if (bmi > 30) score += 20;
    else if (bmi > 25) score += 10;

    if (score > 50) { level = 'High'; color = 'red'; }
    else if (score > 25) { level = 'Medium'; color = 'orange'; }

    return {
      score,
      level,
      color,
      recommendations: getDiabetesRecommendations(level),
      description: 'Risk of developing Type 2 diabetes based on blood sugar trends and BMI'
    };
  };

  const calculateHypertensionRisk = (bloodPressure, trend) => {
    let score = 0;
    let level = 'Low';
    let color = 'green';

    if (bloodPressure.systolic > 140) score += 40;
    else if (bloodPressure.systolic > 130) score += 20;

    if (trend > 10) score += 20;
    else if (trend > 5) score += 10;

    if (score > 40) { level = 'High'; color = 'red'; }
    else if (score > 20) { level = 'Medium'; color = 'orange'; }

    return {
      score,
      level,
      color,
      recommendations: getHypertensionRecommendations(level),
      description: 'Risk of developing high blood pressure based on current readings and trends'
    };
  };

  const calculateCardiovascularRisk = (vitals, bmi, heartRateTrend) => {
    let score = 0;
    let level = 'Low';
    let color = 'green';

    if (vitals.bloodPressure.systolic > 140) score += 20;
    if (vitals.bloodSugar > 126) score += 15;
    if (bmi > 30) score += 15;
    if (vitals.heartRate > 100) score += 10;
    if (heartRateTrend > 10) score += 10;

    if (score > 45) { level = 'High'; color = 'red'; }
    else if (score > 25) { level = 'Medium'; color = 'orange'; }

    return {
      score,
      level,
      color,
      recommendations: getCardiovascularRecommendations(level),
      description: 'Risk of heart disease based on multiple vital signs and trends'
    };
  };

  const calculateObesityRisk = (bmi, weightTrend) => {
    let score = 0;
    let level = 'Low';
    let color = 'green';

    if (bmi > 30) score += 50;
    else if (bmi > 25) score += 25;

    if (weightTrend > 2) score += 20;
    else if (weightTrend > 1) score += 10;

    if (score > 50) { level = 'High'; color = 'red'; }
    else if (score > 25) { level = 'Medium'; color = 'orange'; }

    return {
      score,
      level,
      color,
      recommendations: getObesityRecommendations(level),
      description: 'Risk of obesity-related health issues based on BMI and weight trends'
    };
  };

  // Recommendation functions
  const getDiabetesRecommendations = (level) => {
    const recommendations = {
      'Low': [
        'Maintain healthy diet with low sugar intake',
        'Regular physical activity (30 min daily)',
        'Monitor blood sugar monthly'
      ],
      'Medium': [
        'Reduce refined carbohydrates and sugar',
        'Increase fiber-rich foods in diet',
        'Exercise 45 minutes daily',
        'Check blood sugar bi-weekly'
      ],
      'High': [
        'Consult endocrinologist immediately',
        'Follow strict diabetic diet plan',
        'Daily blood sugar monitoring',
        'Medication review with doctor'
      ]
    };
    return recommendations[level] || recommendations['Low'];
  };

  const getHypertensionRecommendations = (level) => {
    const recommendations = {
      'Low': [
        'Maintain low sodium diet',
        'Regular cardiovascular exercise',
        'Monitor blood pressure monthly'
      ],
      'Medium': [
        'Reduce salt intake significantly',
        'Increase potassium-rich foods',
        'Stress management techniques',
        'Check blood pressure weekly'
      ],
      'High': [
        'Immediate medical consultation',
        'DASH diet implementation',
        'Daily blood pressure monitoring',
        'Antihypertensive medication review'
      ]
    };
    return recommendations[level] || recommendations['Low'];
  };

  const getCardiovascularRecommendations = (level) => {
    const recommendations = {
      'Low': [
        'Heart-healthy Mediterranean diet',
        'Regular aerobic exercise',
        'Annual cardiovascular checkup'
      ],
      'Medium': [
        'Omega-3 rich foods (fish, nuts)',
        'Moderate intensity exercise 5x/week',
        'Cholesterol screening',
        'Stress reduction activities'
      ],
      'High': [
        'Cardiologist consultation required',
        'Comprehensive cardiac evaluation',
        'Supervised exercise program',
        'Cholesterol and lipid management'
      ]
    };
    return recommendations[level] || recommendations['Low'];
  };

  const getObesityRecommendations = (level) => {
    const recommendations = {
      'Low': [
        'Balanced calorie-controlled diet',
        'Regular physical activity',
        'Monthly weight monitoring'
      ],
      'Medium': [
        'Structured weight loss program',
        'Portion control strategies',
        'Increased daily activity',
        'Weekly weight tracking'
      ],
      'High': [
        'Nutritionist consultation',
        'Medical weight management program',
        'Behavioral therapy consideration',
        'Daily activity and food logging'
      ]
    };
    return recommendations[level] || recommendations['Low'];
  };

  // Dynamic data fetching function
  const fetchPredictiveData = async (userId, days) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch predictive analytics data from API
      const response = await axios.get(
        `${API_BASE_URL}/api/predictive-analytics/${userId}?days=${days}`,
        { headers }
      );

      if (response.data.success) {
        const { trends, riskSummary: apiRiskSummary } = response.data;

        // Update state with fetched data
        setTrendsData(trends);
        setRiskSummary(apiRiskSummary || []);
        setHealthData(trends?.chartData || []);

        // Calculate predictions from API data
        const predictions = calculatePredictionsFromAPI(apiRiskSummary, trends);
        setPredictions(predictions);
      } else {
        throw new Error(response.data.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching predictive data:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load predictive analytics data');

      // Fallback to demo data if API fails
      const fallbackData = generateFallbackData();
      setHealthData(fallbackData);
      setPredictions(calculatePredictions(fallbackData));
      setRiskSummary(generateFallbackRiskSummary());
    } finally {
      setLoading(false);
    }
  };

  // Convert API risk summary to predictions format
  const calculatePredictionsFromAPI = (apiRiskSummary, trends) => {
    if (!apiRiskSummary || !Array.isArray(apiRiskSummary)) {
      return generateFallbackPredictions();
    }

    const riskMap = {};
    apiRiskSummary.forEach(item => {
      const riskLevel = item.risk === 'normal' ? 'Low' :
                       item.risk === 'moderate' ? 'Medium' : 'High';
      const score = item.risk === 'normal' ? 20 :
                    item.risk === 'moderate' ? 50 : 80;

      riskMap[item.vital] = {
        level: riskLevel,
        score,
        color: riskLevel === 'High' ? 'red' : riskLevel === 'Medium' ? 'orange' : 'green',
        recommendations: getRecommendationsForVital(item.vital, riskLevel),
        description: item.message || `Risk assessment for ${item.vital}`,
        trend: item.trend
      };
    });

    // Calculate overall score
    const totalScore = Object.values(riskMap).reduce((sum, risk) => sum + risk.score, 0);
    const overallScore = Math.round(totalScore / Object.keys(riskMap).length);

    return {
      diabetesRisk: riskMap.bloodSugar || generateDefaultRisk('bloodSugar'),
      hypertensionRisk: riskMap.bloodPressure || generateDefaultRisk('bloodPressure'),
      cardiovascularRisk: riskMap.heartRate || generateDefaultRisk('heartRate'),
      obesityRisk: riskMap.weight || generateDefaultRisk('weight'),
      overallScore
    };
  };

  // Generate fallback data when API fails
  const generateFallbackData = () => [
    { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), bloodSugar: 95, bloodPressure: { systolic: 120, diastolic: 80 }, weight: 70, heartRate: 72 },
    { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), bloodSugar: 98, bloodPressure: { systolic: 125, diastolic: 82 }, weight: 71, heartRate: 75 },
    { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), bloodSugar: 102, bloodPressure: { systolic: 130, diastolic: 85 }, weight: 72, heartRate: 78 },
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), bloodSugar: 108, bloodPressure: { systolic: 135, diastolic: 88 }, weight: 73, heartRate: 80 },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), bloodSugar: 115, bloodPressure: { systolic: 140, diastolic: 90 }, weight: 74, heartRate: 82 }
  ];

  const generateFallbackRiskSummary = () => [
    { vital: 'bloodSugar', trend: 'rising', risk: 'moderate', message: t('predictiveAnalytics.fallback.consultASHA') },
    { vital: 'bloodPressure', trend: 'stable', risk: 'normal', message: t('predictiveAnalytics.fallback.maintainLifestyle') }
  ];

  const generateFallbackPredictions = () => ({
    diabetesRisk: { level: 'Medium', score: 45, color: 'orange', recommendations: getDiabetesRecommendations('Medium'), description: 'Fallback diabetes risk assessment' },
    hypertensionRisk: { level: 'Low', score: 25, color: 'green', recommendations: getHypertensionRecommendations('Low'), description: 'Fallback hypertension risk assessment' },
    cardiovascularRisk: { level: 'Low', score: 30, color: 'green', recommendations: getCardiovascularRecommendations('Low'), description: 'Fallback cardiovascular risk assessment' },
    obesityRisk: { level: 'Low', score: 20, color: 'green', recommendations: getObesityRecommendations('Low'), description: 'Fallback obesity risk assessment' },
    overallScore: 30
  });

  const generateDefaultRisk = (vital) => ({
    level: 'Low',
    score: 25,
    color: 'green',
    recommendations: getRecommendationsForVital(vital, 'Low'),
    description: `Assessment for ${vital}`,
    trend: 'stable'
  });

  const getRecommendationsForVital = (vital, level) => {
    switch (vital) {
      case 'bloodSugar':
        return getDiabetesRecommendations(level);
      case 'bloodPressure':
        return getHypertensionRecommendations(level);
      case 'heartRate':
        return getCardiovascularRecommendations(level);
      case 'weight':
        return getObesityRecommendations(level);
      default:
        return ['Monitor regularly', 'Consult healthcare provider', 'Maintain healthy lifestyle'];
    }
  };

  // Initialize selected user and load data
  useEffect(() => {
    if (user && user._id && !selectedUserId) {
      setSelectedUserId(user._id);
    } else if (!selectedUserId) {
      // If no user is available, use demo user and show fallback data
      setSelectedUserId('demo-user');
      setLoading(false);
      const fallbackData = generateFallbackData();
      setHealthData(fallbackData);
      setPredictions(calculatePredictions(fallbackData));
      setRiskSummary(generateFallbackRiskSummary());
    }
  }, [user, selectedUserId]);

  // Load health data when user or timeframe changes
  useEffect(() => {
    if (selectedUserId && selectedUserId !== 'demo-user') {
      fetchPredictiveData(selectedUserId, timeframe);
    } else if (selectedUserId === 'demo-user') {
      // For demo user, just use fallback data
      setLoading(false);
      const fallbackData = generateFallbackData();
      setHealthData(fallbackData);
      setPredictions(calculatePredictions(fallbackData));
      setRiskSummary(generateFallbackRiskSummary());
    }
  }, [selectedUserId, timeframe]);

  // Risk level colors
  const getRiskColor = (level) => {
    switch (level) {
      case 'High': return 'bg-red-100 border-red-300 text-red-800';
      case 'Medium': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'Low': return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'High': return '⚠️';
      case 'Medium': return '⚡';
      case 'Low': return '✅';
      default: return '📊';
    }
  };

  // Loading component
  const LoadingState = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">{t('predictiveAnalytics.loading')}</p>
        <p className="text-sm text-gray-500 mt-2">
          {t('predictiveAnalytics.fetchingData')} {timeframe} {t('predictiveAnalytics.days')}...
        </p>
      </div>
    </div>
  );

  // Error component
  const ErrorState = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('predictiveAnalytics.error.title')}</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <div className="space-y-3">
          <button
            onClick={() => fetchPredictiveData(selectedUserId, timeframe)}
            className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('predictiveAnalytics.error.retry')}
          </button>
          <p className="text-sm text-gray-500">
            {t('predictiveAnalytics.error.fallbackNote')}
          </p>
        </div>
      </div>
    </div>
  );

  // Input Panel Component
  const InputPanel = () => (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🔮 {t('predictiveAnalytics.title')}</h1>
            <p className="text-gray-600 mt-2">{t('predictiveAnalytics.subtitle')}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* User Selection */}
            {availableUsers.length > 1 && (
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  {t('predictiveAnalytics.selectUser')}
                </label>
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
                  disabled={loading}
                >
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.isCurrentUser ? t('predictiveAnalytics.currentUser') : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Time Range Selection */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                {t('predictiveAnalytics.timeRange')}
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
                disabled={loading}
              >
                <option value={7}>{t('predictiveAnalytics.timeframe.7days')}</option>
                <option value={14}>{t('predictiveAnalytics.timeframe.14days')}</option>
                <option value={30}>{t('predictiveAnalytics.timeframe.30days')}</option>
              </select>
            </div>

            {/* Refresh Button */}
            <div className="flex flex-col justify-end">
              <button
                onClick={() => fetchPredictiveData(selectedUserId, timeframe)}
                disabled={loading || !selectedUserId}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? t('predictiveAnalytics.refreshing') : t('predictiveAnalytics.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${selectedUserId ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-gray-600">
              {selectedUserId ? t('predictiveAnalytics.userSelected') : t('predictiveAnalytics.noUserSelected')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${!loading ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-gray-600">
              {!loading ? t('predictiveAnalytics.dataLoaded') : t('predictiveAnalytics.loadingData')}
            </span>
          </div>
          {error && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-red-600">{t('predictiveAnalytics.apiError')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Dynamic VitalsTrendChart component
  const VitalsTrendChart = ({ data, vital, title }) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <p>{t('predictiveAnalytics.charts.noData')}</p>
        </div>
      );
    }

    const chartWidth = 600;
    const chartHeight = 200;
    const margin = { top: 20, right: 50, bottom: 40, left: 50 };
    const innerWidth = chartWidth - margin.left - margin.right;
    const innerHeight = chartHeight - margin.top - margin.bottom;

    // Prepare data points
    const dataPoints = data.map((item, index) => {
      let value;
      switch (vital) {
        case 'bloodSugar':
          value = item.bloodSugar || item.fasting || 0;
          break;
        case 'bloodPressure':
          value = item.bloodPressure?.systolic || item.systolic || 0;
          break;
        case 'heartRate':
          value = item.heartRate || 0;
          break;
        case 'weight':
          value = item.weight || 0;
          break;
        default:
          value = 0;
      }
      return { x: index, y: value, date: item.date || item.recordDate };
    }).filter(point => point.y > 0);

    if (dataPoints.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <p>{t('predictiveAnalytics.charts.noValidData')}</p>
        </div>
      );
    }

    // Calculate scales
    const maxValue = Math.max(...dataPoints.map(d => d.y));
    const minValue = Math.min(...dataPoints.map(d => d.y));
    const yRange = maxValue - minValue;
    const yScale = (value) => innerHeight - ((value - minValue) / (yRange || 1)) * innerHeight;
    const xScale = (index) => (index / (dataPoints.length - 1)) * innerWidth;

    // Create path
    const pathData = dataPoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.x)},${yScale(d.y)}`).join(' ');

    return (
      <div className="bg-white rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">{title}</h4>
        <div className="overflow-x-auto">
          <svg width={chartWidth} height={chartHeight} className="mx-auto">
            <defs>
              <linearGradient id={`gradient-${vital}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1"/>
              </linearGradient>
            </defs>

            <g transform={`translate(${margin.left},${margin.top})`}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                <line
                  key={ratio}
                  x1="0"
                  y1={innerHeight * ratio}
                  x2={innerWidth}
                  y2={innerHeight * ratio}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}

              {/* Area under curve */}
              <path
                d={`${pathData} L ${xScale(dataPoints[dataPoints.length - 1].x)},${innerHeight} L ${xScale(dataPoints[0].x)},${innerHeight} Z`}
                fill={`url(#gradient-${vital})`}
              />

              {/* Main line */}
              <path
                d={pathData}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {dataPoints.map((d, i) => (
                <circle
                  key={i}
                  cx={xScale(d.x)}
                  cy={yScale(d.y)}
                  r="4"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                  className="hover:r-6 transition-all cursor-pointer"
                  title={`${d.y} on ${new Date(d.date).toLocaleDateString()}`}
                />
              ))}

              {/* Y-axis labels */}
              {[minValue, (minValue + maxValue) / 2, maxValue].map(value => (
                <text
                  key={value}
                  x="-10"
                  y={yScale(value) + 5}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6b7280"
                >
                  {Math.round(value)}
                </text>
              ))}

              {/* X-axis labels */}
              {dataPoints.map((d, i) => (
                i % Math.ceil(dataPoints.length / 4) === 0 && (
                  <text
                    key={i}
                    x={xScale(d.x)}
                    y={innerHeight + 20}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#6b7280"
                  >
                    {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                )
              ))}
            </g>
          </svg>
        </div>
      </div>
    );
  };

  if (authLoading) {
    return <LoadingState />;
  }

  if (loading && !predictions) {
    return <LoadingState />;
  }

  if (error && !predictions) {
    return <ErrorState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Dynamic Input Panel */}
      <InputPanel />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overall Health Score */}
        {predictions && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('predictiveAnalytics.overallScore.title')}</h2>
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
                <div
                  className={`absolute inset-0 rounded-full border-8 ${
                    predictions.overallScore > 60 ? 'border-red-500' :
                    predictions.overallScore > 30 ? 'border-orange-500' : 'border-green-500'
                  }`}
                  style={{
                    background: `conic-gradient(${
                      predictions.overallScore > 60 ? '#ef4444' :
                      predictions.overallScore > 30 ? '#f97316' : '#22c55e'
                    } ${predictions.overallScore * 3.6}deg, transparent 0deg)`
                  }}
                ></div>
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{predictions.overallScore}</span>
                </div>
              </div>
              <p className={`text-lg font-semibold ${
                predictions.overallScore > 60 ? 'text-red-600' :
                predictions.overallScore > 30 ? 'text-orange-600' : 'text-green-600'
              }`}>
                {predictions.overallScore > 60 ? t('predictiveAnalytics.overallScore.highRisk') :
                 predictions.overallScore > 30 ? t('predictiveAnalytics.overallScore.mediumRisk') : t('predictiveAnalytics.overallScore.lowRisk')}
              </p>
              <p className="text-gray-600 mt-2">{t('predictiveAnalytics.overallScore.description')}</p>
            </div>
          </div>
        )}

        {/* Risk Categories Grid */}
        {predictions && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Diabetes Risk */}
            <div
              className={`bg-white rounded-2xl shadow-lg p-6 border-2 cursor-pointer transition-all hover:shadow-xl ${
                selectedRisk === 'diabetes' ? 'ring-4 ring-blue-300' : ''
              } ${getRiskColor(predictions.diabetesRisk.level)}`}
              onClick={() => setSelectedRisk(selectedRisk === 'diabetes' ? null : 'diabetes')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">🍬 {t('predictiveAnalytics.riskCategories.diabetes.title')}</h3>
                <span className="text-2xl">{getRiskIcon(predictions.diabetesRisk.level)}</span>
              </div>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{t(`predictiveAnalytics.riskLevels.${predictions.diabetesRisk.level.toLowerCase()}`)} Risk</span>
                  <span className="text-sm font-bold">{predictions.diabetesRisk.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      predictions.diabetesRisk.level === 'High' ? 'bg-red-500' :
                      predictions.diabetesRisk.level === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${predictions.diabetesRisk.score}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">{t('predictiveAnalytics.riskCategories.diabetes.description')}</p>
            </div>

            {/* Hypertension Risk */}
            <div
              className={`bg-white rounded-2xl shadow-lg p-6 border-2 cursor-pointer transition-all hover:shadow-xl ${
                selectedRisk === 'hypertension' ? 'ring-4 ring-blue-300' : ''
              } ${getRiskColor(predictions.hypertensionRisk.level)}`}
              onClick={() => setSelectedRisk(selectedRisk === 'hypertension' ? null : 'hypertension')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">💓 {t('predictiveAnalytics.riskCategories.hypertension.title')}</h3>
                <span className="text-2xl">{getRiskIcon(predictions.hypertensionRisk.level)}</span>
              </div>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{t(`predictiveAnalytics.riskLevels.${predictions.hypertensionRisk.level.toLowerCase()}`)} Risk</span>
                  <span className="text-sm font-bold">{predictions.hypertensionRisk.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      predictions.hypertensionRisk.level === 'High' ? 'bg-red-500' :
                      predictions.hypertensionRisk.level === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${predictions.hypertensionRisk.score}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">{t('predictiveAnalytics.riskCategories.hypertension.description')}</p>
            </div>

            {/* Cardiovascular Risk */}
            <div
              className={`bg-white rounded-2xl shadow-lg p-6 border-2 cursor-pointer transition-all hover:shadow-xl ${
                selectedRisk === 'cardiovascular' ? 'ring-4 ring-blue-300' : ''
              } ${getRiskColor(predictions.cardiovascularRisk.level)}`}
              onClick={() => setSelectedRisk(selectedRisk === 'cardiovascular' ? null : 'cardiovascular')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">❤️ {t('predictiveAnalytics.riskCategories.cardiovascular.title')}</h3>
                <span className="text-2xl">{getRiskIcon(predictions.cardiovascularRisk.level)}</span>
              </div>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{t(`predictiveAnalytics.riskLevels.${predictions.cardiovascularRisk.level.toLowerCase()}`)} Risk</span>
                  <span className="text-sm font-bold">{predictions.cardiovascularRisk.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      predictions.cardiovascularRisk.level === 'High' ? 'bg-red-500' :
                      predictions.cardiovascularRisk.level === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${predictions.cardiovascularRisk.score}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">{t('predictiveAnalytics.riskCategories.cardiovascular.description')}</p>
            </div>

            {/* Obesity Risk */}
            <div
              className={`bg-white rounded-2xl shadow-lg p-6 border-2 cursor-pointer transition-all hover:shadow-xl ${
                selectedRisk === 'obesity' ? 'ring-4 ring-blue-300' : ''
              } ${getRiskColor(predictions.obesityRisk.level)}`}
              onClick={() => setSelectedRisk(selectedRisk === 'obesity' ? null : 'obesity')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">⚖️ {t('predictiveAnalytics.riskCategories.obesity.title')}</h3>
                <span className="text-2xl">{getRiskIcon(predictions.obesityRisk.level)}</span>
              </div>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{t(`predictiveAnalytics.riskLevels.${predictions.obesityRisk.level.toLowerCase()}`)} Risk</span>
                  <span className="text-sm font-bold">{predictions.obesityRisk.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      predictions.obesityRisk.level === 'High' ? 'bg-red-500' :
                      predictions.obesityRisk.level === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${predictions.obesityRisk.score}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">{t('predictiveAnalytics.riskCategories.obesity.description')}</p>
            </div>
          </div>
        )}

        {/* Detailed Recommendations */}
        {selectedRisk && predictions && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              📋 {t('predictiveAnalytics.recommendations.title')} {
                selectedRisk === 'diabetes' ? t('predictiveAnalytics.recommendations.diabetesPrevention') :
                selectedRisk === 'hypertension' ? t('predictiveAnalytics.recommendations.bloodPressureManagement') :
                selectedRisk === 'cardiovascular' ? t('predictiveAnalytics.recommendations.heartHealth') :
                t('predictiveAnalytics.recommendations.weightManagement')
              }
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(selectedRisk === 'diabetes' ? predictions.diabetesRisk.recommendations :
                selectedRisk === 'hypertension' ? predictions.hypertensionRisk.recommendations :
                selectedRisk === 'cardiovascular' ? predictions.cardiovascularRisk.recommendations :
                predictions.obesityRisk.recommendations
              ).map((recommendation, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-gray-800 leading-relaxed">{recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health Trends Visualization */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">📈 {t('predictiveAnalytics.healthTrends.title')}</h3>
          {healthData && healthData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Blood Sugar Trend Chart */}
              <VitalsTrendChart
                data={healthData}
                vital="bloodSugar"
                title={`🍬 ${t('predictiveAnalytics.healthTrends.bloodSugarLevels')}`}
              />

              {/* Blood Pressure Trend Chart */}
              <VitalsTrendChart
                data={healthData}
                vital="bloodPressure"
                title={`💓 ${t('predictiveAnalytics.healthTrends.bloodPressure')}`}
              />

              {/* Heart Rate Trend Chart */}
              <VitalsTrendChart
                data={healthData}
                vital="heartRate"
                title={`❤️ ${t('dashboard.vitals.heartRate')}`}
              />

              {/* Weight Trend Chart */}
              <VitalsTrendChart
                data={healthData}
                vital="weight"
                title={`⚖️ ${t('dashboard.vitals.weight')}`}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-lg">{t('predictiveAnalytics.charts.noDataAvailable')}</p>
                <p className="text-sm mt-2">{t('predictiveAnalytics.charts.addDataToSeeCharts')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Items */}
        <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl shadow-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-6">🎯 {t('predictiveAnalytics.actionItems.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-20 rounded-xl p-6">
              <h4 className="text-lg font-bold mb-3">📅 {t('predictiveAnalytics.actionItems.scheduleCheckup.title')}</h4>
              <p className="text-sm opacity-90">{t('predictiveAnalytics.actionItems.scheduleCheckup.description')}</p>
              <button className="mt-4 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                {t('predictiveAnalytics.actionItems.scheduleCheckup.button')}
              </button>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-6">
              <h4 className="text-lg font-bold mb-3">📱 {t('predictiveAnalytics.actionItems.trackDaily.title')}</h4>
              <p className="text-sm opacity-90">{t('predictiveAnalytics.actionItems.trackDaily.description')}</p>
              <button className="mt-4 bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                {t('predictiveAnalytics.actionItems.trackDaily.button')}
              </button>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-6">
              <h4 className="text-lg font-bold mb-3">🔄 {t('predictiveAnalytics.actionItems.reviewMonthly.title')}</h4>
              <p className="text-sm opacity-90">{t('predictiveAnalytics.actionItems.reviewMonthly.description')}</p>
              <button className="mt-4 bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                {t('predictiveAnalytics.actionItems.reviewMonthly.button')}
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mt-8">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="text-lg font-semibold text-yellow-800 mb-2">{t('predictiveAnalytics.disclaimer.title')}</h4>
              <p className="text-yellow-700 text-sm leading-relaxed">
                {t('predictiveAnalytics.disclaimer.text')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveHealthAnalytics;
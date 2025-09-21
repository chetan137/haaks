import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const UserProfile = () => {
  const { user, updateUserProfile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    phoneNumber: '',
    gender: '',
    age: '',
    dateOfBirth: '',
    weight: '',
    height: '',
    existingConditions: [],
    familyHistory: [],
    allergies: '',
    medications: [],
    dietType: '',
    smokingStatus: '',
    alcoholConsumption: '',
    physicalActivity: '',
    location: {
      state: '',
      district: '',
      village: '',
      pinCode: ''
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    preferredAshaLanguage: 'en'
  });

  // Indian states for dropdown
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  // Load user data on component mount
  useEffect(() => {
    if (user) {
      setFormData({
        phoneNumber: user.phoneNumber || '',
        gender: user.gender || '',
        age: user.age || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        weight: user.weight || '',
        height: user.height || '',
        existingConditions: user.existingConditions || [],
        familyHistory: user.familyHistory || [],
        allergies: user.allergies || '',
        medications: user.medications || [],
        dietType: user.dietType || '',
        smokingStatus: user.smokingStatus || '',
        alcoholConsumption: user.alcoholConsumption || '',
        physicalActivity: user.physicalActivity || '',
        location: {
          state: user.location?.state || '',
          district: user.location?.district || '',
          village: user.location?.village || '',
          pinCode: user.location?.pinCode || ''
        },
        emergencyContact: {
          name: user.emergencyContact?.name || '',
          phone: user.emergencyContact?.phone || '',
          relationship: user.emergencyContact?.relationship || ''
        },
        preferredAshaLanguage: user.preferredAshaLanguage || 'en'
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => {
      const currentArray = prev[field] || [];
      const updatedArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];

      return {
        ...prev,
        [field]: updatedArray
      };
    });
  };

  const handleMedicationChange = (index, value) => {
    setFormData(prev => {
      const updatedMedications = [...(prev.medications || [])];
      if (value === '') {
        updatedMedications.splice(index, 1);
      } else {
        updatedMedications[index] = value;
      }
      return {
        ...prev,
        medications: updatedMedications
      };
    });
  };

  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [...(prev.medications || []), '']
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');

    try {
      await updateUserProfile(formData);
      setSuccessMessage(t('profile.messages.profileUpdated'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const profileCompletion = user?.profileCompletion || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-emerald-300 rounded-md shadow-sm text-sm font-medium text-emerald-700 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg border border-emerald-100 mb-6">
          <div className="px-6 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-500 to-teal-600">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">{t('profile.title')}</h1>
                <p className="text-emerald-100 mt-1">{t('profile.subtitle')}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2">
                <LanguageSwitcher />
              </div>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="px-6 py-4 bg-emerald-50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-emerald-800">{t('profile.completion')}</span>
              <span className="text-sm font-bold text-emerald-600">{profileCompletion}%</span>
            </div>
            <div className="w-full bg-emerald-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${profileCompletion}%` }}
              ></div>
            </div>
            {profileCompletion < 90 && (
              <p className="text-xs text-emerald-700 mt-2 flex items-center">
                <svg className="h-3 w-3 mr-1 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {t('profile.messages.profileIncomplete', { percentage: profileCompletion })}
              </p>
            )}
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="text-emerald-800 font-medium">{successMessage}</div>
            </div>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-lg border border-emerald-100">
            <div className="px-6 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-500 to-teal-600">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                {t('profile.sections.contact')}
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.phoneNumber')}
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder={t('profile.placeholders.phoneNumber')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{t('profile.sections.personal')}</h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.gender')}
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">{t('profile.fields.gender')}</option>
                    <option value="male">{t('profile.options.gender.male')}</option>
                    <option value="female">{t('profile.options.gender.female')}</option>
                    <option value="other">{t('profile.options.gender.other')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.age')}
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder={t('profile.placeholders.age')}
                    min="0"
                    max="150"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.dateOfBirth')}
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.weight')}
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    placeholder={t('profile.placeholders.weight')}
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.height')}
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    placeholder={t('profile.placeholders.height')}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Health Conditions */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{t('profile.sections.health')}</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.fields.existingConditions')}
                </label>
                <div className="space-y-2">
                  {['diabetes', 'hypertension', 'none', 'others'].map(condition => (
                    <label key={condition} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.existingConditions.includes(condition)}
                        onChange={() => handleCheckboxChange('existingConditions', condition)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {t(`profile.options.existingConditions.${condition}`)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.fields.familyHistory')}
                </label>
                <div className="space-y-2">
                  {['diabetes', 'hypertension', 'heart_disease'].map(condition => (
                    <label key={condition} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.familyHistory.includes(condition)}
                        onChange={() => handleCheckboxChange('familyHistory', condition)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {t(`profile.options.familyHistory.${condition}`)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('profile.fields.allergies')}
                </label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  placeholder={t('profile.placeholders.allergies')}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.fields.medications')}
                </label>
                <div className="space-y-2">
                  {formData.medications.map((medication, index) => (
                    <input
                      key={index}
                      type="text"
                      value={medication}
                      onChange={(e) => handleMedicationChange(index, e.target.value)}
                      placeholder={t('profile.placeholders.medications')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={addMedication}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    + Add Medication
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lifestyle */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{t('profile.sections.lifestyle')}</h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.dietType')}
                  </label>
                  <select
                    name="dietType"
                    value={formData.dietType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">{t('profile.fields.dietType')}</option>
                    <option value="vegetarian">{t('profile.options.dietType.vegetarian')}</option>
                    <option value="non_vegetarian">{t('profile.options.dietType.non_vegetarian')}</option>
                    <option value="vegan">{t('profile.options.dietType.vegan')}</option>
                    <option value="other">{t('profile.options.dietType.other')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.smokingStatus')}
                  </label>
                  <select
                    name="smokingStatus"
                    value={formData.smokingStatus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">{t('profile.fields.smokingStatus')}</option>
                    <option value="yes">{t('profile.options.smokingStatus.yes')}</option>
                    <option value="no">{t('profile.options.smokingStatus.no')}</option>
                    <option value="occasionally">{t('profile.options.smokingStatus.occasionally')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.alcoholConsumption')}
                  </label>
                  <select
                    name="alcoholConsumption"
                    value={formData.alcoholConsumption}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">{t('profile.fields.alcoholConsumption')}</option>
                    <option value="yes">{t('profile.options.alcoholConsumption.yes')}</option>
                    <option value="no">{t('profile.options.alcoholConsumption.no')}</option>
                    <option value="occasionally">{t('profile.options.alcoholConsumption.occasionally')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.physicalActivity')}
                  </label>
                  <select
                    name="physicalActivity"
                    value={formData.physicalActivity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">{t('profile.fields.physicalActivity')}</option>
                    <option value="sedentary">{t('profile.options.physicalActivity.sedentary')}</option>
                    <option value="moderate">{t('profile.options.physicalActivity.moderate')}</option>
                    <option value="active">{t('profile.options.physicalActivity.active')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{t('profile.sections.location')}</h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.state')}
                  </label>
                  <select
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">{t('profile.placeholders.state')}</option>
                    {indianStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.district')}
                  </label>
                  <input
                    type="text"
                    name="location.district"
                    value={formData.location.district}
                    onChange={handleInputChange}
                    placeholder={t('profile.placeholders.district')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.village')}
                  </label>
                  <input
                    type="text"
                    name="location.village"
                    value={formData.location.village}
                    onChange={handleInputChange}
                    placeholder={t('profile.placeholders.village')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.pinCode')}
                  </label>
                  <input
                    type="text"
                    name="location.pinCode"
                    value={formData.location.pinCode}
                    onChange={handleInputChange}
                    placeholder={t('profile.placeholders.pinCode')}
                    pattern="[0-9]{6}"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{t('profile.sections.emergency')}</h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.emergencyContactName')}
                  </label>
                  <input
                    type="text"
                    name="emergencyContact.name"
                    value={formData.emergencyContact.name}
                    onChange={handleInputChange}
                    placeholder={t('profile.placeholders.emergencyContactName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.emergencyContactPhone')}
                  </label>
                  <input
                    type="tel"
                    name="emergencyContact.phone"
                    value={formData.emergencyContact.phone}
                    onChange={handleInputChange}
                    placeholder={t('profile.placeholders.emergencyContactPhone')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.emergencyContactRelationship')}
                  </label>
                  <select
                    name="emergencyContact.relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">{t('profile.fields.emergencyContactRelationship')}</option>
                    <option value="father">{t('profile.options.relationship.father')}</option>
                    <option value="mother">{t('profile.options.relationship.mother')}</option>
                    <option value="spouse">{t('profile.options.relationship.spouse')}</option>
                    <option value="friend">{t('profile.options.relationship.friend')}</option>
                    <option value="other">{t('profile.options.relationship.other')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{t('profile.sections.preferences')}</h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.preferredAshaLanguage')}
                  </label>
                  <select
                    name="preferredAshaLanguage"
                    value={formData.preferredAshaLanguage}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी</option>
                    <option value="mr">मराठी</option>
                    <option value="bn">বাংলা</option>
                    <option value="te">తెలుగు</option>
                    <option value="ta">தமிழ்</option>
                    <option value="gu">ગુજરાતી</option>
                    <option value="kn">ಕನ್ನಡ</option>
                    <option value="ml">മലയാളം</option>
                    <option value="pa">ਪੰਜਾਬੀ</option>
                    <option value="or">ଓଡ଼ିଆ</option>
                    <option value="as">অসমীয়া</option>
                    <option value="ur">اردو</option>
                    <option value="sa">संस्कृतम्</option>
                    <option value="ne">नेपाली</option>
                    <option value="si">සිංහල</option>
                    <option value="my">မြန်မာ</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4">
              <div className="flex justify-end space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 rounded-md font-medium ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-600'
                  } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400`}
                >
                  {loading ? t('common.loading') : t('profile.buttons.updateProfile')}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
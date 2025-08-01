'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BehaviourQuestionnaire } from '@/types';

function BehaviourQuestionnaireForm() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Owner Information
    ownerFirstName: '',
    ownerLastName: '',
    email: '',
    contactNumber: '',
    address1: '',
    address2: '',
    city: '',
    stateProvince: '',
    zipPostalCode: '',
    country: '',
    howDidYouHear: '',
    // Dog Information
    dogName: '',
    age: '',
    sex: '' as 'Male' | 'Female' | '',
    breed: '',
    neuteredSpayed: '',
    mainHelp: '',
    firstNoticed: '',
    whenWhereHow: '',
    recentChange: '',
    canAnticipate: '',
    whyThinking: '',
    whatDoneSoFar: '',
    idealGoal: '',
    anythingElse: '',
    // Health and Veterinary
    medicalHistory: '',
    vetAdvice: '',
    // Background
    whereGotDog: '',
    rescueBackground: '',
    ageWhenGot: '',
    // Diet and Feeding
    whatFeed: '',
    foodMotivated: 5,
    mealtime: '',
    treatRoutine: '',
    happyWithTreats: '',
    // Routines
    typesOfPlay: '',
    affectionate: '',
    exercise: '',
    useMuzzle: '',
    familiarPeople: '',
    unfamiliarPeople: '',
    housetrained: '',
    likesToDo: '',
    // Temperament
    likeAboutDog: '',
    mostChallenging: '',
    // Training
    howGood: '',
    favouriteRewards: '',
    howBad: '',
    effectOfBad: '',
    professionalTraining: '',
    // Sociability
    sociabilityDogs: '' as BehaviourQuestionnaire['sociabilityDogs'] | '',
    sociabilityPeople: '' as BehaviourQuestionnaire['sociabilityPeople'] | '',
    anythingElseToKnow: '',
    timePerWeek: '',
  });



  // Check for email parameter in URL and prefill, also check if already completed
  useEffect(() => {
    const checkExistingQuestionnaire = async () => {
      const emailParam = searchParams.get('email');
      if (emailParam) {
        setFormData(prev => ({
          ...prev,
          email: emailParam
        }));

        try {
          // Check if this email already has a questionnaire submitted
          // For now, skip this check to avoid RLS issues during initial load
          // The API will handle duplicate prevention
        } catch (error) {
          console.error('Error checking existing questionnaire:', error);
          // Continue with form display even if check fails
        }
      }
    };

    checkExistingQuestionnaire();
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };



  const handleRadioChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit to API endpoint that handles RLS properly
      const response = await fetch('/api/behaviour-questionnaire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit questionnaire');
      }

      // Send email notification
      try {
        await fetch('/api/send-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'behaviour_questionnaire',
            data: formData
          })
        });
        console.log('Email notification sent for behaviour questionnaire');
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the form submission if email fails
      }

      // Redirect directly to completion page
      window.location.href = '/questionnaire-completed';
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      alert('There was an error submitting your questionnaire. Please try again.');
      setIsSubmitting(false); // Re-enable button on error
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#4f6749' }}>
      <div className="flex-1 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white">Behaviour Questionnaire</h1>
          </div>

          <div className="rounded-lg p-6" style={{ backgroundColor: '#ebeadf' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Owner Information Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Owner Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Name <span className="text-gray-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">First Name</label>
                        <input
                          type="text"
                          name="ownerFirstName"
                          value={formData.ownerFirstName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                          style={{ backgroundColor: '#ebeadf' }}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Last Name</label>
                        <input
                          type="text"
                          name="ownerLastName"
                          value={formData.ownerLastName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                          style={{ backgroundColor: '#ebeadf' }}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {!searchParams.get('email') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-gray-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                        style={{ backgroundColor: '#ebeadf' }}
                        required
                      />
                    </div>
                  )}

                  {/* Hidden email field when prefilled */}
                  {searchParams.get('email') && (
                    <input type="hidden" name="email" value={formData.email} />
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number <span className="text-gray-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address <span className="text-gray-500">*</span>
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Address 1</label>
                        <input
                          type="text"
                          name="address1"
                          value={formData.address1}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                          style={{ backgroundColor: '#ebeadf' }}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Address 2</label>
                        <input
                          type="text"
                          name="address2"
                          value={formData.address2}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                          style={{ backgroundColor: '#ebeadf' }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">City</label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                            style={{ backgroundColor: '#ebeadf' }}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">State/Province</label>
                          <input
                            type="text"
                            name="stateProvince"
                            value={formData.stateProvince}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                            style={{ backgroundColor: '#ebeadf' }}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Zip/Postal Code</label>
                          <input
                            type="text"
                            name="zipPostalCode"
                            value={formData.zipPostalCode}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                            style={{ backgroundColor: '#ebeadf' }}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Country</label>
                          <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                            style={{ backgroundColor: '#ebeadf' }}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How did you hear about my services?
                    </label>
                    <input
                      type="text"
                      name="howDidYouHear"
                      value={formData.howDidYouHear}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>
                </div>
              </div>

              {/* Dog Information Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2 pb-2 border-b border-gray-200">
                  Dog Information
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  If you are inquiring about more than one dog please complete an additional form.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dog Name <span className="text-gray-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="dogName"
                      value={formData.dogName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age <span className="text-gray-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sex <span className="text-gray-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sex"
                          value="Male"
                          checked={formData.sex === 'Male'}
                          onChange={() => handleRadioChange('sex', 'Male')}
                          className="mr-2 h-4 w-4 text-amber-600 focus:ring-black border-gray-300"
                        />
                        <span className="text-sm text-gray-700">Male</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sex"
                          value="Female"
                          checked={formData.sex === 'Female'}
                          onChange={() => handleRadioChange('sex', 'Female')}
                          className="mr-2 h-4 w-4 text-amber-600 focus:ring-black border-gray-300"
                        />
                        <span className="text-sm text-gray-700">Female</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What breed is your dog? <span className="text-gray-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="breed"
                      value={formData.breed}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Neutered/Spayed? At what age? <span className="text-gray-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="neuteredSpayed"
                      value={formData.neuteredSpayed}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What is the main thing you would like help with?
                    </label>
                    <textarea
                      name="mainHelp"
                      value={formData.mainHelp}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      When did you first notice tendencies of this behaviour?
                    </label>
                    <textarea
                      name="firstNoticed"
                      value={formData.firstNoticed}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      When, where and how often does it happen? Be specific
                    </label>
                    <textarea
                      name="whenWhereHow"
                      value={formData.whenWhereHow}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Has there been a recent change in the behaviour?
                    </label>
                    <p className="text-xs text-gray-600 mb-2">More frequent? More intense? Different circumstances?</p>
                    <textarea
                      name="recentChange"
                      value={formData.recentChange}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Can you anticipate when it is likely to happen?
                    </label>
                    <p className="text-xs text-gray-600 mb-2">Location, who is present, trigger, etc.</p>
                    <textarea
                      name="canAnticipate"
                      value={formData.canAnticipate}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Why do you think your dog is doing this?
                    </label>
                    <textarea
                      name="whyThinking"
                      value={formData.whyThinking}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What have you done so far to address this problem? With what effect?
                    </label>
                    <textarea
                      name="whatDoneSoFar"
                      value={formData.whatDoneSoFar}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What would you consider your ideal goal/outcome of a training program?
                    </label>
                    <textarea
                      name="idealGoal"
                      value={formData.idealGoal}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Is there anything else you would like help with if possible?
                    </label>
                    <textarea
                      name="anythingElse"
                      value={formData.anythingElse}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>
                </div>
              </div>

              {/* Health and Veterinary Information Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Health & Veterinary Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Does your dog have any past relevant medical or health conditions or important medical history? If yes, please describe.
                    </label>
                    <p className="text-xs text-gray-600 mb-2">Allergies, medication, injury etc.</p>
                    <textarea
                      name="medicalHistory"
                      value={formData.medicalHistory}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Have you specifically asked your Veterinarian about any of your dog's training and behaviour concerns? If yes, what was their advice?
                    </label>
                    <textarea
                      name="vetAdvice"
                      value={formData.vetAdvice}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>
                </div>
              </div>

              {/* Background Information Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Background Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Where did you get your dog from?
                    </label>
                    <p className="text-xs text-gray-600 mb-2">E.g. breeder, rescue centre, ex-street dog</p>
                    <input
                      type="text"
                      name="whereGotDog"
                      value={formData.whereGotDog}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      If your dog was a rescue, what do you know about their background?
                    </label>
                    <textarea
                      name="rescueBackground"
                      value={formData.rescueBackground}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How old was your dog when you got him/her?
                    </label>
                    <input
                      type="text"
                      name="ageWhenGot"
                      value={formData.ageWhenGot}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>
                </div>
              </div>

              {/* Diet and Feeding Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Diet and Feeding
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What do you feed your dog? Please be specific
                    </label>
                    <p className="text-xs text-gray-600 mb-2">Brand, variety, canned, dried, raw, home cooked, etc.</p>
                    <textarea
                      name="whatFeed"
                      value={formData.whatFeed}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How food motivated is your dog?
                    </label>
                    <p className="text-xs text-gray-600 mb-2">1 - 10 (10 being highly food motivated)</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <label key={num} className="flex items-center">
                          <input
                            type="radio"
                            name="foodMotivated"
                            value={num}
                            checked={formData.foodMotivated === num}
                            onChange={() => setFormData(prev => ({ ...prev, foodMotivated: num }))}
                            className="mr-1 h-4 w-4 text-amber-600 focus:ring-black border-gray-300"
                          />
                          <span className="text-sm text-gray-700">{num}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Please describe your dog's mealtime.
                    </label>
                    <p className="text-xs text-gray-600 mb-2">Where, when, how often, who feeds, special routine, etc.</p>
                    <textarea
                      name="mealtime"
                      value={formData.mealtime}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Please describe any treat routine your dog has.
                    </label>
                    <p className="text-xs text-gray-600 mb-2">Who, what kind of treat, etc.</p>
                    <textarea
                      name="treatRoutine"
                      value={formData.treatRoutine}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      If applicable, are you happy for me to give your dog treats I bring along? If no, please have some to hand that you are happy for me to use.
                    </label>
                    <textarea
                      name="happyWithTreats"
                      value={formData.happyWithTreats}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>
                </div>
              </div>

              {/* Routines Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Routines
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What types of play do you engage in with your dog? Do they enjoy it?
                    </label>
                    <textarea
                      name="typesOfPlay"
                      value={formData.typesOfPlay}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Are you affectionate with your dog? Do they enjoy it?
                    </label>
                    <textarea
                      name="affectionate"
                      value={formData.affectionate}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What types of exercise does your dog regularly get?
                    </label>
                    <textarea
                      name="exercise"
                      value={formData.exercise}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Does your dog use a muzzle for any reason?
                    </label>
                    <textarea
                      name="useMuzzle"
                      value={formData.useMuzzle}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How does your dog react when familiar people come to your home? Please describe.
                    </label>
                    <p className="text-xs text-gray-600 mb-2">Bark, jump, mouth, calm, etc.</p>
                    <textarea
                      name="familiarPeople"
                      value={formData.familiarPeople}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How does your dog react when unfamiliar people come to your home? Please describe.
                    </label>
                    <p className="text-xs text-gray-600 mb-2">Bark, jump, mouth, calm, etc.</p>
                    <textarea
                      name="unfamiliarPeople"
                      value={formData.unfamiliarPeople}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Is your dog fully housetrained?
                    </label>
                    <textarea
                      name="housetrained"
                      value={formData.housetrained}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What does your dog like to do aside from walks?
                    </label>
                    <p className="text-xs text-gray-600 mb-2">Enrichment, games, jobs, etc.</p>
                    <textarea
                      name="likesToDo"
                      value={formData.likesToDo}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>
                </div>
              </div>

              {/* Temperament Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Temperament
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What do you like about your dog?
                    </label>
                    <textarea
                      name="likeAboutDog"
                      value={formData.likeAboutDog}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What do you find most challenging about your dog?
                    </label>
                    <textarea
                      name="mostChallenging"
                      value={formData.mostChallenging}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>
                </div>
              </div>

              {/* Training Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Training
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How do you let your dog know when they have done something "good"?
                    </label>
                    <textarea
                      name="howGood"
                      value={formData.howGood}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What are your dog's favourite rewards?
                    </label>
                    <textarea
                      name="favouriteRewards"
                      value={formData.favouriteRewards}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Do you let your dog know when they have done something "bad"? How?
                    </label>
                    <textarea
                      name="howBad"
                      value={formData.howBad}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What effect does your method of telling them they've done something bad have?
                    </label>
                    <p className="text-xs text-gray-600 mb-2">ie: no change, stopped behaviour, got worse, only worked with certain person, etc.</p>
                    <textarea
                      name="effectOfBad"
                      value={formData.effectOfBad}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Has your dog participated in any professional training before? If yes, please describe.
                    </label>
                    <p className="text-xs text-gray-600 mb-2">What type of methods were used? How was your experience and the results?</p>
                    <textarea
                      name="professionalTraining"
                      value={formData.professionalTraining}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>
                </div>
              </div>

              {/* Sociability Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Sociability
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      How would you describe your dog's sociability with other dogs in general?
                    </label>
                    <p className="text-xs text-gray-600 mb-2">Interactions with Dogs</p>
                    <div className="space-y-2">
                      {['Sociable', 'Nervous', 'Reactive', 'Disinterested'].map((option) => (
                        <label key={option} className="flex items-center">
                          <input
                            type="radio"
                            name="sociabilityDogs"
                            value={option}
                            checked={formData.sociabilityDogs === option}
                            onChange={() => handleRadioChange('sociabilityDogs', option)}
                            className="mr-2 h-4 w-4 text-amber-600 focus:ring-black border-gray-300"
                          />
                          <span className="text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      How would you describe your dog's sociability with other people in general?
                    </label>
                    <p className="text-xs text-gray-600 mb-2">Interactions with People</p>
                    <div className="space-y-2">
                      {['Sociable', 'Nervous', 'Reactive', 'Disinterested'].map((option) => (
                        <label key={option} className="flex items-center">
                          <input
                            type="radio"
                            name="sociabilityPeople"
                            value={option}
                            checked={formData.sociabilityPeople === option}
                            onChange={() => handleRadioChange('sociabilityPeople', option)}
                            className="mr-2 h-4 w-4 text-amber-600 focus:ring-black border-gray-300"
                          />
                          <span className="text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Is there anything else that you would like me to know about your situation or your dog?
                    </label>
                    <textarea
                      name="anythingElseToKnow"
                      value={formData.anythingElseToKnow}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How much time per week total are you able to dedicate to training?
                    </label>
                    <input
                      type="text"
                      name="timePerWeek"
                      value={formData.timePerWeek}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black form-input"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-white font-medium py-3 px-6 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: isSubmitting ? '#6b7c63' : '#4f6749' }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = '#3d5237';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = '#4f6749';
                    }
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>


    </div>
  );
}

export default function BehaviourQuestionnairePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#4f6749' }}>
      <div className="text-white">Loading...</div>
    </div>}>
      <BehaviourQuestionnaireForm />
    </Suspense>
  );
}

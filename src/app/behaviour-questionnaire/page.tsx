'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { BehaviourQuestionnaire } from '@/types';
import { behaviourQuestionnaireService } from '@/services/behaviourQuestionnaireService';

function BehaviourQuestionnaireForm() {
  const { dispatch, createClient, updateClient, findClientByEmail, state } = useApp();
  const searchParams = useSearchParams();
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
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setFormData(prev => ({
        ...prev,
        email: emailParam
      }));

      // Check if this email already has a questionnaire submitted
      const existingQuestionnaire = state.behaviourQuestionnaires.find(q =>
        q.email?.toLowerCase() === emailParam.toLowerCase()
      );

      if (existingQuestionnaire) {
        // Redirect to completion page
        window.location.href = '/questionnaire-completed';
        return;
      }
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

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

    try {
      // Try to find existing client by email using Supabase
      const existingClient = await findClientByEmail(formData.email);

      let clientId: string = '';
      let shouldCreateClient = false;

      if (existingClient) {
        // Use existing client
        clientId = existingClient.id;
      } else {
        // Will create new client
        shouldCreateClient = true;
        clientId = 'temp-client-id'; // Temporary, will be updated
      }

      // Create behaviour questionnaire using the service (this will generate a proper UUID)
      const questionnaireData = {
        clientId,
        ownerFirstName: formData.ownerFirstName,
        ownerLastName: formData.ownerLastName,
        email: formData.email,
        contactNumber: formData.contactNumber,
        address1: formData.address1,
        address2: formData.address2,
        city: formData.city,
        stateProvince: formData.stateProvince,
        zipPostalCode: formData.zipPostalCode,
        country: formData.country,
        howDidYouHear: formData.howDidYouHear,
        dogName: formData.dogName,
        age: formData.age,
        sex: formData.sex as 'Male' | 'Female',
        breed: formData.breed,
        neuteredSpayed: formData.neuteredSpayed,
        mainHelp: formData.mainHelp,
        firstNoticed: formData.firstNoticed,
        whenWhereHow: formData.whenWhereHow,
        recentChange: formData.recentChange,
        canAnticipate: formData.canAnticipate,
        whyThinking: formData.whyThinking,
        whatDoneSoFar: formData.whatDoneSoFar,
        idealGoal: formData.idealGoal,
        anythingElse: formData.anythingElse,
        medicalHistory: formData.medicalHistory,
        vetAdvice: formData.vetAdvice,
        whereGotDog: formData.whereGotDog,
        rescueBackground: formData.rescueBackground,
        ageWhenGot: formData.ageWhenGot,
        whatFeed: formData.whatFeed,
        foodMotivated: formData.foodMotivated,
        mealtime: formData.mealtime,
        treatRoutine: formData.treatRoutine,
        happyWithTreats: formData.happyWithTreats,
        typesOfPlay: formData.typesOfPlay,
        affectionate: formData.affectionate,
        exercise: formData.exercise,
        useMuzzle: formData.useMuzzle,
        familiarPeople: formData.familiarPeople,
        unfamiliarPeople: formData.unfamiliarPeople,
        housetrained: formData.housetrained,
        likesToDo: formData.likesToDo,
        likeAboutDog: formData.likeAboutDog,
        mostChallenging: formData.mostChallenging,
        howGood: formData.howGood,
        favouriteRewards: formData.favouriteRewards,
        howBad: formData.howBad,
        effectOfBad: formData.effectOfBad,
        professionalTraining: formData.professionalTraining,
        sociabilityDogs: formData.sociabilityDogs as BehaviourQuestionnaire['sociabilityDogs'],
        sociabilityPeople: formData.sociabilityPeople as BehaviourQuestionnaire['sociabilityPeople'],
        anythingElseToKnow: formData.anythingElseToKnow,
        timePerWeek: formData.timePerWeek,
      };

      if (shouldCreateClient) {
        // Create new client first
        const client = await createClient({
          firstName: formData.ownerFirstName,
          lastName: formData.ownerLastName,
          dogName: formData.dogName,
          phone: formData.contactNumber,
          email: formData.email,
          address: `${formData.address1}${formData.address2 ? ', ' + formData.address2 : ''}, ${formData.city}, ${formData.stateProvince} ${formData.zipPostalCode}, ${formData.country}`,
          active: true,
          membership: false,
        });

        // Update questionnaire data with actual client ID
        questionnaireData.clientId = client.id;
      }

      // Create the questionnaire in Supabase using the service
      const createdQuestionnaire = await behaviourQuestionnaireService.create(questionnaireData);

      // Add questionnaire to state
      dispatch({ type: 'ADD_BEHAVIOUR_QUESTIONNAIRE', payload: createdQuestionnaire });

      // Update client with questionnaire reference and dog name for easier lookup
      const finalClientId = shouldCreateClient ? questionnaireData.clientId : existingClient!.id;
      await updateClient(finalClientId, {
        behaviourQuestionnaireId: createdQuestionnaire.id,
        dogName: formData.dogName, // Ensure dog name is set on client
      });

      // Navigate back silently (no alert as per user preference)
      window.location.href = '/';
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      alert('There was an error submitting your questionnaire. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#4f6749' }}>
      <div className="flex-1 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg p-6" style={{ backgroundColor: '#ebeadf' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Owner Information Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-400">
                  OWNER INFORMATION
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
                          className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                          className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                        className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                          className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                          className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                            className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                            className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                            className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                            className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>
                </div>
              </div>

              {/* Dog Information Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2 pb-2 border-b border-gray-400">
                  DOG INFORMATION
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>
                </div>
              </div>

              {/* Health and Veterinary Information Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-400">
                  HEALTH AND VETERINARY INFORMATION
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>
                </div>
              </div>

              {/* Background Information Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-400">
                  BACKGROUND INFORMATION
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>
                </div>
              </div>

              {/* Diet and Feeding Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-400">
                  DIET AND FEEDING
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>
                </div>
              </div>

              {/* Routines Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-400">
                  ROUTINES
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>
                </div>
              </div>

              {/* Temperament Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-400">
                  TEMPERAMENT
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>
                </div>
              </div>

              {/* Training Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-400">
                  TRAINING
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>
                </div>
              </div>

              {/* Sociability Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-400">
                  SOCIABILITY
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
                      style={{ backgroundColor: '#ebeadf' }}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full text-white font-medium py-3 px-6 rounded transition-colors"
                  style={{ backgroundColor: '#4f6749' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5237'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f6749'}
                >
                  Submit
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

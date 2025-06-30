'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { BehaviouralBrief } from '@/types';
import { behaviouralBriefService } from '@/services/behaviouralBriefService';
import ThankYouPopup from '@/components/ui/ThankYouPopup';

export default function BehaviouralBriefPage() {
  const { createClient, dispatch } = useApp();
  const [formData, setFormData] = useState({
    ownerFirstName: '',
    ownerLastName: '',
    email: '',
    contactNumber: '',
    postcode: '',
    dogName: '',
    sex: '' as 'Male' | 'Female' | '',
    breed: '',
    lifeWithDog: '',
    bestOutcome: '',
    sessionType: '' as BehaviouralBrief['sessionType'] | '',
  });

  const [showThankYou, setShowThankYou] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (sessionType: BehaviouralBrief['sessionType']) => {
    setFormData(prev => ({
      ...prev,
      sessionType: prev.sessionType === sessionType ? '' : sessionType
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create client with Supabase first
      const client = await createClient({
        firstName: formData.ownerFirstName,
        lastName: formData.ownerLastName,
        dogName: formData.dogName,
        phone: formData.contactNumber,
        email: formData.email,
        active: true,
        membership: false,
      });

      // Create behavioural brief data
      const briefData = {
        clientId: client.id,
        ownerFirstName: formData.ownerFirstName,
        ownerLastName: formData.ownerLastName,
        email: formData.email,
        contactNumber: formData.contactNumber,
        postcode: formData.postcode,
        dogName: formData.dogName,
        sex: formData.sex as 'Male' | 'Female',
        breed: formData.breed,
        lifeWithDog: formData.lifeWithDog,
        bestOutcome: formData.bestOutcome,
        sessionType: formData.sessionType as BehaviouralBrief['sessionType'],
      };

      // Create the behavioural brief in Supabase using the service
      const createdBrief = await behaviouralBriefService.create(briefData);

      // Add behavioural brief to local state
      dispatch({ type: 'ADD_BEHAVIOURAL_BRIEF', payload: createdBrief });

      // Show thank you popup
      setShowThankYou(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your form. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#4f6749' }}>
      <div className="flex-1 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg p-6" style={{ backgroundColor: '#ebeadf' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Contact Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Name <span className="text-gray-500">(required)</span>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-gray-500">(required)</span>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number <span className="text-gray-500">(required)</span>
                    </label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-400 rounded bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      style={{ backgroundColor: '#ebeadf' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postcode <span className="text-gray-500">(required)</span>
                    </label>
                    <input
                      type="text"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
                      style={{ backgroundColor: '#ebeadf' }}
                      required
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
                      Dog Name <span className="text-gray-500">(required)</span>
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
                      Sex <span className="text-gray-500">(required)</span>
                    </label>
                    <select
                      name="sex"
                      value={formData.sex}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
                      style={{ backgroundColor: '#ebeadf' }}
                      required
                    >
                      <option value="">Please Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What breed is your dog? <span className="text-gray-500">(required)</span>
                    </label>
                    <p className="text-xs text-gray-600 mb-2">Unknown/mixed is fine :-)</p>
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
                      In general, how is life with your dog, and what would you like help with? <span className="text-gray-500">(required)</span>
                    </label>
                    <p className="text-xs text-gray-600 mb-2">New puppy, new dog, new rescue, general training, behaviour concern, etc.</p>
                    <textarea
                      name="lifeWithDog"
                      value={formData.lifeWithDog}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
                      style={{ backgroundColor: '#ebeadf' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What would be the best outcome for you and your dog? <span className="text-gray-500">(required)</span>
                    </label>
                    <p className="text-xs text-gray-600 mb-2">E.g. a better relationship, a happier dog, an easier home life, more relaxed walks, etc.</p>
                    <textarea
                      name="bestOutcome"
                      value={formData.bestOutcome}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
                      style={{ backgroundColor: '#ebeadf' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Which type of session would you ideally like?
                    </label>
                    <div className="space-y-2">
                      {[
                        'Online Session',
                        'In-Person Session',
                        'Rescue Remedy Session (Dog Club members & current clients only)'
                      ].map((option) => (
                        <label key={option} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.sessionType === option}
                            onChange={() => handleCheckboxChange(option as BehaviouralBrief['sessionType'])}
                            className="mr-2 h-4 w-4 text-amber-600 focus:ring-black border-gray-300 rounded checked:border-black"
                            style={{
                              accentColor: formData.sessionType === option ? '#000000' : undefined,
                            }}
                          />
                          <span className="text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
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

      {/* Thank You Popup */}
      <ThankYouPopup
        isOpen={showThankYou}
        onClose={() => setShowThankYou(false)}
        title="Thank You!"
        message="Your behavioural brief has been successfully submitted. We appreciate the information you've provided about your training goals. We'll be in touch soon to discuss the next steps."
        redirectUrl="/"
        redirectDelay={3500}
      />
    </div>
  );
}

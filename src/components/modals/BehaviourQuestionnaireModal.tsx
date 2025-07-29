'use client';

import { BehaviourQuestionnaire, Client } from '@/types';
import { useApp } from '@/context/AppContext';
import SlideUpModal from './SlideUpModal';
import { format } from 'date-fns';

interface BehaviourQuestionnaireModalProps {
  behaviourQuestionnaire: BehaviourQuestionnaire | null;
  isOpen: boolean;
  onClose: () => void;
  onViewClient?: (client: Client) => void;
}

export default function BehaviourQuestionnaireModal({ behaviourQuestionnaire, isOpen, onClose, onViewClient }: BehaviourQuestionnaireModalProps) {
  const { dispatch, state } = useApp();

  if (!behaviourQuestionnaire) return null;

  // Find the client for this behaviour questionnaire
  const client = state.clients.find(c =>
    c.id === behaviourQuestionnaire.client_id || c.id === behaviourQuestionnaire.clientId
  );

  const handleDelete = () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to delete this behaviour questionnaire? This action cannot be undone.')) {
      dispatch({ type: 'DELETE_BEHAVIOUR_QUESTIONNAIRE', payload: behaviourQuestionnaire.id });

      // Note: No need to update client since questionnaires are now linked via client_id
      // The questionnaire deletion will automatically remove the relationship
      
      onClose();
    }
  };

  const displayName = `${behaviourQuestionnaire.ownerFirstName} ${behaviourQuestionnaire.ownerLastName}${behaviourQuestionnaire.dogName ? ` w/ ${behaviourQuestionnaire.dogName}` : ''}`;

  return (
    <SlideUpModal
      isOpen={isOpen}
      onClose={onClose}
      title={displayName}
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-0 divide-y divide-gray-100">
          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Owner(s) Name</span>
            <span className="font-semibold text-gray-900 text-right">
              {behaviourQuestionnaire.ownerFirstName} {behaviourQuestionnaire.ownerLastName}
            </span>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Dog(s) Name</span>
            <span className="font-semibold text-gray-900 text-right">{behaviourQuestionnaire.dogName}</span>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Email</span>
            <span className="font-semibold text-gray-900 text-right break-all">{behaviourQuestionnaire.email}</span>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Contact Number</span>
            <span className="font-semibold text-gray-900 text-right">{behaviourQuestionnaire.contactNumber}</span>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Age</span>
            <span className="font-semibold text-gray-900 text-right">{behaviourQuestionnaire.age}</span>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Sex</span>
            <span className="font-semibold text-gray-900 text-right">{behaviourQuestionnaire.sex}</span>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Breed</span>
            <span className="font-semibold text-gray-900 text-right">{behaviourQuestionnaire.breed}</span>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Neutered/Spayed</span>
            <span className="font-semibold text-gray-900 text-right">{behaviourQuestionnaire.neuteredSpayed}</span>
          </div>

          {behaviourQuestionnaire.address1 && (
            <div className="flex justify-between items-start py-4">
              <span className="text-gray-600 font-medium">Address</span>
              <span className="font-semibold text-gray-900 text-right max-w-48">
                {behaviourQuestionnaire.address1}
                {behaviourQuestionnaire.address2 && <><br />{behaviourQuestionnaire.address2}</>}
                <br />{behaviourQuestionnaire.city}, {behaviourQuestionnaire.stateProvince} {behaviourQuestionnaire.zipPostalCode}
                <br />{behaviourQuestionnaire.country}
              </span>
            </div>
          )}

          {behaviourQuestionnaire.howDidYouHear && (
            <div className="flex justify-between items-center py-4">
              <span className="text-gray-600 font-medium">How They Heard</span>
              <span className="font-semibold text-gray-900 text-right">{behaviourQuestionnaire.howDidYouHear}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-600 font-medium">Submitted</span>
            <span className="font-semibold text-gray-900 text-right">
              {format(behaviourQuestionnaire.submittedAt, 'dd/MM/yyyy, HH:mm')}
            </span>
          </div>
        </div>

        {/* Behaviour Information */}
        <div>
          <div className="text-white text-lg font-bold p-3 mb-3 -mx-6" style={{ backgroundColor: '#973b00' }}>
            Behaviour Information
          </div>
          <div className="space-y-4">
            {behaviourQuestionnaire.mainHelp && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">What is the main thing you would like help with?</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.mainHelp}</p>
                </div>
              </div>
            )}

            {behaviourQuestionnaire.firstNoticed && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">When did you first notice tendencies of this behaviour?</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.firstNoticed}</p>
                </div>
              </div>
            )}

            {behaviourQuestionnaire.whenWhereHow && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">When, where and how often does it happen? Be specific</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.whenWhereHow}</p>
                </div>
              </div>
            )}

            {behaviourQuestionnaire.recentChange && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Has there been a recent change in the behaviour?</h4>
                <p className="text-xs text-gray-600 mb-2">More frequent? More intense? Different circumstances?</p>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.recentChange}</p>
                </div>
              </div>
            )}

            {behaviourQuestionnaire.canAnticipate && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Can you anticipate when it is likely to happen?</h4>
                <p className="text-xs text-gray-600 mb-2">Location, who is present, trigger, etc.</p>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.canAnticipate}</p>
                </div>
              </div>
            )}

            {behaviourQuestionnaire.whyThinking && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Why do you think your dog is doing this?</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.whyThinking}</p>
                </div>
              </div>
            )}

            {behaviourQuestionnaire.whatDoneSoFar && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">What have you done so far to address this problem? With what effect?</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.whatDoneSoFar}</p>
                </div>
              </div>
            )}

            {behaviourQuestionnaire.idealGoal && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">What would you consider your ideal goal/outcome of a training program?</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.idealGoal}</p>
                </div>
              </div>
            )}

            {behaviourQuestionnaire.anythingElse && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Is there anything else you would like help with if possible?</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.anythingElse}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Health & Veterinary */}
        {(behaviourQuestionnaire.medicalHistory || behaviourQuestionnaire.vetAdvice) && (
          <div>
            <div className="text-white text-lg font-bold p-3 mb-3 -mx-6" style={{ backgroundColor: '#973b00' }}>
              Health & Veterinary
            </div>
            <div className="space-y-3">
              {behaviourQuestionnaire.medicalHistory && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Does your dog have any past relevant medical or health conditions or important medical history? If yes, please describe.</h4>
                  <p className="text-xs text-gray-600 mb-2">Allergies, medication, injury etc.</p>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.medicalHistory}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.vetAdvice && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Have you specifically asked your Veterinarian about any of your dog's training and behaviour concerns? If yes, what was their advice?</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.vetAdvice}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Background */}
        {(behaviourQuestionnaire.whereGotDog || behaviourQuestionnaire.rescueBackground || behaviourQuestionnaire.ageWhenGot) && (
          <div>
            <div className="text-white text-lg font-bold p-3 mb-3 -mx-6" style={{ backgroundColor: '#973b00' }}>
              Background
            </div>
            <div className="space-y-3">
              {behaviourQuestionnaire.whereGotDog && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Where did you get your dog from?</span>
                  <span className="font-medium text-gray-900">{behaviourQuestionnaire.whereGotDog}</span>
                </div>
              )}
              {behaviourQuestionnaire.ageWhenGot && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">How old was your dog when you got him/her?</span>
                  <span className="font-medium text-gray-900">{behaviourQuestionnaire.ageWhenGot}</span>
                </div>
              )}
              {behaviourQuestionnaire.rescueBackground && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">If your dog was a rescue, what do you know about their background?</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.rescueBackground}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diet & Feeding - Expanded */}
        <div>
          <div className="text-white text-lg font-bold p-3 mb-3 -mx-6" style={{ backgroundColor: '#973b00' }}>
            Diet & Feeding
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">How food motivated is your dog? (1-10)</span>
              <span className="font-medium text-gray-900">{behaviourQuestionnaire.foodMotivated}/10</span>
            </div>
            {behaviourQuestionnaire.whatFeed && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">What do you feed your dog? Please be specific</h4>
                <p className="text-xs text-gray-600 mb-2">Brand, variety, canned, dried, raw, home cooked, etc.</p>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.whatFeed}</p>
                </div>
              </div>
            )}
            {behaviourQuestionnaire.mealtime && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Please describe your dog's mealtime.</h4>
                <p className="text-xs text-gray-600 mb-2">Where, when, how often, who feeds, special routine, etc.</p>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.mealtime}</p>
                </div>
              </div>
            )}
            {behaviourQuestionnaire.treatRoutine && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Please describe any treat routine your dog has.</h4>
                <p className="text-xs text-gray-600 mb-2">Who, what kind of treat, etc.</p>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.treatRoutine}</p>
                </div>
              </div>
            )}
            {behaviourQuestionnaire.happyWithTreats && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">If applicable, are you happy for me to give your dog treats I bring along? If no, please have some to hand that you are happy for me to use.</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.happyWithTreats}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Routines */}
        {(behaviourQuestionnaire.typesOfPlay || behaviourQuestionnaire.affectionate || behaviourQuestionnaire.exercise || behaviourQuestionnaire.useMuzzle || behaviourQuestionnaire.familiarPeople || behaviourQuestionnaire.unfamiliarPeople || behaviourQuestionnaire.housetrained || behaviourQuestionnaire.likesToDo) && (
          <div>
            <div className="text-white text-lg font-bold p-3 mb-3 -mx-6" style={{ backgroundColor: '#973b00' }}>
              Routines
            </div>
            <div className="space-y-3">
              {behaviourQuestionnaire.typesOfPlay && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">What types of play do you engage in with your dog? Do they enjoy it?</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.typesOfPlay}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.affectionate && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Are you affectionate with your dog? Do they enjoy it?</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.affectionate}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.exercise && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">What types of exercise does your dog regularly get?</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.exercise}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.useMuzzle && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Does your dog use a muzzle for any reason?</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.useMuzzle}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.familiarPeople && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">How does your dog react when familiar people come to your home? Please describe.</h4>
                  <p className="text-xs text-gray-600 mb-2">Bark, jump, mouth, calm, etc.</p>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.familiarPeople}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.unfamiliarPeople && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">How does your dog react when unfamiliar people come to your home? Please describe.</h4>
                  <p className="text-xs text-gray-600 mb-2">Bark, jump, mouth, calm, etc.</p>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.unfamiliarPeople}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.housetrained && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Is your dog fully housetrained?</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.housetrained}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.likesToDo && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">What does your dog like to do aside from walks?</h4>
                  <p className="text-xs text-gray-600 mb-2">Enrichment, games, jobs, etc.</p>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.likesToDo}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Temperament */}
        {(behaviourQuestionnaire.likeAboutDog || behaviourQuestionnaire.mostChallenging) && (
          <div>
            <div className="text-white text-lg font-bold p-3 mb-3 -mx-6" style={{ backgroundColor: '#973b00' }}>
              Temperament
            </div>
            <div className="space-y-3">
              {behaviourQuestionnaire.likeAboutDog && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">What do you like about your dog?</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.likeAboutDog}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.mostChallenging && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">What do you find most challenging about your dog?</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.mostChallenging}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Training */}
        {(behaviourQuestionnaire.howGood || behaviourQuestionnaire.favouriteRewards || behaviourQuestionnaire.howBad || behaviourQuestionnaire.effectOfBad || behaviourQuestionnaire.professionalTraining) && (
          <div>
            <div className="text-white text-lg font-bold p-3 mb-3 -mx-6" style={{ backgroundColor: '#973b00' }}>
              Training
            </div>
            <div className="space-y-3">
              {behaviourQuestionnaire.howGood && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">How do you let your dog know when they have done something "good"?</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.howGood}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.favouriteRewards && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">What are your dog's favourite rewards?</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.favouriteRewards}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.howBad && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Do you let your dog know when they have done something "bad"? How?</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.howBad}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.effectOfBad && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">What effect does your method of telling them they've done something bad have?</h4>
                  <p className="text-xs text-gray-600 mb-2">ie: no change, stopped behaviour, got worse, only worked with certain person, etc.</p>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.effectOfBad}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.professionalTraining && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Has your dog participated in any professional training before? If yes, please describe.</h4>
                  <p className="text-xs text-gray-600 mb-2">What type of methods were used? How was your experience and the results?</p>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.professionalTraining}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sociability */}
        <div>
          <div className="text-white text-lg font-bold p-3 mb-3 -mx-6" style={{ backgroundColor: '#973b00' }}>
            Sociability
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">How would you describe your dog's sociability with other dogs in general?</span>
              <span className="font-medium text-gray-900">{behaviourQuestionnaire.sociabilityDogs}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">How would you describe your dog's sociability with other people in general?</span>
              <span className="font-medium text-gray-900">{behaviourQuestionnaire.sociabilityPeople}</span>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {behaviourQuestionnaire.anythingElseToKnow && (
          <div>
            <div className="text-white text-lg font-bold p-3 mb-3 -mx-6" style={{ backgroundColor: '#973b00' }}>
              Is there anything else that you would like me to know about your situation or your dog?
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{behaviourQuestionnaire.anythingElseToKnow}</p>
            </div>
          </div>
        )}

        {/* Training Time */}
        {behaviourQuestionnaire.timePerWeek && (
          <div>
            <div className="text-white text-lg font-bold p-3 mb-3 -mx-6" style={{ backgroundColor: '#973b00' }}>
              Training Commitment
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Time per week available</span>
              <span className="font-medium text-gray-900">{behaviourQuestionnaire.timePerWeek}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
          {client && (
            <button
              onClick={() => {
                if (onViewClient) {
                  onViewClient(client);
                } else {
                  dispatch({ type: 'SET_SELECTED_CLIENT', payload: client });
                }
                onClose();
              }}
              className="w-full bg-amber-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-700 transition-colors"
            >
              View Client Profile
            </button>
          )}
          
          <button
            onClick={handleDelete}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Delete Behaviour Questionnaire
          </button>
        </div>
      </div>
    </SlideUpModal>
  );
}

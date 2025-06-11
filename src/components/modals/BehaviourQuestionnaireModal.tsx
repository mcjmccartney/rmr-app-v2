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
  const client = state.clients.find(c => c.behaviourQuestionnaireId === behaviourQuestionnaire.id);

  const handleDelete = () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to delete this behaviour questionnaire? This action cannot be undone.')) {
      dispatch({ type: 'DELETE_BEHAVIOUR_QUESTIONNAIRE', payload: behaviourQuestionnaire.id });
      
      // Also update the client to remove the behaviour questionnaire reference
      if (client) {
        dispatch({ 
          type: 'UPDATE_CLIENT', 
          payload: { ...client, behaviourQuestionnaireId: undefined } 
        });
      }
      
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
        {/* Submission Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Submitted</span>
            <span className="font-medium text-gray-900">
              {format(behaviourQuestionnaire.submittedAt, 'PPP')} at {format(behaviourQuestionnaire.submittedAt, 'p')}
            </span>
          </div>
        </div>

        {/* Owner Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
            Owner Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Owner Name</span>
              <span className="font-medium text-gray-900">
                {behaviourQuestionnaire.ownerFirstName} {behaviourQuestionnaire.ownerLastName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Email</span>
              <span className="font-medium text-gray-900">{behaviourQuestionnaire.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Contact Number</span>
              <span className="font-medium text-gray-900">{behaviourQuestionnaire.contactNumber}</span>
            </div>
            <div className="space-y-1">
              <span className="text-gray-600">Address</span>
              <div className="font-medium text-gray-900 text-right">
                {behaviourQuestionnaire.address1}
                {behaviourQuestionnaire.address2 && <br />}{behaviourQuestionnaire.address2}
                <br />{behaviourQuestionnaire.city}, {behaviourQuestionnaire.stateProvince} {behaviourQuestionnaire.zipPostalCode}
                <br />{behaviourQuestionnaire.country}
              </div>
            </div>
            {behaviourQuestionnaire.howDidYouHear && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">How they heard about services</span>
                <span className="font-medium text-gray-900">{behaviourQuestionnaire.howDidYouHear}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dog Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
            Dog Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Dog Name</span>
              <span className="font-medium text-gray-900">{behaviourQuestionnaire.dogName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Age</span>
              <span className="font-medium text-gray-900">{behaviourQuestionnaire.age}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sex</span>
              <span className="font-medium text-gray-900">{behaviourQuestionnaire.sex}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Breed</span>
              <span className="font-medium text-gray-900">{behaviourQuestionnaire.breed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Neutered/Spayed</span>
              <span className="font-medium text-gray-900">{behaviourQuestionnaire.neuteredSpayed}</span>
            </div>
          </div>
        </div>

        {/* Behavior Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
            Behavior Information
          </h3>
          <div className="space-y-4">
            {behaviourQuestionnaire.mainHelp && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Main Help Needed</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.mainHelp}</p>
                </div>
              </div>
            )}

            {behaviourQuestionnaire.firstNoticed && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">When First Noticed</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.firstNoticed}</p>
                </div>
              </div>
            )}

            {behaviourQuestionnaire.whenWhereHow && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">When, Where & How Often</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.whenWhereHow}</p>
                </div>
              </div>
            )}

            {behaviourQuestionnaire.recentChange && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Recent Changes</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.recentChange}</p>
                </div>
              </div>
            )}

            {behaviourQuestionnaire.canAnticipate && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Can Anticipate When It Happens</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.canAnticipate}</p>
                </div>
              </div>
            )}

            {behaviourQuestionnaire.whyThinking && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Why Dog Is Doing This</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.whyThinking}</p>
                </div>
              </div>
            )}

            {behaviourQuestionnaire.whatDoneSoFar && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">What's Been Tried So Far</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.whatDoneSoFar}</p>
                </div>
              </div>
            )}

            {behaviourQuestionnaire.idealGoal && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Ideal Goal/Outcome</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.idealGoal}</p>
                </div>
              </div>
            )}

            {behaviourQuestionnaire.anythingElse && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Anything Else to Help With</h4>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Health & Veterinary
            </h3>
            <div className="space-y-3">
              {behaviourQuestionnaire.medicalHistory && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Medical History</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.medicalHistory}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.vetAdvice && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Veterinarian Advice</h4>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Background
            </h3>
            <div className="space-y-3">
              {behaviourQuestionnaire.whereGotDog && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Where got dog</span>
                  <span className="font-medium text-gray-900">{behaviourQuestionnaire.whereGotDog}</span>
                </div>
              )}
              {behaviourQuestionnaire.ageWhenGot && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Age when acquired</span>
                  <span className="font-medium text-gray-900">{behaviourQuestionnaire.ageWhenGot}</span>
                </div>
              )}
              {behaviourQuestionnaire.rescueBackground && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Rescue Background</h4>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
            Diet & Feeding
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Food Motivation (1-10)</span>
              <span className="font-medium text-gray-900">{behaviourQuestionnaire.foodMotivated}/10</span>
            </div>
            {behaviourQuestionnaire.whatFeed && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">What they feed</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.whatFeed}</p>
                </div>
              </div>
            )}
            {behaviourQuestionnaire.mealtime && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Mealtime Routine</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.mealtime}</p>
                </div>
              </div>
            )}
            {behaviourQuestionnaire.treatRoutine && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Treat Routine</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.treatRoutine}</p>
                </div>
              </div>
            )}
            {behaviourQuestionnaire.happyWithTreats && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Happy with trainer treats?</h4>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Routines
            </h3>
            <div className="space-y-3">
              {behaviourQuestionnaire.typesOfPlay && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Types of Play</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.typesOfPlay}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.affectionate && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Affection</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.affectionate}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.exercise && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Exercise</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.exercise}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.useMuzzle && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Muzzle Use</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.useMuzzle}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.familiarPeople && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Reaction to Familiar People</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.familiarPeople}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.unfamiliarPeople && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Reaction to Unfamiliar People</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.unfamiliarPeople}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.housetrained && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Housetraining</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.housetrained}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.likesToDo && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Activities Besides Walks</h4>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Temperament
            </h3>
            <div className="space-y-3">
              {behaviourQuestionnaire.likeAboutDog && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">What They Like About Dog</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.likeAboutDog}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.mostChallenging && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Most Challenging</h4>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Training
            </h3>
            <div className="space-y-3">
              {behaviourQuestionnaire.howGood && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">How They Reward Good Behavior</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.howGood}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.favouriteRewards && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Dog's Favorite Rewards</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.favouriteRewards}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.howBad && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">How They Handle Bad Behavior</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.howBad}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.effectOfBad && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Effect of Corrections</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{behaviourQuestionnaire.effectOfBad}</p>
                  </div>
                </div>
              )}
              {behaviourQuestionnaire.professionalTraining && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Professional Training History</h4>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
            Sociability
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">With Dogs</span>
              <span className="font-medium text-gray-900">{behaviourQuestionnaire.sociabilityDogs}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">With People</span>
              <span className="font-medium text-gray-900">{behaviourQuestionnaire.sociabilityPeople}</span>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {behaviourQuestionnaire.anythingElseToKnow && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Additional Information
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{behaviourQuestionnaire.anythingElseToKnow}</p>
            </div>
          </div>
        )}

        {/* Training Time */}
        {behaviourQuestionnaire.timePerWeek && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Training Commitment
            </h3>
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

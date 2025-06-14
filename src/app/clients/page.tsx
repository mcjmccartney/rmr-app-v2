'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import AddModal from '@/components/AddModal';
import ClientModal from '@/components/modals/ClientModal';
import EditClientModal from '@/components/modals/EditClientModal';
import BehaviouralBriefModal from '@/components/modals/BehaviouralBriefModal';
import BehaviourQuestionnaireModal from '@/components/modals/BehaviourQuestionnaireModal';
import RMRLogo from '@/components/RMRLogo';
import { Client, BehaviouralBrief, BehaviourQuestionnaire } from '@/types';
import { Calendar, UserPlus, Users, UserCheck, ClipboardList, FileQuestion } from 'lucide-react';

export default function ClientsPage() {
  const { state } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<'session' | 'client'>('client');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showBehaviouralBriefModal, setShowBehaviouralBriefModal] = useState(false);
  const [selectedBehaviouralBrief, setSelectedBehaviouralBrief] = useState<BehaviouralBrief | null>(null);
  const [showBehaviourQuestionnaireModal, setShowBehaviourQuestionnaireModal] = useState(false);
  const [selectedBehaviourQuestionnaire, setSelectedBehaviourQuestionnaire] = useState<BehaviourQuestionnaire | null>(null);
  const [showMembersOnly, setShowMembersOnly] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const filteredClients = state.clients.filter(client => {
    const searchTerm = searchQuery.toLowerCase();
    const matchesSearch = (
      client.firstName?.toLowerCase().includes(searchTerm) ||
      client.lastName?.toLowerCase().includes(searchTerm) ||
      client.dogName?.toLowerCase().includes(searchTerm) ||
      client.otherDogs?.some(dog => dog.toLowerCase().includes(searchTerm))
    );

    // Apply filters - if both are off, show all; if both are on, show clients that match both
    let matchesFilter = true;

    if (showMembersOnly && showActiveOnly) {
      matchesFilter = client.membership && client.active;
    } else if (showMembersOnly) {
      matchesFilter = client.membership;
    } else if (showActiveOnly) {
      matchesFilter = client.active;
    }

    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    // Sort by membership first (members first), then by active status, then alphabetically
    if (a.membership !== b.membership) {
      return b.membership ? 1 : -1; // Members first
    }

    if (a.active !== b.active) {
      return b.active ? 1 : -1; // Active first within each membership group
    }

    // Alphabetical by first name, then last name
    const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim();
    const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim();
    return aName.localeCompare(bName);
  });

  // Calculate counts
  const totalCount = state.clients.length;
  const membersCount = state.clients.filter(client => client.membership).length;
  const activeCount = state.clients.filter(client => client.active).length;



  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setShowClientModal(true);
  };

  const handleAddClient = () => {
    setAddModalType('client');
    setShowAddModal(true);
  };

  const handleAddSession = () => {
    setAddModalType('session');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleCloseClientModal = () => {
    setShowClientModal(false);
    setSelectedClient(null);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientModal(false); // Close the client modal first
    setShowEditClientModal(true); // Then open the edit modal
  };

  const handleCloseEditClientModal = () => {
    setShowEditClientModal(false);
    setSelectedClient(null);
  };

  const handleViewBehaviouralBrief = (behaviouralBriefId: string) => {
    const brief = state.behaviouralBriefs.find(b => b.id === behaviouralBriefId);
    if (brief) {
      setSelectedBehaviouralBrief(brief);
      setShowClientModal(false);
      setShowBehaviouralBriefModal(true);
    }
  };

  const handleCloseBehaviouralBriefModal = () => {
    setShowBehaviouralBriefModal(false);
    setSelectedBehaviouralBrief(null);
  };

  const handleViewBehaviourQuestionnaire = (behaviourQuestionnaireId: string) => {
    const questionnaire = state.behaviourQuestionnaires.find(q => q.id === behaviourQuestionnaireId);
    if (questionnaire) {
      setSelectedBehaviourQuestionnaire(questionnaire);
      setShowClientModal(false);
      setShowBehaviourQuestionnaireModal(true);
    }
  };

  const handleCloseBehaviourQuestionnaireModal = () => {
    setShowBehaviourQuestionnaireModal(false);
    setSelectedBehaviourQuestionnaire(null);
  };

  const handleViewClientFromModal = (client: Client) => {
    // Close any open modals first
    setShowBehaviouralBriefModal(false);
    setShowBehaviourQuestionnaireModal(false);
    setSelectedBehaviouralBrief(null);
    setSelectedBehaviourQuestionnaire(null);

    // Open client modal
    setSelectedClient(client);
    setShowClientModal(true);
  };

  const getDisplayTitle = () => {
    if (showMembersOnly && showActiveOnly) {
      return `${filteredClients.length} Active Members`;
    } else if (showMembersOnly) {
      return `${filteredClients.length} Members`;
    } else if (showActiveOnly) {
      return `${filteredClients.length} Active`;
    } else {
      return `${filteredClients.length} Total`;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-amber-800">
        <Header
          title={getDisplayTitle()}
          buttons={[
            {
              icon: Users,
              onClick: () => setShowMembersOnly(!showMembersOnly),
              title: `Members (${membersCount})`,
              isActive: showMembersOnly,
              iconOnly: true
            },
            {
              icon: UserCheck,
              onClick: () => setShowActiveOnly(!showActiveOnly),
              title: `Active (${activeCount})`,
              isActive: showActiveOnly,
              iconOnly: true
            },
            {
              icon: Calendar,
              onClick: handleAddSession,
              title: 'Add Session',
              iconOnly: true
            },
            {
              icon: UserPlus,
              onClick: handleAddClient,
              title: 'Add Client',
              iconOnly: true
            }
          ]}
          showSearch
          onSearch={setSearchQuery}
          searchPlaceholder="Search"
        />
      </div>

      <div className="px-4 pb-4 bg-gray-50 flex-1">
        {/* Clients List */}
        <div className="space-y-3 mt-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={() => handleClientClick(client)}
              className={`rounded-lg p-3 shadow-sm flex items-center justify-between active:bg-gray-50 transition-colors cursor-pointer ${
                client.active ? 'bg-white' : 'bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                {client.membership && (
                  <RMRLogo size={32} />
                )}
                <div className={client.membership ? '' : 'ml-0'}>
                  <h3 className={`font-medium ${client.active ? 'text-gray-900' : 'text-gray-600'}`}>
                    {client.firstName} {client.lastName}
                    {client.dogName && (
                      <span className={`text-sm font-normal ${client.active ? 'text-gray-500' : 'text-gray-400'}`}>
                        {' '}w/ {client.dogName}
                      </span>
                    )}
                  </h3>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {client.behaviouralBriefId && (
                  <div className="bg-green-100 p-2 rounded-full" title="Has Behavioural Brief">
                    <ClipboardList size={16} className="text-green-600" />
                  </div>
                )}
                {client.behaviourQuestionnaireId && (
                  <div className="bg-blue-100 p-2 rounded-full" title="Has Behaviour Questionnaire">
                    <FileQuestion size={16} className="text-blue-600" />
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No clients found</p>
          </div>
        )}
      </div>

      <AddModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        type={addModalType}
      />

      <ClientModal
        client={selectedClient}
        isOpen={showClientModal}
        onClose={handleCloseClientModal}
        onEditClient={handleEditClient}
        onViewBehaviouralBrief={handleViewBehaviouralBrief}
        onViewBehaviourQuestionnaire={handleViewBehaviourQuestionnaire}
      />

      <EditClientModal
        client={selectedClient}
        isOpen={showEditClientModal}
        onClose={handleCloseEditClientModal}
      />

      <BehaviouralBriefModal
        behaviouralBrief={selectedBehaviouralBrief}
        isOpen={showBehaviouralBriefModal}
        onClose={handleCloseBehaviouralBriefModal}
        onViewClient={handleViewClientFromModal}
      />

      <BehaviourQuestionnaireModal
        behaviourQuestionnaire={selectedBehaviourQuestionnaire}
        isOpen={showBehaviourQuestionnaireModal}
        onClose={handleCloseBehaviourQuestionnaireModal}
        onViewClient={handleViewClientFromModal}
      />
    </div>
  );
}

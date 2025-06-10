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
import { Calendar, UserPlus, Filter, ClipboardList, FileQuestion } from 'lucide-react';

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
  const [clientFilter, setClientFilter] = useState<'all' | 'active' | 'inactive' | 'members' | 'non-members'>('all');

  const filteredClients = state.clients.filter(client => {
    const searchTerm = searchQuery.toLowerCase();
    const matchesSearch = (
      client.firstName?.toLowerCase().includes(searchTerm) ||
      client.lastName?.toLowerCase().includes(searchTerm) ||
      client.dogName?.toLowerCase().includes(searchTerm)
    );

    const matchesFilter =
      clientFilter === 'all' ||
      (clientFilter === 'active' && client.active) ||
      (clientFilter === 'inactive' && !client.active) ||
      (clientFilter === 'members' && client.membership) ||
      (clientFilter === 'non-members' && !client.membership);

    return matchesSearch && matchesFilter;
  });

  // Calculate counts for each filter
  const allClientsCount = state.clients.length;
  const activeClientsCount = state.clients.filter(client => client.active).length;
  const inactiveClientsCount = state.clients.filter(client => !client.active).length;
  const membersCount = state.clients.filter(client => client.membership).length;
  const nonMembersCount = state.clients.filter(client => !client.membership).length;

  const getAvatarText = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

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

  const handleFilterToggle = () => {
    const filterOrder: typeof clientFilter[] = ['all', 'active', 'inactive', 'members', 'non-members'];
    const currentIndex = filterOrder.indexOf(clientFilter);
    const nextIndex = (currentIndex + 1) % filterOrder.length;
    setClientFilter(filterOrder[nextIndex]);
  };

  const getFilterTitle = () => {
    switch (clientFilter) {
      case 'active': return `Active Clients (${activeClientsCount})`;
      case 'inactive': return `Inactive Clients (${inactiveClientsCount})`;
      case 'members': return `Members Only (${membersCount})`;
      case 'non-members': return `Non-Members Only (${nonMembersCount})`;
      default: return `All Clients (${allClientsCount})`;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-amber-800">
        <Header
          title={`${filteredClients.length} ${clientFilter === 'all' ? 'Total' : clientFilter === 'active' ? 'Active' : clientFilter === 'inactive' ? 'Inactive' : clientFilter === 'members' ? 'Members' : 'Non-Members'}`}
          buttons={[
            {
              icon: Filter,
              onClick: handleFilterToggle,
              title: getFilterTitle()
            },
            {
              icon: Calendar,
              onClick: handleAddSession,
              title: 'Add Session'
            },
            {
              icon: UserPlus,
              onClick: handleAddClient,
              title: 'Add Client'
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
              className={`rounded-lg p-4 shadow-sm flex items-center justify-between active:bg-gray-50 transition-colors cursor-pointer ${
                client.active ? 'bg-white' : 'bg-gray-100 border-l-4 border-gray-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                {client.membership && (
                  <RMRLogo size={40} />
                )}
                <div className={client.membership ? '' : 'ml-0'}>
                  <h3 className={`font-medium ${client.active ? 'text-gray-900' : 'text-gray-600'}`}>
                    {client.firstName} {client.lastName}
                  </h3>
                  {client.dogName && (
                    <p className={`text-sm ${client.active ? 'text-gray-500' : 'text-gray-400'}`}>
                      {client.dogName}
                    </p>
                  )}
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

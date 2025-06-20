import { membershipService } from './membershipService';
import { clientService } from './clientService';
import { Client, Membership } from '@/types';

export interface MembershipStatus {
  isActive: boolean;
  lastPaymentDate: string | null;
  expirationDate: string | null;
  daysUntilExpiration: number | null;
  isExpired: boolean;
}

export const membershipExpirationService = {
  /**
   * Check if a client's membership is still active based on their most recent payment
   */
  async checkMembershipStatus(client: Client): Promise<MembershipStatus> {
    if (!client.email) {
      return {
        isActive: false,
        lastPaymentDate: null,
        expirationDate: null,
        daysUntilExpiration: null,
        isExpired: true
      };
    }

    try {
      // Get all memberships for this client's email
      const memberships = await membershipService.getByEmail(client.email);
      
      if (memberships.length === 0) {
        return {
          isActive: false,
          lastPaymentDate: null,
          expirationDate: null,
          daysUntilExpiration: null,
          isExpired: true
        };
      }

      // Sort by date to get the most recent membership
      const sortedMemberships = memberships.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      const mostRecentMembership = sortedMemberships[0];
      const lastPaymentDate = new Date(mostRecentMembership.date);
      
      // Calculate expiration date (1 month from last payment)
      const expirationDate = new Date(lastPaymentDate);
      expirationDate.setMonth(expirationDate.getMonth() + 1);
      
      const now = new Date();
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = now > expirationDate;
      const isActive = !isExpired;

      return {
        isActive,
        lastPaymentDate: mostRecentMembership.date,
        expirationDate: expirationDate.toISOString().split('T')[0], // YYYY-MM-DD format
        daysUntilExpiration,
        isExpired
      };
    } catch (error) {
      console.error('Error checking membership status for client:', client.id, error);
      return {
        isActive: false,
        lastPaymentDate: null,
        expirationDate: null,
        daysUntilExpiration: null,
        isExpired: true
      };
    }
  },

  /**
   * Update a client's membership status based on their payment history
   */
  async updateClientMembershipStatus(client: Client): Promise<Client> {
    const membershipStatus = await this.checkMembershipStatus(client);
    
    // Only update if the membership status has changed
    if (client.membership !== membershipStatus.isActive) {
      console.log(`🔄 Updating membership status for ${client.firstName} ${client.lastName}: ${client.membership} → ${membershipStatus.isActive}`);
      
      try {
        const updatedClient = await clientService.update(client.id, {
          membership: membershipStatus.isActive
        });
        
        console.log(`✅ Updated membership status for ${client.firstName} ${client.lastName} to ${membershipStatus.isActive}`);
        return updatedClient;
      } catch (error) {
        console.error('Error updating client membership status:', error);
        return client; // Return original client if update fails
      }
    }
    
    return client; // No change needed
  },

  /**
   * Check and update membership status for all clients
   */
  async updateAllClientMembershipStatuses(): Promise<{ updated: number; total: number }> {
    try {
      console.log('🔍 Starting membership status update for all clients...');
      
      const clients = await clientService.getAll();
      let updatedCount = 0;
      
      for (const client of clients) {
        if (client.email) {
          const originalStatus = client.membership;
          const updatedClient = await this.updateClientMembershipStatus(client);
          
          if (updatedClient.membership !== originalStatus) {
            updatedCount++;
          }
        }
      }
      
      console.log(`✅ Membership status update complete: ${updatedCount} clients updated out of ${clients.length} total`);
      
      return {
        updated: updatedCount,
        total: clients.length
      };
    } catch (error) {
      console.error('Error updating all client membership statuses:', error);
      throw error;
    }
  },

  /**
   * Get clients whose memberships are expiring soon (within specified days)
   */
  async getExpiringMemberships(daysThreshold: number = 7): Promise<Array<Client & { membershipStatus: MembershipStatus }>> {
    try {
      const clients = await clientService.getAll();
      const expiringClients: Array<Client & { membershipStatus: MembershipStatus }> = [];
      
      for (const client of clients) {
        if (client.email && client.membership) {
          const membershipStatus = await this.checkMembershipStatus(client);
          
          if (membershipStatus.daysUntilExpiration !== null && 
              membershipStatus.daysUntilExpiration <= daysThreshold && 
              membershipStatus.daysUntilExpiration > 0) {
            expiringClients.push({
              ...client,
              membershipStatus
            });
          }
        }
      }
      
      return expiringClients.sort((a, b) => 
        (a.membershipStatus.daysUntilExpiration || 0) - (b.membershipStatus.daysUntilExpiration || 0)
      );
    } catch (error) {
      console.error('Error getting expiring memberships:', error);
      return [];
    }
  },

  /**
   * Get clients whose memberships have expired
   */
  async getExpiredMemberships(): Promise<Array<Client & { membershipStatus: MembershipStatus }>> {
    try {
      const clients = await clientService.getAll();
      const expiredClients: Array<Client & { membershipStatus: MembershipStatus }> = [];
      
      for (const client of clients) {
        if (client.email) {
          const membershipStatus = await this.checkMembershipStatus(client);
          
          if (membershipStatus.isExpired && client.membership) {
            // Client is marked as member but membership has expired
            expiredClients.push({
              ...client,
              membershipStatus
            });
          }
        }
      }
      
      return expiredClients;
    } catch (error) {
      console.error('Error getting expired memberships:', error);
      return [];
    }
  }
};

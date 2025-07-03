import { supabase } from '@/lib/supabase'
import { Client, Membership } from '@/types'
import { ClientEmailAliasService } from './clientEmailAliasService'

export interface MembershipPairingResult {
  success: boolean;
  pairingCount: number;
  errors: string[];
  details: {
    clientId: string;
    clientName: string;
    email: string;
    membershipCount: number;
  }[];
}

export const membershipPairingService = {
  /**
   * Auto-pair memberships with clients by email (including aliases)
   * This will update the client.membership field based on active memberships
   */
  async pairMembershipsWithClients(): Promise<MembershipPairingResult> {
    const result: MembershipPairingResult = {
      success: true,
      pairingCount: 0,
      errors: [],
      details: []
    }

    try {
      // Get all clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')

      if (clientsError) {
        result.success = false
        result.errors.push(`Error fetching clients: ${clientsError.message}`)
        return result
      }

      // Get all memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('memberships')
        .select('*')

      if (membershipsError) {
        result.success = false
        result.errors.push(`Error fetching memberships: ${membershipsError.message}`)
        return result
      }

      // Process each client
      for (const client of clients || []) {
        try {
          // Start with client's primary email (case-insensitive)
          const clientEmails: string[] = []
          if (client.email) {
            clientEmails.push(client.email.toLowerCase())
          }

          // Get all email aliases for this client and add them
          const aliases = await ClientEmailAliasService.getAliasesByClientId(client.id)
          aliases.forEach(alias => {
            if (alias.email && !clientEmails.includes(alias.email.toLowerCase())) {
              clientEmails.push(alias.email.toLowerCase())
            }
          })

          // Find memberships for any of the client's emails (case-insensitive)
          const clientMemberships = (memberships || []).filter(membership =>
            clientEmails.includes(membership.email.toLowerCase())
          )

          // Check if client has any recent memberships (within last 2 months)
          const twoMonthsAgo = new Date()
          twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

          const recentMemberships = clientMemberships.filter(membership => {
            const membershipDate = new Date(membership.date)
            return membershipDate >= twoMonthsAgo
          })

          const shouldBeMember = recentMemberships.length > 0
          const currentMembershipStatus = client.membership

          // Update client membership status if it has changed
          if (shouldBeMember !== currentMembershipStatus) {
            const { error: updateError } = await supabase
              .from('clients')
              .update({ membership: shouldBeMember })
              .eq('id', client.id)

            if (updateError) {
              result.errors.push(`Error updating client ${client.first_name} ${client.last_name}: ${updateError.message}`)
            } else {
              result.pairingCount++
              result.details.push({
                clientId: client.id,
                clientName: `${client.first_name} ${client.last_name}`,
                email: client.email || 'No primary email',
                membershipCount: clientMemberships.length
              })

              console.log(`✅ Updated membership status for ${client.first_name} ${client.last_name}: ${currentMembershipStatus} → ${shouldBeMember} (found ${clientMemberships.length} memberships across ${clientEmails.length} emails)`);
            }
          }

          // Update membership records with client_id if not already set
          for (const membership of clientMemberships) {
            if (!membership.client_id) {
              const { error: membershipUpdateError } = await supabase
                .from('memberships')
                .update({ client_id: client.id })
                .eq('id', membership.id);

              if (membershipUpdateError) {
                result.errors.push(`Error linking membership ${membership.id} to client: ${membershipUpdateError.message}`);
              }
            }
          }

        } catch (error) {
          result.errors.push(`Error processing client ${client.first_name} ${client.last_name}: ${error}`);
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`General error: ${error}`);
    }

    return result
  },

  /**
   * Check if a client should be considered a member based on their memberships
   */
  async isClientMember(clientId: string): Promise<boolean> {
    try {
      // Get all email aliases for this client
      const aliases = await ClientEmailAliasService.getAliasesByClientId(clientId)
      const emails = aliases.map(alias => alias.email)

      if (emails.length === 0) {
        return false
      }

      // Check for recent memberships (within last 2 months)
      const twoMonthsAgo = new Date()
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

      const { data: recentMemberships, error } = await supabase
        .from('memberships')
        .select('*')
        .in('email', emails)
        .gte('date', twoMonthsAgo.toISOString())

      if (error) {
        console.error('Error checking client membership status:', error)
        return false
      }

      return (recentMemberships || []).length > 0

    } catch (error) {
      console.error('Error in isClientMember:', error)
      return false
    }
  },

  /**
   * Get membership details for a specific client
   */
  async getClientMembershipDetails(clientId: string): Promise<{
    isMember: boolean;
    memberships: Membership[];
    lastMembershipDate?: string;
  }> {
    try {
      // Get the client's primary email first
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('email')
        .eq('id', clientId)
        .single()

      if (clientError) {
        console.error('Error fetching client for membership details:', clientError)
        return {
          isMember: false,
          memberships: []
        }
      }

      // Start with client's primary email
      const emails: string[] = []
      if (client?.email) {
        emails.push(client.email)
      }

      // Get all email aliases for this client and add them
      const aliases = await ClientEmailAliasService.getAliasesByClientId(clientId)
      aliases.forEach(alias => {
        if (alias.email && !emails.includes(alias.email)) {
          emails.push(alias.email)
        }
      })

      if (emails.length === 0) {
        return {
          isMember: false,
          memberships: []
        }
      }

      // Get all memberships for this client
      const { data: memberships, error } = await supabase
        .from('memberships')
        .select('*')
        .in('email', emails)
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching client membership details:', error)
        return {
          isMember: false,
          memberships: []
        }
      }

      const membershipRecords = (memberships || []).map(m => ({
        id: m.id,
        email: m.email,
        date: m.date,
        amount: parseFloat(m.amount) || 0
      }))

      // Check if member based on recent memberships
      const twoMonthsAgo = new Date()
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

      const recentMemberships = membershipRecords.filter(membership => {
        const membershipDate = new Date(membership.date)
        return membershipDate >= twoMonthsAgo
      })

      return {
        isMember: recentMemberships.length > 0,
        memberships: membershipRecords,
        lastMembershipDate: membershipRecords.length > 0 ? membershipRecords[0].date : undefined
      }

    } catch (error) {
      console.error('Error in getClientMembershipDetails:', error)
      return {
        isMember: false,
        memberships: []
      }
    }
  }
}

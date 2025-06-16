import { Client, Session, BehaviouralBrief, BehaviourQuestionnaire, BookingTerm, Membership } from '@/types';
import { clientService } from './clientService';
import { sessionService } from './sessionService';
import { behaviouralBriefService } from './behaviouralBriefService';
import { behaviourQuestionnaireService } from './behaviourQuestionnaireService';
import { bookingTermsService } from './bookingTermsService';
import { membershipService } from './membershipService';
import { clientEmailAliasService } from './clientEmailAliasService';

export interface MergePreview {
  primaryClient: Client;
  duplicateClient: Client;
  mergedData: {
    client: Partial<Client>;
    sessionsToTransfer: Session[];
    formsToTransfer: {
      behaviouralBriefs: BehaviouralBrief[];
      behaviourQuestionnaires: BehaviourQuestionnaire[];
      bookingTerms: BookingTerm[];
    };
    membershipsToTransfer: Membership[];
  };
  conflicts: {
    field: string;
    primaryValue: any;
    duplicateValue: any;
    suggestedValue: any;
  }[];
}

export interface MergeResult {
  success: boolean;
  mergedClient: Client;
  transferredSessions: number;
  transferredForms: number;
  transferredMemberships: number;
  error?: string;
}

export class ClientMergeService {
  /**
   * Generate a preview of what will happen during the merge
   */
  static async generateMergePreview(
    primaryClient: Client,
    duplicateClient: Client
  ): Promise<MergePreview> {
    try {
      // Get all related data for both clients
      const [
        primarySessions,
        duplicateSessions,
        primaryBehaviouralBriefs,
        duplicateBehaviouralBriefs,
        primaryQuestionnaires,
        duplicateQuestionnaires,
        primaryBookingTerms,
        duplicateBookingTerms,
        primaryMemberships,
        duplicateMemberships
      ] = await Promise.all([
        sessionService.getByClientId(primaryClient.id),
        sessionService.getByClientId(duplicateClient.id),
        behaviouralBriefService.getByClientId(primaryClient.id),
        behaviouralBriefService.getByClientId(duplicateClient.id),
        behaviourQuestionnaireService.getByClientId(primaryClient.id),
        behaviourQuestionnaireService.getByClientId(duplicateClient.id),
        bookingTermsService.getByEmail(primaryClient.email || ''),
        bookingTermsService.getByEmail(duplicateClient.email || ''),
        membershipService.getByEmail(primaryClient.email || ''),
        membershipService.getByEmail(duplicateClient.email || '')
      ]);

      // Determine merged client data and conflicts
      const { mergedData, conflicts } = this.mergeClientData(primaryClient, duplicateClient);

      return {
        primaryClient,
        duplicateClient,
        mergedData: {
          client: mergedData,
          sessionsToTransfer: duplicateSessions,
          formsToTransfer: {
            behaviouralBriefs: duplicateBehaviouralBriefs,
            behaviourQuestionnaires: duplicateQuestionnaires,
            bookingTerms: duplicateBookingTerms
          },
          membershipsToTransfer: duplicateMemberships
        },
        conflicts
      };
    } catch (error) {
      console.error('Error generating merge preview:', error);
      throw error;
    }
  }

  /**
   * Execute the client merge operation
   */
  static async mergeClients(
    primaryClient: Client,
    duplicateClient: Client,
    userChoices?: { [field: string]: any }
  ): Promise<MergeResult> {
    try {
      console.log('Starting client merge:', {
        primary: primaryClient.id,
        duplicate: duplicateClient.id
      });

      // Generate merge preview to get all the data
      const preview = await this.generateMergePreview(primaryClient, duplicateClient);
      
      // Apply user choices to resolve conflicts
      let finalMergedData = { ...preview.mergedData.client };
      if (userChoices) {
        Object.keys(userChoices).forEach(field => {
          finalMergedData[field as keyof Client] = userChoices[field];
        });
      }

      // Step 1: Update primary client with merged data
      const updatedPrimaryClient = await clientService.update(primaryClient.id, finalMergedData);

      // Step 2: Transfer sessions
      let transferredSessions = 0;
      for (const session of preview.mergedData.sessionsToTransfer) {
        await sessionService.update(session.id, { clientId: primaryClient.id });
        transferredSessions++;
      }

      // Step 3: Transfer forms
      let transferredForms = 0;
      
      // Transfer behavioural briefs
      for (const brief of preview.mergedData.formsToTransfer.behaviouralBriefs) {
        await behaviouralBriefService.update(brief.id, { clientId: primaryClient.id });
        transferredForms++;
      }

      // Transfer behaviour questionnaires
      for (const questionnaire of preview.mergedData.formsToTransfer.behaviourQuestionnaires) {
        await behaviourQuestionnaireService.update(questionnaire.id, { clientId: primaryClient.id });
        transferredForms++;
      }

      // Transfer booking terms (update email reference)
      for (const bookingTerm of preview.mergedData.formsToTransfer.bookingTerms) {
        if (updatedPrimaryClient.email && bookingTerm.email !== updatedPrimaryClient.email) {
          await bookingTermsService.update(bookingTerm.id, { email: updatedPrimaryClient.email });
          transferredForms++;
        }
      }

      // Step 4: Transfer memberships
      let transferredMemberships = 0;
      for (const membership of preview.mergedData.membershipsToTransfer) {
        if (updatedPrimaryClient.email && membership.email !== updatedPrimaryClient.email) {
          await membershipService.update(membership.id, { email: updatedPrimaryClient.email });
          transferredMemberships++;
        }
      }

      // Step 5: Set up email aliases for future payments
      if (updatedPrimaryClient.email || duplicateClient.email) {
        await clientEmailAliasService.setupAliasesAfterMerge(
          updatedPrimaryClient.id,
          updatedPrimaryClient.email || '',
          duplicateClient.email || ''
        );
      }

      // Step 6: Delete duplicate client
      await clientService.delete(duplicateClient.id);

      console.log('Client merge completed successfully:', {
        mergedClient: updatedPrimaryClient.id,
        transferredSessions,
        transferredForms,
        transferredMemberships,
        emailAliasesSetup: true
      });

      return {
        success: true,
        mergedClient: updatedPrimaryClient,
        transferredSessions,
        transferredForms,
        transferredMemberships
      };

    } catch (error) {
      console.error('Error merging clients:', error);
      return {
        success: false,
        mergedClient: primaryClient,
        transferredSessions: 0,
        transferredForms: 0,
        transferredMemberships: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Merge client data intelligently, preferring more complete information
   */
  private static mergeClientData(
    primaryClient: Client,
    duplicateClient: Client
  ): { mergedData: Partial<Client>; conflicts: any[] } {
    const mergedData: Partial<Client> = {};
    const conflicts: any[] = [];

    // Fields to merge with conflict detection
    const fieldsToMerge: (keyof Client)[] = [
      'firstName', 'lastName', 'email', 'phone', 'address', 'dogName', 'otherDogs'
    ];

    fieldsToMerge.forEach(field => {
      const primaryValue = primaryClient[field];
      const duplicateValue = duplicateClient[field];

      if (primaryValue && duplicateValue && primaryValue !== duplicateValue) {
        // Conflict detected
        conflicts.push({
          field,
          primaryValue,
          duplicateValue,
          suggestedValue: this.chooseBetterValue(primaryValue, duplicateValue)
        });
        mergedData[field] = this.chooseBetterValue(primaryValue, duplicateValue) as any;
      } else if (duplicateValue && !primaryValue) {
        // Use duplicate value if primary is empty
        mergedData[field] = duplicateValue;
      }
      // If primary has value and duplicate doesn't, keep primary (no change needed)
    });

    // Handle boolean fields (prefer true values)
    mergedData.active = primaryClient.active || duplicateClient.active;
    mergedData.membership = primaryClient.membership || duplicateClient.membership;

    return { mergedData, conflicts };
  }

  /**
   * Choose the better value between two options
   */
  private static chooseBetterValue(value1: any, value2: any): any {
    // Prefer longer strings (more complete information)
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      return value1.length >= value2.length ? value1 : value2;
    }

    // Prefer arrays with more items
    if (Array.isArray(value1) && Array.isArray(value2)) {
      return value1.length >= value2.length ? value1 : value2;
    }

    // Default to first value
    return value1;
  }
}

export const clientMergeService = ClientMergeService;

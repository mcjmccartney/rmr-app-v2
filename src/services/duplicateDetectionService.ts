import { Client, PotentialDuplicate } from '@/types';

export class DuplicateDetectionService {
  /**
   * Detect potential duplicate clients based on various matching criteria
   */
  static detectDuplicates(clients: Client[]): PotentialDuplicate[] {
    const duplicates: PotentialDuplicate[] = [];
    const processedPairs = new Set<string>();

    for (let i = 0; i < clients.length; i++) {
      for (let j = i + 1; j < clients.length; j++) {
        const clientA = clients[i];
        const clientB = clients[j];
        
        // Create a unique pair identifier to avoid processing the same pair twice
        const pairId = [clientA.id, clientB.id].sort().join('-');
        if (processedPairs.has(pairId)) continue;
        processedPairs.add(pairId);

        const matchResult = this.analyzeMatch(clientA, clientB);
        
        if (matchResult.isMatch) {
          // Determine which client should be primary (more sessions, earlier creation, etc.)
          const primaryClient = this.determinePrimaryClient(clientA, clientB);
          const duplicateClient = primaryClient.id === clientA.id ? clientB : clientA;

          duplicates.push({
            id: `dup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            primaryClient,
            duplicateClient,
            matchReasons: matchResult.reasons,
            confidence: matchResult.confidence,
            dogName: matchResult.dogName,
            suggestedAction: matchResult.confidence === 'high' ? 'merge' : 'review',
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    return duplicates;
  }

  /**
   * Analyze if two clients are potential duplicates
   */
  private static analyzeMatch(clientA: Client, clientB: Client): {
    isMatch: boolean;
    reasons: string[];
    confidence: 'high' | 'medium' | 'low';
    dogName: string;
  } {
    const reasons: string[] = [];
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let dogName = '';

    // Skip if either client doesn't have a dog name
    if (!clientA.dogName || !clientB.dogName) {
      return { isMatch: false, reasons: [], confidence: 'low', dogName: '' };
    }

    // 1. Exact dog name matching (required)
    if (clientA.dogName.toLowerCase().trim() === clientB.dogName.toLowerCase().trim()) {
      reasons.push(`Same dog name: ${clientA.dogName}`);
      dogName = clientA.dogName;
      confidence = 'medium';
    } else {
      return { isMatch: false, reasons: [], confidence: 'low', dogName: '' };
    }

    // 2. Same surname (high confidence indicator)
    if (clientA.lastName.toLowerCase().trim() === clientB.lastName.toLowerCase().trim()) {
      reasons.push(`Same surname: ${clientA.lastName}`);
      confidence = 'high';
    }

    // 3. Phone number matching (high confidence booster)
    if (clientA.phone && clientB.phone) {
      const phoneMatch = this.comparePhoneNumbers(clientA.phone, clientB.phone);
      if (phoneMatch) {
        reasons.push('Same phone number');
        confidence = 'high';
      }
    }

    return {
      isMatch: reasons.length > 0,
      reasons,
      confidence,
      dogName
    };
  }



  /**
   * Compare phone numbers (normalize format)
   */
  private static comparePhoneNumbers(phoneA: string, phoneB: string): boolean {
    // Remove all non-digit characters
    const cleanA = phoneA.replace(/\D/g, '');
    const cleanB = phoneB.replace(/\D/g, '');
    
    // Handle UK numbers - remove leading 44 or 0
    const normalizeUK = (phone: string) => {
      if (phone.startsWith('44')) return phone.substring(2);
      if (phone.startsWith('0')) return phone.substring(1);
      return phone;
    };

    return normalizeUK(cleanA) === normalizeUK(cleanB);
  }



  /**
   * Determine which client should be the primary one
   */
  private static determinePrimaryClient(clientA: Client, clientB: Client): Client {
    // Prefer client with more complete information
    const scoreA = this.calculateClientCompleteness(clientA);
    const scoreB = this.calculateClientCompleteness(clientB);

    if (scoreA !== scoreB) {
      return scoreA > scoreB ? clientA : clientB;
    }

    // If equal completeness, prefer the one created first (assuming earlier ID means earlier creation)
    return clientA.id < clientB.id ? clientA : clientB;
  }

  /**
   * Calculate how complete a client's information is
   */
  private static calculateClientCompleteness(client: Client): number {
    let score = 0;
    if (client.firstName) score += 1;
    if (client.lastName) score += 1;
    if (client.dogName) score += 2; // Dog name is important
    if (client.email) score += 2;
    if (client.phone) score += 2;
    if (client.address) score += 1;
    if (client.behaviouralBriefId) score += 1;
    if (client.behaviourQuestionnaireId) score += 1;
    return score;
  }


}

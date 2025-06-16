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

    // 1. Dog name matching (primary indicator)
    const dogNameMatch = this.compareDogNames(clientA.dogName, clientB.dogName);
    if (dogNameMatch.isMatch) {
      reasons.push(`Same dog name: ${dogNameMatch.name}`);
      dogName = dogNameMatch.name;
      confidence = dogNameMatch.exact ? 'medium' : 'low';
    } else {
      return { isMatch: false, reasons: [], confidence: 'low', dogName: '' };
    }

    // 2. Phone number matching (high confidence booster)
    if (clientA.phone && clientB.phone) {
      const phoneMatch = this.comparePhoneNumbers(clientA.phone, clientB.phone);
      if (phoneMatch) {
        reasons.push('Same phone number');
        confidence = 'high';
      }
    }

    // 3. Address matching (medium confidence booster)
    if (clientA.address && clientB.address) {
      const addressMatch = this.compareAddresses(clientA.address, clientB.address);
      if (addressMatch.isMatch) {
        reasons.push(`Similar address: ${addressMatch.similarity}`);
        if (confidence === 'medium') confidence = 'high';
      }
    }

    // 4. Name similarity (low confidence booster)
    const nameMatch = this.compareNames(clientA, clientB);
    if (nameMatch.isMatch) {
      reasons.push(`Similar names: ${nameMatch.reason}`);
      // Don't upgrade confidence for name matches alone, but note them
    }

    // 5. Email domain matching (family members might use same domain)
    if (clientA.email && clientB.email) {
      const emailDomainMatch = this.compareEmailDomains(clientA.email, clientB.email);
      if (emailDomainMatch) {
        reasons.push('Same email domain');
        // Don't upgrade confidence, just note it
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
   * Compare dog names with fuzzy matching
   */
  private static compareDogNames(nameA: string, nameB: string): {
    isMatch: boolean;
    exact: boolean;
    name: string;
  } {
    const cleanA = nameA.toLowerCase().trim();
    const cleanB = nameB.toLowerCase().trim();

    // Exact match
    if (cleanA === cleanB) {
      return { isMatch: true, exact: true, name: nameA };
    }

    // Common nickname variations
    const nicknames: { [key: string]: string[] } = {
      'max': ['maxi', 'maxie'],
      'buddy': ['buddie', 'bud'],
      'charlie': ['chuck', 'chas'],
      'bella': ['belle'],
      'lucy': ['lucie'],
      'molly': ['mollie'],
      'bailey': ['bayley'],
      'riley': ['ryley'],
    };

    // Check if one is a nickname of the other
    for (const [base, variants] of Object.entries(nicknames)) {
      if ((cleanA === base && variants.includes(cleanB)) ||
          (cleanB === base && variants.includes(cleanA)) ||
          (variants.includes(cleanA) && variants.includes(cleanB))) {
        return { isMatch: true, exact: false, name: nameA };
      }
    }

    // Levenshtein distance for typos (distance of 1-2 for short names)
    const distance = this.levenshteinDistance(cleanA, cleanB);
    const maxDistance = Math.min(2, Math.floor(Math.min(cleanA.length, cleanB.length) / 3));
    
    if (distance <= maxDistance && distance > 0) {
      return { isMatch: true, exact: false, name: nameA };
    }

    return { isMatch: false, exact: false, name: '' };
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
   * Compare addresses for similarity
   */
  private static compareAddresses(addressA: string, addressB: string): {
    isMatch: boolean;
    similarity: string;
  } {
    const cleanA = addressA.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const cleanB = addressB.toLowerCase().replace(/[^\w\s]/g, '').trim();

    // Exact match
    if (cleanA === cleanB) {
      return { isMatch: true, similarity: 'exact' };
    }

    // Check if one contains the other (partial address)
    if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) {
      return { isMatch: true, similarity: 'partial' };
    }

    // Check for common words (street name, area)
    const wordsA = cleanA.split(/\s+/).filter(w => w.length > 2);
    const wordsB = cleanB.split(/\s+/).filter(w => w.length > 2);
    const commonWords = wordsA.filter(word => wordsB.includes(word));

    if (commonWords.length >= 2) {
      return { isMatch: true, similarity: 'common elements' };
    }

    return { isMatch: false, similarity: '' };
  }

  /**
   * Compare client names for similarity
   */
  private static compareNames(clientA: Client, clientB: Client): {
    isMatch: boolean;
    reason: string;
  } {
    const firstA = clientA.firstName.toLowerCase();
    const lastA = clientA.lastName.toLowerCase();
    const firstB = clientB.firstName.toLowerCase();
    const lastB = clientB.lastName.toLowerCase();

    // Same last name (family members)
    if (lastA === lastB) {
      return { isMatch: true, reason: 'same last name' };
    }

    // First name matches (might be same person with different last name)
    if (firstA === firstB) {
      return { isMatch: true, reason: 'same first name' };
    }

    // Similar names (typos)
    if (this.levenshteinDistance(firstA, firstB) <= 1 && 
        this.levenshteinDistance(lastA, lastB) <= 1) {
      return { isMatch: true, reason: 'similar names' };
    }

    return { isMatch: false, reason: '' };
  }

  /**
   * Compare email domains
   */
  private static compareEmailDomains(emailA: string, emailB: string): boolean {
    const domainA = emailA.split('@')[1]?.toLowerCase();
    const domainB = emailB.split('@')[1]?.toLowerCase();
    
    return domainA === domainB && domainA !== 'gmail.com' && domainA !== 'hotmail.com' && domainA !== 'yahoo.com';
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

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}

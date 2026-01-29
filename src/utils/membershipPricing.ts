import { sessionService } from '@/services/sessionService';
import { membershipService } from '@/services/membershipService';
import { Session } from '@/types';
import { calculateQuote, getTravelExpenseCost } from './pricing';

/**
 * Calculate membership expiration date from a membership payment date
 * Membership expires at midnight of the following day of the next month
 * For example: payment on 2024-01-15 expires at midnight on 2024-02-16
 */
export function calculateMembershipExpiration(membershipDate: string): Date {
  const paymentDate = new Date(membershipDate);
  const expirationDate = new Date(paymentDate);
  expirationDate.setMonth(expirationDate.getMonth() + 1); // Next month
  expirationDate.setDate(expirationDate.getDate() + 1); // Following day
  expirationDate.setHours(0, 0, 0, 0); // Midnight
  return expirationDate;
}

/**
 * Check if a session date falls within a membership period
 */
export function isSessionWithinMembershipPeriod(
  sessionDate: string,
  membershipStartDate: string,
  membershipEndDate: Date
): boolean {
  const session = new Date(sessionDate);
  const start = new Date(membershipStartDate);
  
  // Session must be on or after membership start and before membership expiration
  return session >= start && session < membershipEndDate;
}

/**
 * Get the most recent membership for a client
 */
export async function getMostRecentMembership(clientId: string) {
  const memberships = await membershipService.getByClientIdWithAliases(clientId);
  
  if (memberships.length === 0) {
    return null;
  }
  
  // Sort by date to get the most recent
  const sorted = memberships.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return sorted[0];
}

/**
 * Update future session prices when a client becomes a member
 * Only updates sessions that fall within the membership period
 * 
 * @param clientId - The client ID
 * @param membershipDate - The membership payment date (YYYY-MM-DD)
 * @returns Object with count of updated sessions and details
 */
export async function updateFutureSessionPricesForMember(
  clientId: string,
  membershipDate: string
): Promise<{ updatedCount: number; sessions: Session[] }> {
  try {
    console.log(`[MEMBERSHIP PRICING] Updating future session prices for client ${clientId}`);
    
    // Calculate membership expiration
    const membershipExpiration = calculateMembershipExpiration(membershipDate);
    console.log(`[MEMBERSHIP PRICING] Membership period: ${membershipDate} to ${membershipExpiration.toISOString().split('T')[0]}`);
    
    // Get all sessions for this client
    const allSessions = await sessionService.getByClientId(clientId);
    
    // Filter for future sessions within membership period
    const now = new Date();
    const futureSessions = allSessions.filter(session => {
      const sessionDate = new Date(session.bookingDate);
      return sessionDate >= now && isSessionWithinMembershipPeriod(
        session.bookingDate,
        membershipDate,
        membershipExpiration
      );
    });
    
    console.log(`[MEMBERSHIP PRICING] Found ${futureSessions.length} future sessions within membership period`);
    
    const updatedSessions: Session[] = [];
    let updatedCount = 0;
    
    for (const session of futureSessions) {
      // Skip sessions that don't have pricing (Group, Phone Call, Coaching, etc.)
      if (session.sessionType === 'Group' || 
          session.sessionType === 'Phone Call' || 
          session.sessionType === 'Coaching') {
        console.log(`[MEMBERSHIP PRICING] Skipping ${session.sessionType} session (no automatic pricing)`);
        continue;
      }
      
      // Determine if this is a first session
      // Count only Online and In-Person sessions before this one
      const previousSessions = allSessions.filter(s => {
        const sDate = new Date(s.bookingDate);
        const currentDate = new Date(session.bookingDate);
        return (s.sessionType === 'Online' || s.sessionType === 'In-Person') &&
               sDate < currentDate &&
               s.id !== session.id;
      });
      const isFirstSession = previousSessions.length === 0;
      
      // Calculate new quote with member pricing
      const baseQuote = calculateQuote(session.sessionType, true, isFirstSession);
      const travelCost = getTravelExpenseCost(session.travelExpense);
      const newQuote = baseQuote + travelCost;
      
      // Only update if the price has changed
      if (newQuote !== session.quote) {
        console.log(`[MEMBERSHIP PRICING] Updating session ${session.id}: £${session.quote} → £${newQuote}`);
        
        const updatedSession = await sessionService.update(session.id, {
          quote: newQuote
        });
        
        updatedSessions.push(updatedSession);
        updatedCount++;
      } else {
        console.log(`[MEMBERSHIP PRICING] Session ${session.id} already has correct price: £${newQuote}`);
      }
    }
    
    console.log(`[MEMBERSHIP PRICING] Updated ${updatedCount} session(s)`);
    
    return {
      updatedCount,
      sessions: updatedSessions
    };
  } catch (error) {
    console.error('[MEMBERSHIP PRICING] Error updating future session prices:', error);
    throw error;
  }
}


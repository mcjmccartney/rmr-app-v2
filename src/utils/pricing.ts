import { Session } from '@/types';

export const getTravelExpenseCost = (travelExpense?: 'Zone 1' | 'Zone 2' | 'Zone 3' | null): number => {
  if (!travelExpense) return 0;

  switch (travelExpense) {
    case 'Zone 1':
      return 10;
    case 'Zone 2':
      return 15;
    case 'Zone 3':
      return 20;
    default:
      return 0;
  }
};

export const calculateQuote = (
  sessionType: Session['sessionType'],
  isMember: boolean,
  isFirstSession: boolean = false
): number => {
  switch (sessionType) {
    case 'Online':
      if (isFirstSession) {
        return isMember ? 70 : 90; // First session pricing
      }
      return isMember ? 50 : 70; // Subsequent session pricing
    case 'Training - 1hr':
      return isMember ? 50 : 60; // £50 for members, £60 for non-members
    case 'Training - 30mins':
      return 25; // Always £25 regardless of membership
    case 'Training - The Mount':
      return isMember ? 50 : 60; // Same pricing as Training - 1hr
    case 'In-Person':
      if (isFirstSession) {
        return isMember ? 100 : 120; // First session pricing
      }
      return isMember ? 75 : 95; // Subsequent session pricing
    case 'Online Catchup':
      return 30;
    case 'Group':
    case 'Phone Call':
    case 'Coaching':
      // These can be manually set, return 0 as default
      return 0;
    default:
      return 0;
  }
};

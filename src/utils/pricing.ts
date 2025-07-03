import { Session } from '@/types';

export const calculateQuote = (sessionType: Session['sessionType'], isMember: boolean): number => {
  switch (sessionType) {
    case 'Online':
      return isMember ? 50 : 70;
    case 'Training - 1hr':
      return 50; // Always £50 regardless of membership
    case 'Training - 30mins':
      return 25; // Always £25 regardless of membership
    case 'In-Person':
      return isMember ? 75 : 95;
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

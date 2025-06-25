import { Session } from '@/types';

export const calculateQuote = (sessionType: Session['sessionType'], isMember: boolean): number => {
  switch (sessionType) {
    case 'Online':
    case 'Training':
      return isMember ? 50 : 70;
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

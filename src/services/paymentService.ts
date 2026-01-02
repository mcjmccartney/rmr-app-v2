import { Session, Client } from '@/types';

export interface PaymentLinkConfig {
  appBaseUrl: string;
}

// Comprehensive Monzo payment links organized by session type, membership, session number, and travel zones
const PAYMENT_LINKS = {
  // Online Catchup - £30 (same for everyone)
  'Online Catchup': 'https://monzo.com/pay/r/raising-my-rescue_qeDXP5wJpnqGln',

  // Training Sessions
  'Training - 1hr': {
    member: 'https://monzo.com/pay/r/raising-my-rescue_CD0E8avgp0XVzb', // £50
    nonMember: 'https://monzo.com/pay/r/raising-my-rescue_wuOqWmgMVfXyXJ' // £60
  },
  'Training - 30mins': {
    member: 'https://monzo.com/pay/r/raising-my-rescue_OcPJIbmUDWIB35' // £25 (member only)
  },
  'Training - The Mount': {
    member: 'https://monzo.com/pay/r/raising-my-rescue_CD0E8avgp0XVzb', // £50 (same as Training - 1hr)
    nonMember: 'https://monzo.com/pay/r/raising-my-rescue_wuOqWmgMVfXyXJ' // £60 (same as Training - 1hr)
  },

  // Behaviour Sessions - Online
  'Online': {
    initial: {
      member: 'https://monzo.com/pay/r/raising-my-rescue_I7AqUSeZQbgNpU', // £70
      nonMember: 'https://monzo.com/pay/r/raising-my-rescue_Am7yZWRLFk1ufY' // £90
    },
    followUp: {
      member: 'https://monzo.com/pay/r/raising-my-rescue_xAWuI2E1p0AY60', // £50
      nonMember: 'https://monzo.com/pay/r/raising-my-rescue_xbAVpN78tyrAqx' // £70
    }
  },

  // Behaviour Sessions - In-Person (with travel zones)
  'In-Person': {
    initial: {
      member: {
        noTravel: 'https://monzo.com/pay/r/raising-my-rescue_jeciINNanZa6Jb', // £100
        'Zone 1': 'https://monzo.com/pay/r/raising-my-rescue_f24YjGV924ameM', // £105
        'Zone 2': 'https://monzo.com/pay/r/raising-my-rescue_8IIsaSrhGfkzeU', // £110
        'Zone 3': 'https://monzo.com/pay/r/raising-my-rescue_AhsrTgzJJUGJrj', // £115
        'Zone 4': 'https://monzo.com/pay/r/raising-my-rescue_uxf7CjVINRFb5y'  // £120
      },
      nonMember: {
        noTravel: 'https://monzo.com/pay/r/raising-my-rescue_NeK3tmBTbWfkGL', // £120
        'Zone 1': 'https://monzo.com/pay/r/raising-my-rescue_8mYRniCITu1VoE', // £125
        'Zone 2': 'https://monzo.com/pay/r/raising-my-rescue_bG2TYr3be3aQnh', // £130
        'Zone 3': 'https://monzo.com/pay/r/raising-my-rescue_0Gz6WQ4KBf9R7a', // £135
        'Zone 4': 'https://monzo.com/pay/r/raising-my-rescue_MMDGv68J0qKaGp'  // £140
      }
    },
    followUp: {
      member: {
        noTravel: 'https://monzo.com/pay/r/raising-my-rescue_WbWUPURQP5RzRU', // £75
        'Zone 1': 'https://monzo.com/pay/r/raising-my-rescue_PyyJFf8gHUbD1D', // £80
        'Zone 2': 'https://monzo.com/pay/r/raising-my-rescue_UeeFxD417lziJb', // £85
        'Zone 3': 'https://monzo.com/pay/r/raising-my-rescue_ux78kokFu5N2l8', // £90
        'Zone 4': 'https://monzo.com/pay/r/raising-my-rescue_K5pM3oMUja8lH4'  // £95
      },
      nonMember: {
        noTravel: 'https://monzo.com/pay/r/raising-my-rescue_5y6zaZvHsnhMcq', // £95
        'Zone 1': 'https://monzo.com/pay/r/raising-my-rescue_nDfBqrMhHeorb6', // £100
        'Zone 2': 'https://monzo.com/pay/r/raising-my-rescue_XbPHTgZz2IJHZx', // £105
        'Zone 3': 'https://monzo.com/pay/r/raising-my-rescue_rqHTocDixFMxOs', // £110
        'Zone 4': 'https://monzo.com/pay/r/raising-my-rescue_TgnwVVSlg0prRV'  // £115
      }
    }
  }
} as const;

const PAYMENT_CONFIG: PaymentLinkConfig = {
  appBaseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://rmrcms.vercel.app'
};

export const paymentService = {
  /**
   * Generate a payment link for a session
   * @param session - The session to generate payment for
   * @param client - The client information (to determine member status)
   * @returns Payment link with session ID and confirmation redirect
   */
  generatePaymentLink(session: Session, client: Client): string {
    const isMember = client.membership;
    const isFirstSession = session.sessionNumber === 1;
    const travelZone = session.travelExpense;

    let baseMonzoLink: string;

    // Select the appropriate payment link based on session type
    switch (session.sessionType) {
      case 'Online Catchup':
        baseMonzoLink = PAYMENT_LINKS['Online Catchup'];
        break;

      case 'Training - 1hr':
        baseMonzoLink = isMember
          ? PAYMENT_LINKS['Training - 1hr'].member
          : PAYMENT_LINKS['Training - 1hr'].nonMember;
        break;

      case 'Training - 30mins':
        // Only offered to members
        baseMonzoLink = PAYMENT_LINKS['Training - 30mins'].member;
        break;

      case 'Training - The Mount':
        baseMonzoLink = isMember
          ? PAYMENT_LINKS['Training - The Mount'].member
          : PAYMENT_LINKS['Training - The Mount'].nonMember;
        break;

      case 'Online':
        // Behaviour sessions - Online
        const onlineCategory = isFirstSession ? 'initial' : 'followUp';
        baseMonzoLink = isMember
          ? PAYMENT_LINKS['Online'][onlineCategory].member
          : PAYMENT_LINKS['Online'][onlineCategory].nonMember;
        break;

      case 'In-Person':
        // Behaviour sessions - In-Person (with travel zones)
        const inPersonCategory = isFirstSession ? 'initial' : 'followUp';
        const membershipType = isMember ? 'member' : 'nonMember';
        const travelKey = travelZone || 'noTravel';

        baseMonzoLink = PAYMENT_LINKS['In-Person'][inPersonCategory][membershipType][travelKey];
        break;

      default:
        // Fallback for other session types (Group, RMR Live, Phone Call, Coaching)
        console.warn(`No specific payment link configured for session type: ${session.sessionType}, using Online Catchup link`);
        baseMonzoLink = PAYMENT_LINKS['Online Catchup'];
        break;
    }

    // Create a shorter, more reliable confirmation URL using query parameters
    const confirmationUrl = `${PAYMENT_CONFIG.appBaseUrl}/pay-confirm?id=${session.id}`;

    // Create a description that includes the session ID for reference
    const description = `RMR-${session.sessionType}-${session.id}`;

    // Build the Monzo payment link with parameters
    const paymentUrl = new URL(baseMonzoLink);
    paymentUrl.searchParams.set('description', description);
    paymentUrl.searchParams.set('redirect_url', confirmationUrl);

    return paymentUrl.toString();
  },

  /**
   * Generate payment instructions text for sending to clients
   * @param session - The session to generate payment for
   * @param client - The client information
   * @returns Formatted payment instructions
   */
  generatePaymentInstructions(session: Session, client: Client): string {
    const paymentLink = this.generatePaymentLink(session, client);
    const sessionDate = new Date(session.bookingDate).toLocaleDateString('en-GB');
    const membershipStatus = client.membership ? 'Member' : 'Non-Member';
    
    return `Hi ${client.firstName},

Thank you for booking your ${session.sessionType} session for ${sessionDate} at ${session.bookingTime}.

Payment Details:
- Session Type: ${session.sessionType}
- Date: ${sessionDate}
- Time: ${session.bookingTime}
- Amount: £${session.quote.toFixed(2)} (${membershipStatus} Rate)

Please complete your payment using this secure link:
${paymentLink}

After payment, you'll be automatically redirected to a confirmation page. If you have any issues with the payment link, please let me know.

Looking forward to working with you and ${client.dogName || 'your dog'}!

Best regards,
Raising My Rescue`;
  },

  /**
   * Generate a simple payment link for quick copying
   * @param session - The session to generate payment for
   * @param client - The client information
   * @returns Just the payment URL
   */
  getPaymentUrl(session: Session, client: Client): string {
    return this.generatePaymentLink(session, client);
  },

  /**
   * Get current payment configuration
   * @returns Current payment configuration
   */
  getConfig(): PaymentLinkConfig {
    return { ...PAYMENT_CONFIG };
  },

  /**
   * Get the base Monzo link without parameters (for display purposes)
   * @param session - The session to get the link for
   * @param client - The client information
   * @returns Base Monzo payment link
   */
  getBasePaymentLink(session: Session, client: Client): string {
    const fullLink = this.generatePaymentLink(session, client);
    const url = new URL(fullLink);
    return `${url.origin}${url.pathname}`;
  }
};

import { Session, Client } from '@/types';

export interface PaymentLinkConfig {
  appBaseUrl: string;
  monzoLinks: {
    [key: string]: {
      member: string;
      nonMember: string;
    };
  };
}

// Your specific Monzo payment links for different session types
const PAYMENT_CONFIG: PaymentLinkConfig = {
  appBaseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://rmrcms.vercel.app',
  monzoLinks: {
    'Online Catchup': {
      member: 'https://monzo.com/pay/r/raising-my-rescue_qeDXP5wJpnqGln',
      nonMember: 'https://monzo.com/pay/r/raising-my-rescue_qeDXP5wJpnqGln'
    },
    'Online': {
      member: 'https://monzo.com/pay/r/raising-my-rescue_xzbkQ7E0rYwzSC',
      nonMember: 'https://monzo.com/pay/r/raising-my-rescue_EuzQch7MSdKgHU'
    },
    'In-Person': {
      member: 'https://monzo.com/pay/r/raising-my-rescue_xWkrcsYtpvgugM',
      nonMember: 'https://monzo.com/pay/r/raising-my-rescue_FDv49vPml3pICf'
    },
    'Training - 1hr': {
      member: 'https://monzo.com/pay/r/raising-my-rescue_CD0E8avgp0XVzb', // £50 for members
      nonMember: 'https://monzo.com/pay/r/raising-my-rescue_wuOqWmgMVfXyXJ' // £60 for non-members
    },
    'Training - 30mins': {
      member: 'https://monzo.com/pay/r/raising-my-rescue_qeDXP5wJpnqGln', // Using Online Catchup link (£30) as placeholder for £25
      nonMember: 'https://monzo.com/pay/r/raising-my-rescue_qeDXP5wJpnqGln' // Same link for both since price is fixed at £25
    },
    'Training - The Mount': {
      member: 'https://monzo.com/pay/r/raising-my-rescue_CD0E8avgp0XVzb', // £50 for members (same as Training - 1hr)
      nonMember: 'https://monzo.com/pay/r/raising-my-rescue_wuOqWmgMVfXyXJ' // £60 for non-members (same as Training - 1hr)
    },
    // Fallback for other session types - use Online rates
    'Group': {
      member: 'https://monzo.com/pay/r/raising-my-rescue_xzbkQ7E0rYwzSC',
      nonMember: 'https://monzo.com/pay/r/raising-my-rescue_EuzQch7MSdKgHU'
    },
    'Phone Call': {
      member: 'https://monzo.com/pay/r/raising-my-rescue_xzbkQ7E0rYwzSC',
      nonMember: 'https://monzo.com/pay/r/raising-my-rescue_EuzQch7MSdKgHU'
    },
    'Coaching': {
      member: 'https://monzo.com/pay/r/raising-my-rescue_xzbkQ7E0rYwzSC',
      nonMember: 'https://monzo.com/pay/r/raising-my-rescue_EuzQch7MSdKgHU'
    }
  }
};

export const paymentService = {
  /**
   * Generate a payment link for a session
   * @param session - The session to generate payment for
   * @param client - The client information (to determine member status)
   * @returns Payment link with session ID and confirmation redirect
   */
  generatePaymentLink(session: Session, client: Client): string {
    // Get the appropriate Monzo link based on session type and membership
    let sessionTypeLinks = PAYMENT_CONFIG.monzoLinks[session.sessionType];

    // Fallback to Online rates if session type not found
    if (!sessionTypeLinks) {
      console.warn(`No payment link configured for session type: ${session.sessionType}, using Online rates`);
      sessionTypeLinks = PAYMENT_CONFIG.monzoLinks['Online'];
    }

    const baseMonzoLink = client.membership
      ? sessionTypeLinks.member
      : sessionTypeLinks.nonMember;

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
   * Update payment configuration
   * @param config - New payment configuration
   */
  updateConfig(config: Partial<PaymentLinkConfig>): void {
    Object.assign(PAYMENT_CONFIG, config);
  },

  /**
   * Get current payment configuration
   * @returns Current payment configuration
   */
  getConfig(): PaymentLinkConfig {
    return { ...PAYMENT_CONFIG };
  }
};

import { Session, Client } from '@/types';

export interface PaymentLinkConfig {
  memberMonzoLink: string;
  nonMemberMonzoLink: string;
  appBaseUrl: string;
}

// You can configure these URLs in your environment or directly here
const PAYMENT_CONFIG: PaymentLinkConfig = {
  // Replace these with your actual Monzo payment links
  memberMonzoLink: 'https://monzo.me/your-member-link',
  nonMemberMonzoLink: 'https://monzo.me/your-non-member-link',
  appBaseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://your-app-domain.com'
};

export const paymentService = {
  /**
   * Generate a payment link for a session
   * @param session - The session to generate payment for
   * @param client - The client information (to determine member status)
   * @returns Payment link with session ID and confirmation redirect
   */
  generatePaymentLink(session: Session, client: Client): string {
    const baseMonzoLink = client.membership 
      ? PAYMENT_CONFIG.memberMonzoLink 
      : PAYMENT_CONFIG.nonMemberMonzoLink;
    
    // Create the confirmation URL that the client will visit after payment
    const confirmationUrl = `${PAYMENT_CONFIG.appBaseUrl}/payment-confirmed/${session.id}`;
    
    // Create a description that includes the session ID for reference
    const description = `RMR-${session.sessionType}-${session.id.substring(0, 8)}`;
    
    // Build the Monzo payment link with parameters
    const paymentUrl = new URL(baseMonzoLink);
    paymentUrl.searchParams.set('amount', (session.quote * 100).toString()); // Monzo expects pence
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

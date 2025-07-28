import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, email } = body;

    // Comprehensive validation to prevent blank/empty webhook data
    const isValidString = (value: any): boolean => {
      return value && typeof value === 'string' && value.trim().length > 0;
    };

    const isValidEmail = (email: any): boolean => {
      return isValidString(email) && email.includes('@') && email.includes('.') && email.length >= 5;
    };

    // Validate required fields with strict checks
    if (!isValidString(firstName) || !isValidEmail(email)) {
      console.error('Invalid booking terms update data:', { firstName, email });
      return NextResponse.json(
        { error: 'First name and valid email are required' },
        { status: 400 }
      );
    }

    // Additional validation for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.error('Invalid email format:', email);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Prepare data for Make.com webhook
    const webhookData = {
      firstName: firstName.trim(),
      email: email.toLowerCase().trim(),
      bookingTermsUrl: `https://rmrcms.vercel.app/booking-terms?email=${encodeURIComponent(email.toLowerCase().trim())}&update=true`,
      sentAt: new Date().toISOString()
    };

    // Final validation to prevent blank/empty webhook data
    if (!isValidString(webhookData.firstName) ||
        !isValidEmail(webhookData.email) ||
        !isValidString(webhookData.bookingTermsUrl) ||
        !isValidString(webhookData.sentAt)) {
      console.error('Invalid webhook data prepared:', webhookData);
      return NextResponse.json(
        { error: 'Invalid webhook data prepared - missing required fields' },
        { status: 400 }
      );
    }

    // Validate URL format
    if (!webhookData.bookingTermsUrl.startsWith('https://') || webhookData.bookingTermsUrl.length < 20) {
      console.error('Invalid booking terms URL:', webhookData.bookingTermsUrl);
      return NextResponse.json(
        { error: 'Invalid booking terms URL generated' },
        { status: 400 }
      );
    }

    // Log the webhook data being sent for debugging
    console.log('Sending booking terms update webhook:', {
      firstName: webhookData.firstName,
      email: webhookData.email,
      urlLength: webhookData.bookingTermsUrl.length,
      sentAt: webhookData.sentAt
    });

    // Send to Make.com webhook for booking terms update email
    const response = await fetch('https://hook.eu1.make.com/99iuq4uahpq22v5vf3mmyeokgod4qex8', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Make.com webhook failed:', {
        status: response.status,
        response: errorText,
        webhookData: webhookData
      });
      return NextResponse.json(
        {
          error: 'Failed to send booking terms update email',
          details: `Make.com webhook failed with status ${response.status}`,
          makeComResponse: errorText
        },
        { status: 500 }
      );
    }

    const responseData = await response.text();

    return NextResponse.json({
      success: true,
      message: 'Booking terms update email sent successfully',
      makeComResponse: responseData,
      webhookData: {
        firstName: webhookData.firstName,
        email: webhookData.email,
        bookingTermsUrl: webhookData.bookingTermsUrl,
        sentAt: webhookData.sentAt
      }
    });

  } catch (error) {
    console.error('Error sending booking terms update email:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { message: 'Booking terms update endpoint - POST only' },
    { status: 405 }
  );
}

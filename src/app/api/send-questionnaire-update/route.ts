import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, email } = body;

    const isValidString = (value: any): boolean =>
      value && typeof value === 'string' && value.trim().length > 0;

    const isValidEmail = (value: any): boolean =>
      isValidString(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

    if (!isValidString(firstName) || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'First name and valid email are required' },
        { status: 400 }
      );
    }

    const webhookData = {
      firstName: firstName.trim(),
      email: email.toLowerCase().trim(),
      questionnaireUrl: `https://rmrcms.vercel.app/behaviour-questionnaire?email=${encodeURIComponent(email.toLowerCase().trim())}`,
      sentAt: new Date().toISOString()
    };

    const response = await fetch(process.env.NEXT_PUBLIC_MAKE_WEBHOOK_QUESTIONNAIRE_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to send questionnaire email', details: errorText },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Questionnaire email sent successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Send questionnaire update endpoint - POST only' },
    { status: 405 }
  );
}

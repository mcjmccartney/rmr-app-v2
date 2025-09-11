import { NextRequest, NextResponse } from 'next/server';
import { clientService } from '@/services/clientService';

export async function POST(request: NextRequest) {
  try {
    console.log('Manual address population triggered');
    
    const { clientId } = await request.json().catch(() => ({}));

    if (clientId) {
      // Populate single client
      const result = await clientService.populateAddressFromQuestionnaire(clientId);
      
      return NextResponse.json({
        success: true,
        message: result?.address ? 'Address populated successfully' : 'No address to populate',
        client: result ? {
          id: result.id,
          name: `${result.firstName} ${result.lastName}`,
          address: result.address
        } : null
      });
      
    } else {
      // Bulk populate all clients
      const results = await clientService.bulkPopulateAddressesFromQuestionnaires();
      
      return NextResponse.json({
        success: true,
        message: 'Bulk address population completed',
        results
      });
    }

  } catch (error) {
    console.error('Error in address population API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Address population failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Address Population API',
    endpoints: {
      'POST /api/populate-addresses': 'Bulk populate all clients with blank addresses',
      'POST /api/populate-addresses (with clientId)': 'Populate single client address'
    },
    usage: {
      bulk: 'POST /api/populate-addresses (empty body)',
      single: 'POST /api/populate-addresses {"clientId": "uuid"}'
    }
  });
}

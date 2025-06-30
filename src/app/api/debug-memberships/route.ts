import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug memberships API called');

    // First, let's check what columns exist in the memberships table
    const { data: tableInfo, error: tableError } = await supabase
      .from('memberships')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('Error querying memberships table:', tableError);
      return NextResponse.json({
        error: 'Failed to query memberships table',
        details: tableError,
        suggestion: 'The memberships table might not exist or have different column names'
      }, { status: 400 });
    }

    // Get all memberships to see the structure
    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('*')
      .limit(10);

    if (membershipsError) {
      console.error('Error fetching memberships:', membershipsError);
      return NextResponse.json({
        error: 'Failed to fetch memberships',
        details: membershipsError
      }, { status: 500 });
    }

    // Get table schema information
    const { data: schemaInfo, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'memberships' })
      .single();

    return NextResponse.json({
      message: 'Memberships debug info',
      tableExists: !tableError,
      sampleData: memberships || [],
      dataCount: memberships?.length || 0,
      sampleColumns: memberships && memberships.length > 0 ? Object.keys(memberships[0]) : [],
      schemaInfo: schemaInfo || 'Schema info not available',
      schemaError: schemaError || null
    });

  } catch (error) {
    console.error('Error debugging memberships:', error);
    return NextResponse.json({
      error: 'Failed to debug memberships',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

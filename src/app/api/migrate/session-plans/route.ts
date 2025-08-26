import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'Automatic migration not available',
    message: 'Please run the migration manually in your Supabase dashboard',
    instructions: {
      step1: 'Go to your Supabase dashboard',
      step2: 'Navigate to SQL Editor',
      step3: 'Run this SQL command:',
      sql: 'ALTER TABLE session_plans ADD COLUMN IF NOT EXISTS edited_action_points JSONB;',
      step4: 'The feature will work immediately after running this command'
    }
  }, { status: 200 });
}

// GET endpoint to check if migration is needed
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Try to query the session_plans table to see if the column exists
    const { data, error } = await supabaseAdmin
      .from('session_plans')
      .select('edited_action_points')
      .limit(1);

    if (error) {
      // If error mentions the column doesn't exist, migration is needed
      if (error.message.includes('edited_action_points') ||
          error.code === '42703' ||
          error.message.includes('column') ||
          error.message.includes('does not exist')) {
        return NextResponse.json({
          migrationNeeded: true,
          columnExists: false,
          message: 'Migration needed - edited_action_points column does not exist',
          instructions: {
            step1: 'Go to your Supabase dashboard',
            step2: 'Navigate to SQL Editor',
            step3: 'Run this SQL command:',
            sql: 'ALTER TABLE session_plans ADD COLUMN IF NOT EXISTS edited_action_points JSONB;',
            step4: 'Refresh this page to verify the migration worked'
          }
        });
      }

      // If it's a permissions error, assume migration is needed
      if (error.message.includes('privileges') || error.message.includes('access')) {
        return NextResponse.json({
          migrationNeeded: true,
          columnExists: false,
          message: 'Cannot check migration status due to permissions - please run migration manually',
          permissionsIssue: true,
          instructions: {
            step1: 'Go to your Supabase dashboard',
            step2: 'Navigate to SQL Editor',
            step3: 'Run this SQL command:',
            sql: 'ALTER TABLE session_plans ADD COLUMN IF NOT EXISTS edited_action_points JSONB;',
            step4: 'The cross-device sync feature will work immediately after running this command',
            note: 'This is safe to run multiple times - it will only add the column if it doesn\'t exist'
          }
        });
      }

      return NextResponse.json(
        {
          error: 'Failed to check migration status',
          details: error.message,
          migrationNeeded: true,
          instructions: {
            step1: 'Go to your Supabase dashboard',
            step2: 'Navigate to SQL Editor',
            step3: 'Run this SQL command:',
            sql: 'ALTER TABLE session_plans ADD COLUMN IF NOT EXISTS edited_action_points JSONB;'
          }
        },
        { status: 200 } // Return 200 so the UI can still show instructions
      );
    }

    return NextResponse.json({
      migrationNeeded: false,
      columnExists: true,
      message: 'Migration already completed - edited_action_points column exists'
    });

  } catch (error) {
    return NextResponse.json({
      migrationNeeded: true,
      columnExists: false,
      message: 'Cannot verify migration status - please run migration manually',
      error: 'Failed to check migration status',
      details: error instanceof Error ? error.message : 'Unknown error',
      instructions: {
        step1: 'Go to your Supabase dashboard',
        step2: 'Navigate to SQL Editor',
        step3: 'Run this SQL command:',
        sql: 'ALTER TABLE session_plans ADD COLUMN IF NOT EXISTS edited_action_points JSONB;',
        step4: 'The feature will work immediately after running this command'
      }
    }, { status: 200 });
  }
}

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only log during runtime, not during build
if (typeof window !== 'undefined') {
  console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set');
  console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Not set');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are not set. Some features may not work.')
  }
}

// Create a safe client that handles missing environment variables
export const supabase = (() => {
  try {
    // During build time, if env vars are missing, create a dummy client
    if (!supabaseUrl || !supabaseAnonKey) {
      // Return a mock client for build time
      return createBrowserClient('https://dummy.supabase.co', 'dummy-key')
    }
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    // Return a mock client as fallback
    return createBrowserClient('https://dummy.supabase.co', 'dummy-key')
  }
})()

// Database types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          first_name: string
          last_name: string
          partner_name: string | null
          dog_name: string | null
          other_dogs: string[] | null
          phone: string | null
          email: string | null
          address: string | null
          active: boolean
          membership: boolean
          avatar: string | null
          behavioural_brief_id: string | null
          behaviour_questionnaire_id: string | null
          booking_terms_signed: boolean | null
          booking_terms_signed_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          dog_name?: string | null
          other_dogs?: string[] | null
          phone?: string | null
          email?: string | null
          address?: string | null
          active?: boolean
          membership?: boolean
          avatar?: string | null
          behavioural_brief_id?: string | null
          behaviour_questionnaire_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          dog_name?: string | null
          other_dogs?: string[] | null
          phone?: string | null
          email?: string | null
          address?: string | null
          active?: boolean
          membership?: boolean
          avatar?: string | null
          behavioural_brief_id?: string | null
          behaviour_questionnaire_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          client_id: string
          session_type: 'In-Person' | 'Online' | 'Training' | 'Online Catchup' | 'Group' | 'Phone Call' | 'Coaching'
          booking_date: string
          booking_time: string
          notes: string | null
          quote: number
          email: string | null
          session_paid: boolean
          payment_confirmed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          session_type: 'In-Person' | 'Online' | 'Training' | 'Online Catchup' | 'Group' | 'Phone Call' | 'Coaching'
          booking_date: string
          booking_time: string
          notes?: string | null
          quote: number
          email?: string | null
          session_paid?: boolean
          payment_confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          session_type?: 'In-Person' | 'Online' | 'Training' | 'Online Catchup' | 'Group' | 'Phone Call' | 'Coaching'
          booking_date?: string
          booking_time?: string
          notes?: string | null
          quote?: number
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      session_plans: {
        Row: {
          id: string
          session_id: string
          session_number: number
          main_goal_1: string | null
          main_goal_2: string | null
          main_goal_3: string | null
          main_goal_4: string | null
          explanation_of_behaviour: string | null
          action_points: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          session_number?: number
          main_goal_1?: string | null
          main_goal_2?: string | null
          main_goal_3?: string | null
          main_goal_4?: string | null
          explanation_of_behaviour?: string | null
          action_points?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          session_number?: number
          main_goal_1?: string | null
          main_goal_2?: string | null
          main_goal_3?: string | null
          main_goal_4?: string | null
          explanation_of_behaviour?: string | null
          action_points?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      action_points: {
        Row: {
          id: string
          header: string
          details: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          header: string
          details: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          header?: string
          details?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

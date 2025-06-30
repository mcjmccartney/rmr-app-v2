# Supabase Setup Instructions

## 🎯 Overview
Your Raising My Rescue app is now configured to use Supabase for the **Clients** and **Sessions** tables. This guide will help you set up your Supabase database.

## 📋 Prerequisites
- A Supabase account (free tier available at [supabase.com](https://supabase.com))

## 🚀 Setup Steps

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `raising-my-rescue` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
5. Click "Create new project"
6. Wait for the project to be created (takes ~2 minutes)

### 2. Get Your Project Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Configure Environment Variables
1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-actual-anon-key
```

### 4. Create Database Tables
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of the `supabase-schema.sql` file
3. Paste it into the SQL Editor
4. Click **Run** to execute the SQL

This will create:
- `clients` table with all necessary columns
- `sessions` table with foreign key to clients
- Proper indexes for performance
- Row Level Security policies
- Sample data (optional - you can remove the INSERT statements if you want to start fresh)

### 5. Verify Setup
1. Go to **Table Editor** in your Supabase dashboard
2. You should see two tables: `clients` and `sessions`
3. If you included the sample data, you should see some test records

### 6. Test the Application
1. Restart your development server: `npm run dev`
2. The app should now load clients and sessions from Supabase
3. Try creating a new client or session to test the integration

## 🔧 What's Connected

### ✅ **Connected to Supabase:**
- **Clients table**: Full CRUD operations
- **Sessions table**: Full CRUD operations
- **Behavioural Brief form**: Creates clients in Supabase
- **Behaviour Questionnaire form**: Creates/updates clients in Supabase
- **Session management**: All session operations use Supabase

### ⏳ **Still using local state:**
- **Behavioural Briefs**: Stored locally (not in Supabase yet)
- **Behaviour Questionnaires**: Stored locally (not in Supabase yet)
- **Finance data**: Using mock data (not in Supabase yet)

## 🛠️ Database Schema

### Clients Table
- `id` (UUID, Primary Key)
- `first_name`, `last_name`, `dog_name` (Required)
- `other_dogs` (Array of strings)
- `phone`, `email`, `address` (Optional)
- `active`, `membership` (Booleans)
- `avatar` (For storing initials like 'RMR')
- `behavioural_brief_id`, `behaviour_questionnaire_id` (References)
- `created_at`, `updated_at` (Timestamps)

### Sessions Table
- `id` (UUID, Primary Key)
- `client_id` (Foreign Key to clients)
- `session_type` (Enum: In-Person, Online, Training, etc.)
- `booking_date` (Timestamp)
- `notes` (Text, Optional)
- `quote` (Decimal)
- `created_at`, `updated_at` (Timestamps)

## 🔒 Security
- Row Level Security (RLS) is enabled
- Current policies allow all operations (you can restrict this later)
- All data is stored securely in Supabase

## 🐛 Troubleshooting

### "Failed to load clients/sessions"
- Check your environment variables are correct
- Verify your Supabase project is active
- Check the browser console for detailed error messages

### "Database connection error"
- Ensure your Supabase project URL and API key are correct
- Check that the tables were created successfully

### "No data showing"
- If you removed the sample data, the tables will be empty initially
- Try creating a new client or session to test

## 📞 Support
If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase dashboard shows the tables correctly
3. Ensure environment variables are set properly

Your app is now ready to use Supabase for persistent data storage! 🎉

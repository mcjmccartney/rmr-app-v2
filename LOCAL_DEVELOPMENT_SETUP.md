# Local Development Setup Guide

This guide will help you set up the RMR App v2 for local development and testing.

## Prerequisites

Before you begin, make sure you have the following installed:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** or **pnpm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Git** (for version control)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

## Setup Steps

### 1. Clone or Navigate to the Repository

You already have the code at:
```bash
cd /Users/matthewmccartney/Downloads/rmr-app-v2-main-2
```

### 2. Install Dependencies

Run one of the following commands in the project directory:

```bash
# Using npm
npm install

# OR using pnpm (faster)
pnpm install
```

This will install all the required packages listed in `package.json`.

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory with your environment variables:

```bash
# Copy the example env file (if it exists)
cp .env.example .env.local

# OR create a new one
touch .env.local
```

Add the following variables to `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Base URL (for local development)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional: For PDF generation in production
VERCEL_ENV=development
```

**Note:** You'll need to get the Supabase credentials from your Supabase project dashboard.

### 4. Start the Development Server

```bash
# Using npm
npm run dev

# OR using pnpm
pnpm dev
```

The app will start at: **http://localhost:3000**

### 5. Access the Session Plan Preview

To test the session plan preview locally, navigate to:

```
http://localhost:3000/session-plan-preview/[sessionId]
```

Replace `[sessionId]` with an actual session ID from your database.

## Development Workflow

### Making Changes

1. **Edit files** in your code editor (VS Code, etc.)
2. **Save the file** - Next.js will automatically reload the page (Hot Module Replacement)
3. **View changes** in your browser at http://localhost:3000

### Testing PDF Generation Locally

The PDF generation uses Puppeteer, which works differently in local vs production:

- **Local:** Uses your system's Chrome/Chromium browser
- **Production (Vercel):** Uses @sparticuz/chromium-min

To test PDF generation locally:

1. Make sure you have Chrome or Chromium installed
2. Click the "Generate PDF & Send Email" button in the preview
3. The API route will use your local Chrome to generate the PDF

### Viewing the Preview Without PDF Generation

Add `?playwright=true` to the URL to see the preview in "Playwright mode":

```
http://localhost:3000/session-plan-preview/[sessionId]?playwright=true
```

This hides the "Generate PDF" button and shows the page as it will appear in the PDF.

## Useful Commands

```bash
# Start development server
npm run dev

# Build for production (test if your changes build correctly)
npm run build

# Start production server locally (after build)
npm start

# Run linting
npm run lint

# Type checking (if using TypeScript)
npx tsc --noEmit
```

## Project Structure

```
rmr-app-v2-main-2/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── session-plan-preview/     # Session plan preview page
│   │   ├── api/                      # API routes
│   │   └── globals.css               # Global styles
│   ├── components/                   # React components
│   ├── context/                      # React context providers
│   ├── data/                         # Static data
│   ├── services/                     # Service functions
│   ├── types/                        # TypeScript types
│   └── utils/                        # Utility functions
├── public/                           # Static assets
├── .env.local                        # Local environment variables (create this)
├── package.json                      # Dependencies and scripts
└── next.config.ts                    # Next.js configuration
```

## Troubleshooting

### Port 3000 is already in use

If port 3000 is already in use, you can:

1. Kill the process using port 3000
2. Or use a different port:
   ```bash
   npm run dev -- -p 3001
   ```

### Module not found errors

Run:
```bash
npm install
# or
pnpm install
```

### Supabase connection errors

Make sure your `.env.local` file has the correct Supabase credentials.

### PDF generation fails locally

Make sure you have Chrome or Chromium installed on your system.

## Next Steps

Once your local environment is running:

1. ✅ Make your changes to the code
2. ✅ Test in the browser at http://localhost:3000
3. ✅ Test PDF generation
4. ✅ Commit your changes: `git add -A && git commit -m "Your message"`
5. ✅ Push to GitHub: `git push`
6. ✅ Vercel will automatically deploy your changes

## Need Help?

- Check the Next.js documentation: https://nextjs.org/docs
- Check the Supabase documentation: https://supabase.com/docs
- Review the existing code for examples

Happy coding! 🚀


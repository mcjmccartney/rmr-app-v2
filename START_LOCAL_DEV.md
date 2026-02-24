# Quick Start - Local Development

## ✅ You're Already Set Up!

Good news! Your environment is already configured:
- ✅ Node.js v24.6.0 installed
- ✅ npm v11.5.1 installed
- ✅ `.env.local` file configured with Supabase credentials
- ✅ Dependencies installed (node_modules exists)

## 🚀 Start Developing in 3 Steps

### 1. Open Terminal in Project Directory

```bash
cd /Users/matthewmccartney/Downloads/rmr-app-v2-main-2
```

### 2. Start the Development Server

```bash
npm run dev
```

You should see output like:
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
- Ready in 2.5s
```

### 3. Open Your Browser

Navigate to: **http://localhost:3000**

## 🎯 Testing the Session Plan Preview

### View a Session Plan Preview

```
http://localhost:3000/session-plan-preview/[sessionId]
```

Replace `[sessionId]` with an actual session ID from your database.

Example:
```
http://localhost:3000/session-plan-preview/ea0108f0-600e-4dfa-bbc9-6774acb3b0d2
```

### View in Playwright Mode (PDF Preview)

Add `?playwright=true` to see how it will look in the PDF:

```
http://localhost:3000/session-plan-preview/ea0108f0-600e-4dfa-bbc9-6774acb3b0d2?playwright=true
```

## 📝 Making Changes

### Edit the Session Plan Preview

The main file you'll be editing is:
```
src/app/session-plan-preview/[sessionId]/page.tsx
```

### How to Edit:

1. **Open the file** in your code editor (VS Code, etc.)
2. **Make your changes**
3. **Save the file** (Cmd+S / Ctrl+S)
4. **Refresh your browser** - Next.js will automatically reload!

### Example: Change the Reminder Position

Find this section around line 285:

```typescript
{showReminderOnThisPage && (
  <div
    style={{
      position: 'absolute',
      bottom: '93px',  // ← Change this value to adjust position
      left: '3.4rem',
      right: '3.4rem',
      fontSize: '15px',
      fontFamily: 'Arial, sans-serif'
    }}
  >
```

Change `bottom: '93px'` to a different value, save, and see the change instantly!

## 🔧 Common Tasks

### Stop the Development Server

Press `Ctrl+C` in the terminal where `npm run dev` is running.

### Restart the Development Server

```bash
npm run dev
```

### Install New Dependencies

```bash
npm install package-name
```

### Check for Errors

Look at the terminal where `npm run dev` is running - errors will appear there.

## 📂 Key Files for Session Plan Preview

```
src/app/session-plan-preview/[sessionId]/
├── page.tsx                    # Main preview component
│   ├── DynamicActionPointPages # Pagination logic (lines 26-362)
│   └── SessionPlanPreviewPage  # Main page component (lines 369+)
│
src/app/globals.css             # Global styles including @page rules
│
src/app/api/generate-session-plan-pdf/
└── route.ts                    # PDF generation API endpoint
```

## 🎨 Styling

### Inline Styles

Most styles in the session plan preview are inline (in the JSX):

```typescript
<div style={{ fontSize: '15px', marginBottom: '1rem' }}>
```

### Global Styles

Page-level styles are in the `<style>` tag (lines 523-607 in page.tsx):

```typescript
<style>{`
  .page {
    width: 210mm;
    height: 297mm;
    ...
  }
`}</style>
```

## 🐛 Troubleshooting

### "Port 3000 is already in use"

Use a different port:
```bash
npm run dev -- -p 3001
```

Then visit: http://localhost:3001

### Changes Not Showing Up

1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Clear browser cache
3. Restart the dev server (`Ctrl+C` then `npm run dev`)

### TypeScript Errors

Check the terminal for error messages. Common fixes:
- Make sure all imports are correct
- Check for typos in variable names
- Ensure types match

## 📤 Deploying Your Changes

Once you're happy with your changes:

```bash
# 1. Stage your changes
git add -A

# 2. Commit with a message
git commit -m "Description of your changes"

# 3. Push to GitHub
git push

# 4. Vercel will automatically deploy!
```

Check deployment status at: https://vercel.com/

## 💡 Pro Tips

1. **Keep the terminal visible** - errors and logs appear there
2. **Use browser DevTools** - Right-click → Inspect to debug
3. **Test in multiple browsers** - Chrome, Safari, Firefox
4. **Test PDF generation** - Click the "Generate PDF" button to test the full flow
5. **Check console logs** - Look for `console.log()` output in browser DevTools

## 🆘 Need Help?

- **Next.js Docs:** https://nextjs.org/docs
- **React Docs:** https://react.dev/
- **Supabase Docs:** https://supabase.com/docs
- **Check the terminal** for error messages
- **Check browser console** (F12) for JavaScript errors

---

**You're all set! Happy coding! 🎉**

Start with: `npm run dev`


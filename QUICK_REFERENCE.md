# Quick Reference Card

## 🚀 Start/Stop Development Server

```bash
# Start
npm run dev

# Stop
Ctrl+C (in terminal)

# Use different port
npm run dev -- -p 3001
```

## 🌐 URLs

```bash
# Home
http://localhost:3000

# Session Plan Preview
http://localhost:3000/session-plan-preview/[sessionId]

# Playwright Mode (PDF Preview)
http://localhost:3000/session-plan-preview/[sessionId]?playwright=true

# Example Session ID
http://localhost:3000/session-plan-preview/ea0108f0-600e-4dfa-bbc9-6774acb3b0d2
```

## 📂 Key Files

```bash
# Session Plan Preview Component
src/app/session-plan-preview/[sessionId]/page.tsx

# PDF Generation API
src/app/api/generate-session-plan-pdf/route.ts

# Global Styles
src/app/globals.css

# Environment Variables
.env.local
```

## 🎯 Reminder Section Location

**File:** `src/app/session-plan-preview/[sessionId]/page.tsx`

**Line:** ~285

```typescript
{showReminderOnThisPage && (
  <div style={{
    position: 'absolute',
    bottom: '93px',      // ← Footer spacing
    left: '3.4rem',      // ← Left padding
    right: '3.4rem',     // ← Right padding
    fontSize: '15px',
    fontFamily: 'Arial, sans-serif'
  }}>
```

## 🔧 Common Edits

### Change Reminder Position
```typescript
bottom: '93px'  // Current
bottom: '100px' // More space from footer
bottom: '80px'  // Less space from footer
```

### Change Reminder Padding
```typescript
left: '3.4rem',   // Current
right: '3.4rem',  // Current
```

### Change Font Size
```typescript
fontSize: '15px'  // Current
fontSize: '16px'  // Larger
fontSize: '14px'  // Smaller
```

## 📏 Page Dimensions

```typescript
// A4 Page
width: 210mm
height: 297mm

// In pixels
PAGE_HEIGHT = 297 * 3.78 = ~1122px

// Content Areas
CONTENT_MAX_MIDDLE = PAGE_HEIGHT - 226  // ~896px
CONTENT_MAX_FINAL = PAGE_HEIGHT - 62.66 // ~1060px
```

## 🎨 Styling

### Inline Styles (in JSX)
```typescript
<div style={{ fontSize: '15px', marginBottom: '1rem' }}>
```

### Page Styles (in <style> tag)
```typescript
<style>{`
  .page { width: 210mm; height: 297mm; }
  .page-content { padding: 20px 3.4rem 0 3.4rem; }
`}</style>
```

## 🔄 Git Commands

```bash
# Check status
git status

# Stage all changes
git add -A

# Commit
git commit -m "Your message"

# Push to GitHub (auto-deploys to Vercel)
git push

# View recent commits
git log --oneline -5
```

## 🐛 Debug Commands

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Check running processes
lsof -ti:3000

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 🔍 Browser DevTools

```bash
# Open DevTools
F12 (Windows/Linux)
Cmd+Option+I (Mac)

# Hard Refresh
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Console
console.log('Debug message')
```

## 📊 Measurement Logic

**File:** `src/app/session-plan-preview/[sessionId]/page.tsx`
**Lines:** 49-71

```typescript
// Reminder height includes footer space
const REMINDER_HEIGHT = reminderBlock.offsetHeight + 93;

// Check if reminder fits on last page
const totalHeightWithReminder = lastPageHeight + REMINDER_HEIGHT;
const needsNewPage = totalHeightWithReminder > CONTENT_MAX_FINAL;
```

## 🎯 Testing Checklist

- [ ] Start dev server: `npm run dev`
- [ ] Open preview in browser
- [ ] Make a small change
- [ ] Save file (Cmd+S)
- [ ] Verify auto-refresh works
- [ ] Test PDF generation button
- [ ] Check Playwright mode (`?playwright=true`)
- [ ] Commit and push changes
- [ ] Verify Vercel deployment

## 📞 Environment Variables

**File:** `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
WEBHOOK_API_KEY=...
SQUARESPACE_API_KEY=...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

## 🚨 Common Errors

### Port in use
```bash
Error: listen EADDRINUSE: address already in use :::3000
Fix: lsof -ti:3000 | xargs kill -9
```

### Module not found
```bash
Error: Cannot find module 'xyz'
Fix: npm install
```

### TypeScript error
```bash
Check terminal output for specific error
Fix: Correct the type/import issue shown
```

---

**Keep this handy while developing! 📌**


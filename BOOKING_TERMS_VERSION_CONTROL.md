# Booking Terms Version Control System

## Overview

The booking terms now have a version control system that allows you to:
- Create and manage multiple versions of booking terms
- Edit existing versions
- Set which version is active (clients will sign the active version)
- Track which version each client signed

## How to Use

### 1. Access the Admin Page

Navigate to `/booking-terms-admin` in your app. Only admin users (defined in `ADMIN_EMAILS` environment variable) can access this page.

### 2. View All Versions

The admin page shows a table of all booking terms versions with:
- Version number (v1, v2, v3, etc.)
- Title
- Status (Active/Inactive)
- Last updated date
- Actions (Edit, Set Active)

### 3. Create a New Version

1. Click the **"Create New Version"** button
2. The title will be automatically set to "Booking Terms & Service Agreement"
3. Edit the content using the rich text editor
4. Preview the content below the editor
5. Click **"Save"** to create the version

**Note:** New versions are created as inactive by default. You must manually set them as active.

### 4. Edit an Existing Version

1. Click **"Edit"** next to any version
2. Modify the title and/or content
3. Preview your changes
4. Click **"Save"** to update

### 5. Set Active Version

1. Click **"Set Active"** next to the version you want clients to sign
2. Confirm the action
3. Only one version can be active at a time - setting a new version as active will deactivate all others

### 6. Client Experience

When clients visit the booking terms page (`/booking-terms?email=...`):
- They will see the currently active version
- When they sign, the system records which version they signed
- The version they signed is stored in the database for future reference

## Database Structure

### `booking_terms_versions` Table
- `id` - Unique identifier
- `version_number` - Sequential version number (1, 2, 3, etc.)
- `title` - Display title (always "Booking Terms & Service Agreement")
- `html_content` - The full HTML content of the terms
- `is_active` - Boolean indicating if this is the active version
- `created_by` - Email of admin who created it
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### `booking_terms` Table (Updated)
- `id` - Unique identifier
- `email` - Client email
- `submitted` - When they signed
- `version_id` - References which version they signed
- `created_at` - Creation timestamp

## Migration

To set up the version control system:

1. Run the migration SQL file: `migrations/20251119_add_booking_terms_versions.sql`
2. This will:
   - Create the `booking_terms_versions` table
   - Add `version_id` column to `booking_terms` table
   - Insert the current booking terms as version 1 (active)

## API Endpoints

### Admin Endpoints (Require Admin Authentication)

- `GET /api/booking-terms-versions` - Get all versions
- `POST /api/booking-terms-versions` - Create new version
- `PUT /api/booking-terms-versions` - Update existing version
- `POST /api/booking-terms-versions/set-active` - Set a version as active

### Public Endpoints

- `GET /api/booking-terms-versions/active` - Get the currently active version (used by client-facing page)
- `POST /api/booking-terms` - Submit signed booking terms (now saves version_id)
- `GET /api/booking-terms?email=...` - Check if booking terms exist for an email

## Files Changed/Created

### New Files
- `src/app/booking-terms-admin/page.tsx` - Admin management page
- `src/app/api/booking-terms-versions/route.ts` - CRUD operations for versions
- `src/app/api/booking-terms-versions/set-active/route.ts` - Set active version
- `src/app/api/booking-terms-versions/active/route.ts` - Get active version
- `migrations/20251119_add_booking_terms_versions.sql` - Database migration

### Modified Files
- `src/app/booking-terms/page.tsx` - Now loads active version dynamically
- `src/app/api/booking-terms/route.ts` - Now saves version_id when client signs
- `src/components/SafeHtmlRenderer.tsx` - Enhanced to support more HTML tags

### Files to Delete (After Migration)
- `src/app/booking-terms-v2/page.tsx` - Old v2 page (no longer needed)
- `src/app/api/booking-terms-v2/route.ts` - Old v2 API (no longer needed)

## Rich Text Editor

The admin page uses the `RichTextEditor` component which supports:
- Bold, italic, underline
- Headings (H1-H6)
- Lists (ordered and unordered)
- Text alignment
- Color and background color

All formatting is preserved when clients view the terms.

## Best Practices

1. **Test Before Activating**: Create and preview new versions before setting them as active
2. **Consistent Title**: All versions use the same title "Booking Terms & Service Agreement" for consistency
3. **Keep History**: Don't delete old versions - they're linked to client signatures
4. **Review Changes**: Always preview content before saving
5. **Communicate Changes**: Let clients know when terms have been updated

## Troubleshooting

**Q: Clients see "No booking terms available"**
- Check that at least one version is set as active
- Run the migration to create version 1

**Q: Can't access admin page**
- Verify your email is in the `ADMIN_EMAILS` environment variable
- Check you're logged in

**Q: Rich text formatting not showing**
- The `SafeHtmlRenderer` component sanitizes HTML for security
- Only safe tags and styles are allowed
- Check browser console for any errors


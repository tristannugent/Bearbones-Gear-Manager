# Bearbones Gear Manager — branded live Next.js app

This is the functional Next.js + Supabase inventory app for Bearbones Media Co, updated with your provided logos and a brand-matched monochrome theme.

## Included
- email/password authentication with Supabase
- inventory CRUD
- categories for lenses, cameras, lighting, audio, grip, props, miscellaneous
- location tracking for Office, Studio, and On Set
- status tracking for Available, Checked Out, Maintenance, and Missing
- package builder with selected gear items
- single-item and package-level checkout workflows
- return workflow
- Bearbones-branded dark UI using your actual logo files
- mobile-friendly layout
- branded app icon from the skeleton bear mark

## What is already wired
- auth screens and session guard
- live Supabase client
- SQL schema with RLS policies
- inventory, packages, and checkouts pages connected to live data when env vars are present
- demo fallback mode when Supabase is not configured
- logo assets in `public/branding`

## Setup
1. Create a new Supabase project.
2. In Supabase SQL Editor, run `supabase_schema.sql`.
3. Copy `.env.example` to `.env.local` and add your keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start locally:
   ```bash
   npm run dev
   ```
6. Deploy to Vercel and add the same environment variables.

## Branding files
Included brand assets:
- `public/branding/logo-horizontal-white.png`
- `public/branding/logo-horizontal-black.png`
- `public/branding/logo-vertical.png`
- `public/branding/bear-icon.png`
- `app/icon.png`
- `app/apple-icon.png`

Brand tokens live in:
- `lib/brand.ts`
- `app/globals.css`
- `components/logo.tsx`

## Recommended next upgrades
- user roles and crew permissions
- file uploads to Supabase storage for thumbnails
- printable PDF pull sheets
- maintenance history log
- CSV import/export
- calendar-based prep and due-back workflows

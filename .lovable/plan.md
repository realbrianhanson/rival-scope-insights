

# RivalScope — Competitive Intelligence SaaS

## Overview
A dark-themed, premium competitive intelligence command center built as a white-label template. Bloomberg Terminal meets luxury fintech aesthetic.

## Phase 1: Infrastructure & Database
- Enable Lovable Cloud (Supabase)
- Create tables with RLS policies scoped to `user_id`:
  - **profiles** — user identity, company, plan tier (linked to auth.users)
  - **app_settings** — white-label config (app name, logo, primary color)
  - **competitors** — core data entity with status, review sources
- Auto-create profile + default app_settings on signup via database trigger

## Phase 2: Design System
- Load Google Fonts: Instrument Serif, Plus Jakarta Sans, JetBrains Mono
- Implement full dark color palette (#0A0A0F deep background, #00D4AA accent, etc.)
- Light mode toggle with alternate palette (#F8F9FC background, #00B894 accent)
- Component tokens: cards with #12121A bg + hover glow, primary/secondary buttons, status badges
- Skeleton shimmer loading states, page fade-in animations with stagger, count-up number animations

## Phase 3: Authentication
- Email/password + Google OAuth signup/login
- Polished auth page: RivalScope wordmark in Instrument Serif, radial gradient mesh background, centered card form
- Password reset flow with dedicated /reset-password page
- Profile auto-creation trigger on signup

## Phase 4: App Shell & Navigation
- Collapsible sidebar (260px → 72px icon-only) with smooth 200ms transition
- Navigation items: Dashboard, Competitors, Reports, Battlecards, Market Gaps, Comparisons, Alerts, Settings
- Lucide icons, active state with left 3px #00D4AA border + glow background
- Dark/light mode toggle at sidebar bottom
- Mobile: bottom tab navigation with 5 key icons
- Logo pulls app_name from app_settings (white-label ready)

## Phase 5: Dashboard (Empty State)
- Welcome message using app name from settings
- Geometric SVG pattern background with subtle radial gradient
- "Add Competitor" primary CTA
- Page content with fade-in + slide-up animation
- All routes stubbed (Competitors, Reports, Battlecards, Market Gaps, Comparisons, Alerts, Settings)


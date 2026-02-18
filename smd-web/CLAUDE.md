# CLAUDE.md - SMDurgan Website

SMDurgan venture studio site. Professional presence for partners and clients evaluating engagement. Architecture: Astro static pages on Cloudflare Pages with minimal Pages Functions for forms.

## Build Commands

```bash
npm install
npm run dev
npm run verify
```

## Stack

- Astro 5
- Tailwind CSS v4
- Cloudflare Pages + Functions
- TypeScript strict

## Site Structure

- `/` - Homepage: founder intro, tiered venture portfolio, contact CTA
- `/contact/` - Contact form (Resend API via Cloudflare Pages Function)
- `/legal/` - Privacy and terms
- 301 redirects: `/about/`, `/operating-model/`, `/ventures/` all redirect to `/`

## Design

- Indigo/gold color palette (aligned with venturecrane.com)
- CSS custom properties in `src/styles/global.css`
- All color combinations verified WCAG AA compliant

## Content Policy

- Never use em dashes. Use hyphens in prose, pipes in title separators.
- No marketing fluff. Direct, evidence-based.
- Founder content written in third person by agents.
- Venture descriptions written for external audiences, not internal jargon.

## Project Rules

- Keep client JavaScript minimal.
- Ventures data model in `src/data/ventures.ts` - tier 1 (active) and tier 2 (in development).
- Venture Crane is mentioned in founder intro, not displayed as a portfolio card.

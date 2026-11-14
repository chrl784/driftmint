# DriftMint (`driftmint.so`)

**Turn Client Scope Creep Into Paid Change Orders in 15 Seconds.**

DriftMint is a production-ready B2B micro-SaaS built with **Next.js 15 App Router**, **TypeScript**, **Tailwind CSS**, **Three.js**, **Supabase (PostgreSQL + RLS)**, **OpenAI Structured Outputs**, and **Stripe**.

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000` for the interactive landing page, `/dashboard` for the Agency Workspace, and `/approve/kinetix-pdf-export` for a sample Client Change-Order portal.

> **Sandbox vs Production**: Without external keys in `.env.local`, DriftMint runs in persistent Local Sandbox Mode (`.driftmint-sandbox.json`) with the deterministic SOW clause-diff engine so every workflow can be tested end-to-end immediately. Add your `SUPABASE_*`, `OPENAI_API_KEY`, and `STRIPE_*` keys in `.env.local` and run `supabase/schema.sql` in Supabase SQL Editor to go live.

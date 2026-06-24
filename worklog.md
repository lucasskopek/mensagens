# WhatsRomance - Worklog

## Task 1 — Project Setup & Scaffolding
- Scaffolded Next.js 16 project with App Router
- Configured Prisma with SQLite (User, UserConfig, Contact, Schedule, MessageHistory models)
- Set up Tailwind CSS, shadcn/ui, and base layout
- Created TypeScript type definitions (`src/lib/types.ts`)
- Created pricing plans and style constants

## Task 2 — API Routes
- **`src/app/api/auth/route.ts`** — POST login/register with dev bypass (Lucas Skopek → unlimited credits)
- **`src/app/api/contacts/route.ts`** — GET list, POST create, DELETE contact (with ownership check)
- **`src/app/api/schedules/route.ts`** — GET list (enriched with contact info), POST create, PUT update, DELETE (with ownership check). JSON serialization for messageStyles/sendTimes arrays.
- **`src/app/api/messages/route.ts`** — GET message history (newest first, limit 50)
- **`src/app/api/messages/generate/route.ts`** — POST generate romantic message via z-ai-web-dev-sdk LLM. Checks recent history to avoid duplicates. Supports 4 styles (romantic, spicy, playful, serious). System prompt in Brazilian Portuguese.
- **`src/app/api/messages/send/route.ts`** — POST simulate WhatsApp send. Saves to MessageHistory with status "sent". Deducts 1 credit (dev users exempt).
- **`src/app/api/onboarding/route.ts`** — GET user config, POST upsert onboarding config (supabase, vercel, whatsapp API settings)
- **`src/app/api/credits/route.ts`** — GET credit balance
- **`src/app/api/credits/add/route.ts`** — POST add credits (increment) with plan name tracking
- **`src/app/api/free-test/route.ts`** — POST free test message generation. Creates mock user, generates LLM message, saves to history. No auth required.
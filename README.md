# dr.t — AI Food Advisor for Diabetes Support (Telegram-first)

`dr.t` is an early-stage hackathon project that helps people with diabetes make better food choices through Telegram.

A user sends a message (and soon food photos), and the bot responds with guidance. The long-term goal is to combine conversational UX with food analysis so users can:

- Track daily sugar-related intake.
- Get quick “should I eat this?” suggestions.
- Build healthier habits with low-friction chat interactions.

---

## Current Product Status

This repository is an **MVP foundation** with a working Telegram webhook integration and user persistence layer.

What works now:

- Telegram webhook endpoint.
- Telegram webhook registration endpoint.
- **User identification**: every Telegram message is mapped to a stable `telegram_id` and upserted into Supabase.
- Type-safe environment parsing.
- Unit tests for Telegram config and user upsert logic.

What is planned next:

- Food-image ingestion and analysis.
- Nutrition/sugar estimation pipeline.
- Daily sugar log per user.
- Personalized recommendations.

---

## What We’re Trying to Achieve

### Product goal

Build a **smart, dependable, and fast** diabetes-friendly food advisor that is simple enough for everyday use via Telegram.

### Engineering goals

1. **Performance first**: low-latency replies and efficient processing.
2. **Reliability first**: bot should respond consistently under load/failures.
3. **Predictability**: stable behavior, clear webhook/event routing, easy diagnostics.
4. **Maintainability**: modular logic, minimal duplication, test-backed changes.

---

## High-Level System Design

The system uses a webhook-driven architecture:

1. User sends message to Telegram bot.
2. Telegram sends update to our deployed webhook URL.
3. Next.js API route receives webhook payload.
4. Chat SDK + Telegram adapter normalize platform events.
5. Bot handlers choose response logic.
6. Bot posts reply back to Telegram chat.

### Runtime components

- **Next.js App Router API routes** for webhook handling.
- **Chat SDK** (`chat`) for event model and thread abstraction.
- **Telegram adapter** (`@chat-adapter/telegram`) for Telegram-specific transport.
- **Supabase** (`@supabase/supabase-js`) for persistent user and sugar log storage.
- **In-memory state adapter** (`@chat-adapter/state-memory`) for subscription state.

---

## Request Flow (Detailed)

### 1) Telegram webhook registration

Route: `GET /api/webhook/telegram/register`

Responsibilities:

- Resolve public origin from:
  1. `WEBHOOK_URL` (explicit override), else
  2. `VERCEL_URL` (on Vercel), else
  3. request origin.
- Build webhook URL: `https://<origin>/api/webhook/telegram`
- Call Telegram `setWebhook` with allowed update types.
- Return JSON response with registration status.

This route exists to make setup repeatable and remove manual webhook mistakes.

### 2) Incoming Telegram updates

Route: `POST /api/webhook/telegram`

Responsibilities:

- Validate bot availability (`TELEGRAM_BOT_TOKEN` present).
- Forward request to Chat SDK Telegram webhook handler.
- Let adapter + SDK route events to bot handlers.

### 3) Bot behavior

Defined in `lib/chat.ts`:

- Build singleton bot instance via `getBot()`.
- Register handlers for:
  - `onDirectMessage` — upserts user into DB, replies with greeting.
  - `onSubscribedMessage` — keeps user profile fresh, stubs food analysis.
- User identity is extracted from `message.raw.from` (the authoritative `TelegramUser` object).

### 4) User persistence

Defined in `lib/users.ts` and `lib/supabase.ts`:

- `upsertTelegramUser()` is called on every message.
- Uses `ON CONFLICT (telegram_id)` so it is idempotent — safe at any message rate.
- Returns the internal UUID (`DbUser.id`) used as a foreign key in all other tables (e.g., `sugar_logs`).

---

## Repository Layout

- `app/api/webhook/telegram/route.ts`  
  Telegram webhook receiver.
- `app/api/webhook/telegram/register/route.ts`  
  Webhook registration helper endpoint.
- `lib/chat.ts`  
  Bot construction, env parsing, handler registration, `resolveTelegramWebhookOrigin`.
- `lib/chat.test.ts`  
  Unit tests for env extraction and webhook origin resolution.
- `lib/users.ts`  
  `upsertTelegramUser()` — single source of truth for Telegram user persistence.
- `lib/users.test.ts`  
  Unit tests for user upsert logic (mocked Supabase).
- `lib/supabase.ts`  
  Singleton Supabase service-role client (server-only).
- `schema.sql`  
  Reference SQL schema — paste into Supabase SQL Editor to set up tables.
- `.env.example`  
  Required/optional environment variables.

---

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required:

- `TELEGRAM_BOT_TOKEN` — Bot token from BotFather.
- `SUPABASE_URL` — Your Supabase project URL (e.g., `https://xxxx.supabase.co`).
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key. **Server-only. Never expose to the browser.**

Optional:

- `TELEGRAM_WEBHOOK_SECRET` — Secret for Telegram webhook verification.
- `WEBHOOK_URL` — Override public URL used by the registration route.
- `GOOGLE_GENERATIVE_AI_API_KEY` — API key for Gemini models (required if using Gemini).
- `AI_PROVIDER` — Set to `gemini` (default) or `ollama`.

---

## Local Development

Install dependencies:

```bash
bun install
```

Run dev server:

```bash
bun dev
```

Register webhook (after deployment/public URL is available):

```bash
curl -X GET "https://<your-domain>/api/webhook/telegram/register"
```

---

## Quality Gates (Must Pass)

Per project rules, all of these must pass:

```bash
bun lint
bun fmt
bun typecheck
bun test
```

---

## Deployment Notes

Primary target is Vercel (`dr-t-rouge.vercel.app`).

### First-time setup

1. Create a Supabase project.
2. Paste `schema.sql` into the Supabase SQL Editor and run it.
3. Copy the **Project URL** and **service-role key** from Supabase Dashboard → Settings → API.

### Vercel deployment checklist

1. Set `TELEGRAM_BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` in Vercel project env.
2. Set `TELEGRAM_WEBHOOK_SECRET` (recommended).
3. Deploy.
4. Call `/api/webhook/telegram/register` once per environment/domain change.
5. Send a DM to the bot on Telegram — verify a row appears in the `telegram_users` Supabase table.

---

## Near-Term Roadmap

1. ~~**Persistence layer** for users~~ ✅ Done — `telegram_users` table + upsert on every message.
2. **Sugar log writes** — record `food_name`, `sugar_grams` per message in `sugar_logs`.
3. ~~**Food analysis service** (image → nutrition/sugar estimate via AI SDK).~~ ✅ Done — Integrated Gemini and Ollama.
4. **Recommendation engine** for diabetes-aware guidance.
5. **Observability** (structured logs, webhook diagnostics, alerting).
6. **Resilience improvements** (retry/backoff, idempotency guards, dead-letter strategy).

---

## Design Principles for Contributors

- Prefer correctness over convenience.
- Extract shared logic instead of duplicating code.
- Keep behavior deterministic and testable.
- Add or update tests for all new logic.
- Keep documentation (`README.md`, `.env.example`) aligned with code changes.

# dr.t — AI Food Advisor for Diabetes Support (Telegram-first)

`dr.t` is an early-stage hackathon project that helps people with diabetes make better food choices through Telegram.

A user sends a message (and soon food photos), and the bot responds with guidance. The long-term goal is to combine conversational UX with food analysis so users can:

- Track daily sugar-related intake.
- Get quick “should I eat this?” suggestions.
- Build healthier habits with low-friction chat interactions.

---

## Current Product Status

This repository is an **MVP foundation** and currently focuses on a reliable Telegram webhook integration plus a predictable reply flow.

What works now:

- Telegram webhook endpoint.
- Telegram webhook registration endpoint.
- Basic hardcoded bot response for incoming messages.
- Type-safe environment parsing.
- Unit tests for core Telegram config/reply helpers.

What is planned next:

- Food-image ingestion and analysis.
- Nutrition/sugar estimation pipeline.
- User profile and daily intake persistence.
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
- **In-memory state adapter** (`@chat-adapter/state-memory`) for subscription state in this early MVP.

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
  - `onNewMention`
  - `onDirectMessage`
  - `onSubscribedMessage`
- Reply with current hardcoded response.

This establishes a stable base before plugging in AI and nutrition logic.

---

## Repository Layout

- `app/api/webhook/telegram/route.ts`  
  Telegram webhook receiver.
- `app/api/webhook/telegram/register/route.ts`  
  Webhook registration helper endpoint.
- `lib/chat.ts`  
  Bot construction, env parsing, handler registration, hardcoded reply.
- `lib/chat.test.ts`  
  Unit tests for env extraction and reply constant behavior.
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

Optional:

- `TELEGRAM_WEBHOOK_SECRET` — Secret used for Telegram webhook verification in this codebase.
- `WEBHOOK_URL` — Override public URL used by registration route.

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

Recommended deployment checklist:

1. Set `TELEGRAM_BOT_TOKEN` in Vercel project env.
2. Set `TELEGRAM_WEBHOOK_SECRET` (if using secret verification).
3. Deploy.
4. Call `/api/webhook/telegram/register` once per environment/domain change.
5. Verify bot responses from Telegram.

---

## Near-Term Roadmap

1. **Persistence layer** for users, meals, and daily sugar totals.
2. **Food analysis service** (image -> nutrition/sugar estimate).
3. **Recommendation engine** for diabetes-aware guidance.
4. **Observability** (structured logs, webhook diagnostics, alerting).
5. **Resilience improvements** (retry/backoff, idempotency guards, dead-letter strategy).

---

## Design Principles for Contributors

- Prefer correctness over convenience.
- Extract shared logic instead of duplicating code.
- Keep behavior deterministic and testable.
- Add or update tests for all new logic.
- Keep documentation (`README.md`, `.env.example`) aligned with code changes.

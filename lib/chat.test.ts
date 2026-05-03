import { describe, expect, test } from "bun:test";

import { getTelegramEnv, resolveTelegramWebhookOrigin } from "@/lib/chat";

describe("getTelegramEnv", () => {
  test("returns bot and webhook tokens from env", () => {
    expect(
      getTelegramEnv({
        TELEGRAM_BOT_TOKEN: "bot-token",
        TELEGRAM_WEBHOOK_SECRET: "webhook-secret",
      }),
    ).toEqual({
      botToken: "bot-token",
      secretToken: "webhook-secret",
    });
  });

  test("returns undefined values when env vars are missing", () => {
    expect(getTelegramEnv({})).toEqual({
      botToken: undefined,
      secretToken: undefined,
    });
  });
});

describe("resolveTelegramWebhookOrigin", () => {
  test("prefers WEBHOOK_URL over everything else", () => {
    expect(
      resolveTelegramWebhookOrigin("https://dr-t-rouge.vercel.app/path", {
        WEBHOOK_URL: "https://api.example.com",
        VERCEL_URL: "random-preview.vercel.app",
      }),
    ).toBe("https://api.example.com");
  });

  test("uses request origin when WEBHOOK_URL is absent", () => {
    expect(
      resolveTelegramWebhookOrigin("https://dr-t-rouge.vercel.app/path", {
        VERCEL_URL: "random-preview.vercel.app",
      }),
    ).toBe("https://dr-t-rouge.vercel.app");
  });

  test("falls back to VERCEL_URL when request origin is unavailable", () => {
    expect(
      resolveTelegramWebhookOrigin("about:blank", {
        VERCEL_URL: "random-preview.vercel.app",
      }),
    ).toBe("https://random-preview.vercel.app");
  });

  test("throws when no origin can be determined", () => {
    let threw = false;
    try {
      resolveTelegramWebhookOrigin("about:blank", {});
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

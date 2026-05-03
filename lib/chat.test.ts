import { describe, expect, test } from "bun:test";

import {
  TELEGRAM_HARDCODED_REPLY,
  getTelegramEnv,
  getTelegramHardcodedReply,
  resolveTelegramWebhookOrigin,
} from "@/lib/chat";

describe("telegram chat config", () => {
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

  test("returns the hardcoded Telegram reply", () => {
    expect(getTelegramHardcodedReply()).toBe(TELEGRAM_HARDCODED_REPLY);
  });

  test("prefers WEBHOOK_URL when resolving webhook origin", () => {
    expect(
      resolveTelegramWebhookOrigin("https://dr-t-rouge.vercel.app/path", {
        WEBHOOK_URL: "https://api.example.com",
        VERCEL_URL: "random-preview.vercel.app",
      }),
    ).toBe("https://api.example.com");
  });

  test("uses request origin before VERCEL_URL", () => {
    expect(
      resolveTelegramWebhookOrigin("https://dr-t-rouge.vercel.app/path", {
        VERCEL_URL: "random-preview.vercel.app",
      }),
    ).toBe("https://dr-t-rouge.vercel.app");
  });
});

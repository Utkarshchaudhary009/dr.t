import { describe, expect, test } from "bun:test";

import {
  TELEGRAM_HARDCODED_REPLY,
  getTelegramEnv,
  getTelegramHardcodedReply,
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
});

import { describe, expect, test } from "bun:test";

import { upsertTelegramUser } from "@/lib/users";
import type { SupabaseClientLike } from "@/lib/users";

// ─── Stub helpers ─────────────────────────────────────────────────────────────

const MOCK_DB_USER = {
  id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  telegram_id: 123456789,
  first_name: "Alice",
  last_name: "Smith",
  username: "alice",
};

/**
 * Build a stub Supabase client that resolves with `result` on `.single()`.
 * Records the last call arguments so tests can inspect them.
 */
function makeStubClient(result: {
  data: unknown;
  error: { message: string } | null;
}): {
  client: SupabaseClientLike;
  lastFromTable: () => string | undefined;
  lastUpsertData: () => Record<string, unknown> | undefined;
  lastUpsertOptions: () => { onConflict: string } | undefined;
} {
  let fromTable: string | undefined;
  let upsertData: Record<string, unknown> | undefined;
  let upsertOptions: { onConflict: string } | undefined;

  const client: SupabaseClientLike = {
    from(table) {
      fromTable = table;
      return {
        upsert(data, options) {
          upsertData = data;
          upsertOptions = options;
          return {
            select(_columns) {
              return {
                single: () => Promise.resolve(result),
              };
            },
          };
        },
      };
    },
  };

  return {
    client,
    lastFromTable: () => fromTable,
    lastUpsertData: () => upsertData,
    lastUpsertOptions: () => upsertOptions,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("upsertTelegramUser", () => {
  test("targets the telegram_users table", async () => {
    const { client, lastFromTable } = makeStubClient({
      data: MOCK_DB_USER,
      error: null,
    });
    await upsertTelegramUser({ telegramId: 1, firstName: "Test" }, client);
    expect(lastFromTable()).toBe("telegram_users");
  });

  test("passes telegram_id and first_name to upsert", async () => {
    const { client, lastUpsertData } = makeStubClient({
      data: MOCK_DB_USER,
      error: null,
    });
    await upsertTelegramUser(
      { telegramId: 123456789, firstName: "Alice" },
      client,
    );
    const data = lastUpsertData();
    expect(data?.telegram_id).toBe(123456789);
    expect(data?.first_name).toBe("Alice");
  });

  test("passes all optional fields when provided", async () => {
    const { client, lastUpsertData } = makeStubClient({
      data: MOCK_DB_USER,
      error: null,
    });
    await upsertTelegramUser(
      {
        telegramId: 123456789,
        firstName: "Alice",
        lastName: "Smith",
        username: "alice",
        languageCode: "en",
      },
      client,
    );
    const data = lastUpsertData();
    expect(data?.last_name).toBe("Smith");
    expect(data?.username).toBe("alice");
    expect(data?.language_code).toBe("en");
  });

  test("maps missing optional fields to null", async () => {
    const { client, lastUpsertData } = makeStubClient({
      data: MOCK_DB_USER,
      error: null,
    });
    await upsertTelegramUser({ telegramId: 1, firstName: "Bob" }, client);
    const data = lastUpsertData();
    expect(data?.last_name).toBe(null);
    expect(data?.username).toBe(null);
    expect(data?.language_code).toBe(null);
  });

  test("uses ON CONFLICT on telegram_id", async () => {
    const { client, lastUpsertOptions } = makeStubClient({
      data: MOCK_DB_USER,
      error: null,
    });
    await upsertTelegramUser({ telegramId: 1, firstName: "Test" }, client);
    expect(lastUpsertOptions()?.onConflict).toBe("telegram_id");
  });

  test("returns the db user row from Supabase", async () => {
    const { client } = makeStubClient({ data: MOCK_DB_USER, error: null });
    const result = await upsertTelegramUser(
      { telegramId: 123456789, firstName: "Alice" },
      client,
    );
    expect(result).toEqual(MOCK_DB_USER);
  });

  test("throws when Supabase returns an error", async () => {
    const { client } = makeStubClient({
      data: null,
      error: { message: "DB connection failed" },
    });
    let caughtMessage = "";
    try {
      await upsertTelegramUser({ telegramId: 1, firstName: "Test" }, client);
    } catch (err) {
      caughtMessage = err instanceof Error ? err.message : String(err);
    }
    expect(caughtMessage).toBe(
      "upsertTelegramUser failed: DB connection failed",
    );
  });
});

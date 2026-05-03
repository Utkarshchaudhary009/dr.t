import { supabase as defaultSupabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * The fields we receive from a Telegram update's `from` object.
 * Maps 1:1 to TelegramUser from @chat-adapter/telegram.
 */
export type TelegramUserMeta = {
  /** Telegram's numeric user ID — stable forever, used as the external key. */
  telegramId: number;
  firstName: string;
  lastName?: string;
  /** Can change; stored for display but not used as identity. */
  username?: string;
  languageCode?: string;
};

/** A row from the `telegram_users` table. */
export type DbUser = {
  /** Internal UUID — use this as the foreign key in all other tables. */
  id: string;
  telegram_id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
};

/**
 * Minimal Supabase client interface required by upsertTelegramUser.
 * Accepting this interface instead of the concrete client makes the function
 * unit-testable without module mocking.
 */
export interface SupabaseClientLike {
  from(table: string): {
    upsert(
      data: Record<string, unknown>,
      options: { onConflict: string },
    ): {
      select(columns: string): {
        single(): PromiseLike<{
          data: unknown;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Upsert a Telegram user by their stable `telegram_id`.
 *
 * Safe to call on every incoming message. Uses `ON CONFLICT (telegram_id)`
 * so it is a no-op if the user already exists, and updates mutable fields
 * (name, username, language_code) if they have changed.
 *
 * @param meta - Identity fields from the Telegram `from` object.
 * @param client - Optional Supabase client (defaults to the service-role singleton).
 *                 Pass a stub in tests to avoid module mocking.
 * @returns The db user row, including our internal UUID.
 * @throws If the Supabase query fails.
 */
export async function upsertTelegramUser(
  meta: TelegramUserMeta,
  client: SupabaseClientLike = defaultSupabase,
): Promise<DbUser> {
  const { data, error } = await client
    .from("telegram_users")
    .upsert(
      {
        telegram_id: meta.telegramId,
        first_name: meta.firstName,
        last_name: meta.lastName ?? null,
        username: meta.username ?? null,
        language_code: meta.languageCode ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "telegram_id" },
    )
    .select("id, telegram_id, first_name, last_name, username")
    .single();

  if (error) {
    throw new Error(`upsertTelegramUser failed: ${error.message}`);
  }

  return data as DbUser;
}

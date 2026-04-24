import { getTelegramEnv } from "@/lib/chat";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { botToken, secretToken } = getTelegramEnv();

  if (!botToken) {
    return Response.json(
      { error: "TELEGRAM_BOT_TOKEN is not configured" },
      { status: 503 },
    );
  }

  // Resolve the webhook URL: prefer explicit override, fall back to Vercel's
  // auto-injected deployment URL, and finally to the request's own origin.
  const origin =
    process.env.WEBHOOK_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    new URL(req.url).origin;

  const webhookUrl = `${origin}/api/webhook/telegram`;

  const params: Record<string, string> = {
    url: webhookUrl,
    // Tell Telegram to only send the update types we actually handle.
    allowed_updates: JSON.stringify(["message", "callback_query"]),
  };
  if (secretToken) {
    params.secret_token = secretToken;
  }

  const qs = new URLSearchParams(params).toString();
  const apiUrl = `https://api.telegram.org/bot${botToken}/setWebhook?${qs}`;

  const res = await fetch(apiUrl, { method: "POST" });
  const data = (await res.json()) as unknown;

  if (!res.ok) {
    return Response.json(
      { error: "Telegram setWebhook failed", detail: data },
      { status: 502 },
    );
  }

  return Response.json({
    ok: true,
    webhookUrl,
    telegramResponse: data,
  });
}

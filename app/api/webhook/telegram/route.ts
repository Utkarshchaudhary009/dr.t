import { after } from "next/server";
import { getBot } from "@/lib/chat";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const bot = getBot();

  if (!bot) {
    return Response.json(
      { error: "TELEGRAM_BOT_TOKEN is not configured" },
      { status: 503 },
    );
  }

  return bot.webhooks.telegram(req, {
    waitUntil: (task) => after(() => task),
  });
}

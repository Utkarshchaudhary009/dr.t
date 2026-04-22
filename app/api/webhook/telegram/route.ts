import { bot } from "@/lib/chat";

export async function POST(req: Request) {
  return bot.webhooks.telegram(req);
}

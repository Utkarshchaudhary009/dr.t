import { ToolLoopAgent, tool } from "ai";
import { google } from "@ai-sdk/google";
import { ollama } from "ollama-ai-provider-v2";
import { z } from "zod";
import { supabase } from "./supabase";

const instructions =
  "You are a smart food advisor for diabetes patients. The user will send you pictures of their food. Evaluate the food, estimate the sugar content, and advise them on whether they should eat it or not.";

export function getAgents(userId: string) {
  const agentTools = {
    recordSugarIntake: tool({
      description:
        "Record the user's estimated sugar intake (in grams) for the current meal.",
      inputSchema: z.object({
        sugarGrams: z
          .number()
          .describe("The estimated amount of sugar in grams"),
        foodItem: z.string().describe("The name of the food item"),
      }),
      execute: async ({ sugarGrams, foodItem }) => {
        const { error } = await supabase.from("sugar_logs").insert({
          user_id: userId,
          food_name: foodItem,
          sugar_grams: sugarGrams,
        });

        if (error) {
          console.error("Failed to insert sugar log", error);
          return { success: false, error: error.message };
        }

        console.log(
          `Recorded ${sugarGrams}g of sugar for ${foodItem} (User: ${userId})`,
        );
        return {
          success: true,
          sugarGrams,
          foodItem,
          message: "Sugar intake recorded successfully in the database.",
        };
      },
    }),
    retrieveSugarIntake: tool({
      description:
        "Retrieve the user's recorded sugar intake for a specific timeframe (today, specific date, or lifetime).",
      inputSchema: z.object({
        timeframe: z
          .enum(["today", "lifetime"])
          .describe("The timeframe to retrieve sugar intake for"),
      }),
      execute: async ({ timeframe }) => {
        let query = supabase
          .from("sugar_logs")
          .select("sugar_grams")
          .eq("user_id", userId);

        if (timeframe === "today") {
          const startOfDay = new Date();
          startOfDay.setUTCHours(0, 0, 0, 0);
          query = query.gte("logged_at", startOfDay.toISOString());
        }

        const { data, error } = await query;

        if (error) {
          console.error("Failed to fetch sugar logs", error);
          return { success: false, error: error.message };
        }

        const totalSugarGrams = data.reduce(
          (sum, row) => sum + Number(row.sugar_grams || 0),
          0,
        );
        console.log(
          `Retrieving sugar intake for ${timeframe} (User: ${userId}): ${totalSugarGrams}g`,
        );
        return {
          success: true,
          totalSugarGrams,
          timeframe,
          message: `Found a total of ${totalSugarGrams}g of sugar for the timeframe: ${timeframe}.`,
        };
      },
    }),
  };

  const geminiAgent = new ToolLoopAgent({
    model: google("gemini-3.1-flash-lite-preview"),
    instructions,
    tools: agentTools,
  });

  const ollamaAgent = new ToolLoopAgent({
    model: ollama("medgemma:4b"),
    instructions,
    tools: agentTools,
  });

  return { geminiAgent, ollamaAgent };
}

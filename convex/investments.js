import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return ctx.db
      .query("investments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const add = mutation({
  args: {
    ticker: v.string(),
    name: v.string(),
    shares: v.number(),
    purchasePrice: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return ctx.db.insert("investments", { userId, ...args });
  },
});
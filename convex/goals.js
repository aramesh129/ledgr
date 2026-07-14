import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    targetAmount: v.number(),
    savedAmount: v.number(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    deadline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return ctx.db.insert("goals", { userId, ...args });
  },
});

export const updateSaved = mutation({
  args: { id: v.id("goals"), savedAmount: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const goal = await ctx.db.get(args.id);
    if (goal?.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.patch(args.id, { savedAmount: args.savedAmount });
  },
});
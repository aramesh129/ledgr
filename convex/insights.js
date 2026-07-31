import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const latest = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return ctx.db
      .query("insights")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
  },
});

// Add this cleanup mutation
export const saveAndClean = mutation({
  args: { content: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Keep only last 10 insights
    const all = await ctx.db
      .query("insights")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    if (all.length >= 10) {
      for (const old of all.slice(9)) {
        await ctx.db.delete(old._id);
      }
    }

    return ctx.db.insert("insights", {
      userId,
      content: args.content,
      generatedAt: new Date().toISOString(),
    });
  },
});

export const save = mutation({
  args: { content: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return ctx.db.insert("insights", {
      userId,
      content: args.content,
      generatedAt: new Date().toISOString(),
    });
  },
});
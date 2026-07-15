import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const saveAccessToken = mutation({
  args: {
    accessToken: v.string(),
    itemId: v.string(),
    institutionName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("plaidItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("itemId"), args.itemId))
      .first();
    if (existing) return existing._id;
    return ctx.db.insert("plaidItems", { userId, ...args });
  },
});
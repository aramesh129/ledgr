import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const txns = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const filtered = args.category
      ? txns.filter((t) => t.category === args.category)
      : txns;

    return args.limit ? filtered.slice(0, args.limit) : filtered;
  },
});

export const summary = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const txns = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthTxns = txns.filter((t) => t.date.startsWith(monthPrefix));

    const income = monthTxns
      .filter((t) => t.amount > 0)
      .reduce((s, t) => s + t.amount, 0);
    const spent = monthTxns
      .filter((t) => t.amount < 0)
      .reduce((s, t) => s + Math.abs(t.amount), 0);

    const byCategory = {};
    monthTxns
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        byCategory[t.category] = (byCategory[t.category] ?? 0) + Math.abs(t.amount);
      });

    return { income, spent, byCategory };
  },
});

export const add = mutation({
  args: {
    date: v.string(),
    merchant: v.string(),
    amount: v.number(),
    category: v.string(),
    icon: v.optional(v.string()),
    source: v.union(v.literal("plaid"), v.literal("pdf"), v.literal("manual")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return ctx.db.insert("transactions", { userId, ...args });
  },
});
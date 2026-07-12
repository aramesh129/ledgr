import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  transactions: defineTable({
    userId: v.string(),
    plaidTransactionId: v.optional(v.string()),
    date: v.string(),
    merchant: v.string(),
    amount: v.number(),
    category: v.string(),
    icon: v.optional(v.string()),
    source: v.union(v.literal("plaid"), v.literal("pdf"), v.literal("manual")),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  goals: defineTable({
    userId: v.string(),
    name: v.string(),
    targetAmount: v.number(),
    savedAmount: v.number(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    deadline: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  investments: defineTable({
    userId: v.string(),
    ticker: v.string(),
    name: v.string(),
    shares: v.number(),
    purchasePrice: v.number(),
    currentPrice: v.optional(v.number()),
    lastUpdated: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  plaidItems: defineTable({
    userId: v.string(),
    accessToken: v.string(),
    itemId: v.string(),
    institutionName: v.string(),
  }).index("by_user", ["userId"]),

  insights: defineTable({
    userId: v.string(),
    content: v.string(),
    generatedAt: v.string(),
  }).index("by_user", ["userId"]),
});
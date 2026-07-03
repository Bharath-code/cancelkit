import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

// Public read — demo pages work logged-out.
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db
      .query("demos")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

// Operator-only: run via scripts/create-demo.ts → `npx convex run`.
export const create = internalMutation({
  args: {
    slug: v.string(),
    name: v.string(),
    logoUrl: v.optional(v.string()),
    brandColor: v.optional(v.string()),
    plans: v.array(
      v.object({
        nickname: v.string(),
        amountCents: v.number(),
        currency: v.string(),
        interval: v.string(),
      })
    ),
    coupons: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        percentOff: v.optional(v.number()),
        amountOffCents: v.optional(v.number()),
        duration: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("demos")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args });
      return existing._id;
    }
    return ctx.db.insert("demos", { ...args, createdAt: Date.now() });
  },
});

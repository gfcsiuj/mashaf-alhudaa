import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Start a new Khatmah for the logged-in user
export const startKhatmah = mutation({
  args: {
    name: v.string(),
    targetDate: v.optional(v.number()),
  },
  handler: async (ctx, { name, targetDate }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be logged in to start a Khatmah.");
    }

    // Deactivate any other active Khatmahs for this user
    const existingActive = await ctx.db
      .query("khatmahs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const active of existingActive) {
      await ctx.db.patch(active._id, { isActive: false });
    }

    // Create the new Khatmah
    const khatmahId = await ctx.db.insert("khatmahs", {
      userId,
      name,
      startDate: Date.now(),
      targetDate,
      completedPages: [],
      isActive: true,
    });

    return khatmahId;
  },
});

// Get the user's currently active Khatmah
export const getActiveKhatmah = query({
  handler: async (ctx) => {
    try {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const activeKhatmah = await ctx.db
            .query("khatmahs")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .first();

        return activeKhatmah;
    } catch {
        return null;
    }
  },
});

import { internalMutation } from "./_generated/server";

// Internal mutation to update progress, called from other mutations
export const updateKhatmahProgress = internalMutation({
    args: { pageNumber: v.number(), userId: v.id("users") },
    handler: async (ctx, { pageNumber, userId }) => {
        const activeKhatmah = await ctx.db
            .query("khatmahs")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .first();

        if (activeKhatmah) {
            const completed = new Set(activeKhatmah.completedPages);
            if (!completed.has(pageNumber)) {
                await ctx.db.patch(activeKhatmah._id, {
                    completedPages: [...completed, pageNumber],
                });
            }
        }
    }
});

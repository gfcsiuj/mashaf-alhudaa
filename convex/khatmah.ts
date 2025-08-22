import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const QURAN_TOTAL_PAGES = 604;

// Start a new Khatmah for the logged-in user
export const startKhatmah = mutation({
  args: {
    targetDate: v.optional(v.number()),
    startPage: v.number(),
  },
  handler: async (ctx, { targetDate, startPage }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be logged in to start a Khatmah.");
    }

    // Deactivate any other active Khatmahs for this user
    const existingActive = await ctx.db
      .query("khatmahs")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
      .collect();

    for (const active of existingActive) {
      await ctx.db.patch(active._id, { status: "completed" });
    }

    // Calculate daily goal
    let dailyGoalInPages = 20; // Default goal if no target date
    if (targetDate) {
        const daysToTarget = (targetDate - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysToTarget > 0) {
            dailyGoalInPages = Math.ceil((QURAN_TOTAL_PAGES - startPage + 1) / daysToTarget);
        }
    }

    const khatmahId = await ctx.db.insert("khatmahs", {
      userId,
      startDate: Date.now(),
      targetDate,
      dailyGoalInPages,
      currentPage: startPage,
      status: "active",
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

        return await ctx.db
            .query("khatmahs")
            .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
            .first();
    } catch {
        return null;
    }
  },
});

// Get all completed Khatmahs for the user
export const getCompletedKhatmahs = query({
    handler: async (ctx) => {
        try {
            const userId = await getAuthUserId(ctx);
            if (!userId) return [];

            return await ctx.db
                .query("khatmahs")
                .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "completed"))
                .order("desc")
                .collect();
        } catch {
            return [];
        }
    },
});

// Internal mutation to update progress
export const updateKhatmahProgress = internalMutation({
    args: { pageNumber: v.number(), userId: v.id("users") },
    handler: async (ctx, { pageNumber, userId }) => {
        const activeKhatmah = await ctx.db
            .query("khatmahs")
            .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
            .first();

        if (activeKhatmah) {
            // Only update if the user is moving forward
            if (pageNumber > activeKhatmah.currentPage) {
                await ctx.db.patch(activeKhatmah._id, {
                    currentPage: pageNumber,
                });
            }
            // Check for completion
            if (pageNumber >= QURAN_TOTAL_PAGES) {
                await ctx.db.patch(activeKhatmah._id, {
                    status: "completed",
                });
            }
        }
    }
});

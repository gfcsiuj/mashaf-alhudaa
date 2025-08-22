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
      await ctx.db.patch(active._id, { status: "completed" }); // Mark old ones as completed
    }

    // Calculate daily goal
    let dailyGoalInPages = 20; // Default goal
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

// Get daily progress for a specific Khatmah
export const getDailyProgress = query({
    args: { khatmahId: v.id("khatmahs") },
    handler: async (ctx, { khatmahId }) => {
        return await ctx.db
            .query("daily_progress")
            .withIndex("by_khatmah_and_date", q => q.eq("khatmahId", khatmahId))
            .order("desc")
            .take(30); // Get last 30 days of reading
    },
});

// Internal mutation to update progress, called from other mutations
export const updateKhatmahProgress = internalMutation({
    args: { pageNumber: v.number(), userId: v.id("users") },
    handler: async (ctx, { pageNumber, userId }) => {
        const activeKhatmah = await ctx.db
            .query("khatmahs")
            .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
            .first();

        if (activeKhatmah) {
            const pagesReadInSession = pageNumber - activeKhatmah.currentPage;

            // Only update if the user is moving forward
            if (pagesReadInSession > 0) {
                // Update total progress
                await ctx.db.patch(activeKhatmah._id, {
                    currentPage: pageNumber,
                });

                // Update daily progress log
                const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                const dailyRecord = await ctx.db
                    .query("daily_progress")
                    .withIndex("by_khatmah_and_date", q => q.eq("khatmahId", activeKhatmah._id).eq("date", today))
                    .first();

                if (dailyRecord) {
                    await ctx.db.patch(dailyRecord._id, { pagesRead: dailyRecord.pagesRead + pagesReadInSession });
                } else {
                    await ctx.db.insert("daily_progress", {
                        khatmahId: activeKhatmah._id,
                        date: today,
                        pagesRead: pagesReadInSession,
                    });
                }
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

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User bookmarks and reading progress
  bookmarks: defineTable({
    userId: v.id("users"),
    pageNumber: v.number(),
    verseKey: v.string(),
    verseText: v.string(),
    note: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // User reading progress
  readingProgress: defineTable({
    userId: v.id("users"),
    lastPageRead: v.number(),
    lastReadAt: v.number(),
    totalPagesRead: v.number(),
  }).index("by_user", ["userId"]),

  // User preferences
  userPreferences: defineTable({
    userId: v.id("users"),
    selectedReciter: v.number(),
    selectedTafsir: v.number(),
    theme: v.string(), // "light", "dark", "sepia"
    fontSize: v.string(), // "small", "medium", "large"
    arabicFont: v.string(), // "uthmani", "indopak", "qpc"
    autoPlay: v.boolean(),
    showTranslation: v.boolean(),
    showTafsir: v.boolean(),
  }).index("by_user", ["userId"]),

  // Cached Quran data for offline support
  cachedPages: defineTable({
    pageNumber: v.number(),
    verses: v.array(v.object({
      id: v.number(),
      verse_key: v.string(),
      text_uthmani: v.string(),
      chapter_id: v.number(),
      verse_number: v.number(),
      juz_number: v.number(),
      hizb_number: v.number(),
      rub_number: v.number(),
      page_number: v.number(),
    })),
    cachedAt: v.number(),
  }).index("by_page", ["pageNumber"]),

  // Cached chapters data
  cachedChapters: defineTable({
    chapterId: v.number(),
    nameArabic: v.string(),
    nameSimple: v.string(),
    revelationPlace: v.string(),
    versesCount: v.number(),
    pages: v.array(v.number()),
    cachedAt: v.number(),
  }).index("by_chapter", ["chapterId"]),

  // Khatmah (full Quran reading) tracking
  khatmahs: defineTable({
    userId: v.id("users"),
    startDate: v.number(),
    targetDate: v.optional(v.number()),
    dailyGoalInPages: v.number(),
    currentPage: v.number(),
    status: v.string(), // "active" | "completed"
  }).index("by_user_status", ["userId", "status"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get page data with caching
export const getPageData = action({
  args: {
    pageNumber: v.number(),
    reciterId: v.optional(v.number()),
    tafsirId: v.optional(v.number()),
    translationId: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const { pageNumber, reciterId = 7, tafsirId = 167, translationId = 131 } = args;

    try {
      // Build the API URL with proper parameters
      const url = `https://api.quran.com/api/v4/verses/by_page/${pageNumber}?translations=${translationId}&tafsirs=${tafsirId}&audio=${reciterId}&words=false&fields=text_uthmani,chapter_id,verse_number,verse_key,juz_number,hizb_number,rub_number,page_number`;

      console.log("Fetching from URL:", url);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
        // Removed timeout signal as it may not be supported in the current environment
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("RAW QURAN.COM API RESPONSE:", JSON.stringify(data, null, 2));

      if (!data.verses || !Array.isArray(data.verses)) {
        throw new Error("Invalid API response format");
      }

      // Process verses to ensure all required fields are present
      const processedVerses = data.verses.map((verse: any, index: number) => ({
        id: verse.id || index,
        verse_key: verse.verse_key || `${verse.chapter_id}:${verse.verse_number}`,
        text_uthmani: verse.text_uthmani || verse.text_madani || verse.text_simple || "",
        chapter_id: verse.chapter_id || 1,
        verse_number: verse.verse_number || 1,
        page_number: verse.page_number || pageNumber,
        juz_number: verse.juz_number || 1,
        hizb_number: verse.hizb_number || 1,
        rub_number: verse.rub_number || 1,
        audio: verse.audio || null,
        translations: verse.translations || [],
        tafsirs: verse.tafsirs || []
      }));

      return {
        verses: processedVerses,
        pagination: data.pagination || {},
        meta: data.meta || {}
      };
    } catch (error: any) {
      console.error("Error fetching page data:", error);
      throw new Error(`Failed to fetch Quran page data: ${error?.message || 'Unknown error'}`);
    }
  },
});

// Get all chapters for index
export const getChapters = action({
  args: {},
  handler: async (ctx) => {
    try {
      const url = "https://api.quran.com/api/v4/chapters?language=ar";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.chapters || [];
    } catch (error) {
      console.error("Error fetching chapters:", error);
      throw new Error("Failed to fetch chapters data");
    }
  },
});

// Get reciters list
export const getReciters = action({
  args: {},
  handler: async (ctx) => {
    try {
      const url = "https://api.quran.com/api/v4/resources/recitations?language=ar";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.recitations || [];
    } catch (error) {
      console.error("Error fetching reciters:", error);
      throw new Error("Failed to fetch reciters data");
    }
  },
});

// Get tafsirs list
export const getTafsirs = action({
  args: {},
  handler: async (ctx) => {
    try {
      const url = "https://api.quran.com/api/v4/resources/tafsirs?language=ar";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.tafsirs || [];
    } catch (error) {
      console.error("Error fetching tafsirs:", error);
      throw new Error("Failed to fetch tafsirs data");
    }
  },
});

// Get translations list
export const getTranslations = action({
  args: {},
  handler: async (ctx) => {
    try {
      const url = "https://api.quran.com/api/v4/resources/translations?language=ar";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.translations || [];
    } catch (error) {
      console.error("Error fetching translations:", error);
      throw new Error("Failed to fetch translations data");
    }
  },
});

// Search in Quran
export const searchQuran = action({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    try {
      const searchUrl = `https://api.quran.com/api/v4/search?q=${encodeURIComponent(args.query)}&size=20`;
      const searchResponse = await fetch(searchUrl);

      if (!searchResponse.ok) {
        throw new Error(`Search API request failed: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      const results = searchData.search?.results || [];

      // Enrich search results with full verse data
      const enrichedResults = await Promise.all(
        results.map(async (result: any) => {
          try {
            const verseUrl = `https://api.quran.com/api/v4/verses/by_key/${result.verse_key}?fields=text_uthmani,chapter_id,verse_number,page_number`;
            const verseResponse = await fetch(verseUrl);
            if (!verseResponse.ok) {
              // If fetching details fails, return the basic result
              return { verse_key: result.verse_key, text_uthmani: result.text };
            }
            const verseData = await verseResponse.json();

            return {
              verse_key: result.verse_key,
              text_uthmani: result.text, // Use the highlighted text from search result
              ...verseData.verse, // Spread the full verse details
            };
          } catch (e) {
            // On error, return the basic result
            return { verse_key: result.verse_key, text_uthmani: result.text };
          }
        })
      );

      // Filter out any null results from failed fetches
      const finalResults = enrichedResults.filter(r => r !== null);

      return { results: finalResults };

    } catch (error) {
      console.error("Error searching Quran:", error);
      throw new Error("Failed to search Quran");
    }
  },
});

// User preferences
export const getUserPreferences = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return prefs || {
      selectedReciter: 7, // Default to Al-Afasy
      selectedTafsir: 167, // Default to Jalalayn
      theme: "light",
      fontSize: "medium",
      arabicFont: "uthmani",
      autoPlay: false,
      showTranslation: false,
      showTafsir: false,
    };
  },
});

export const updateUserPreferences = mutation({
  args: {
    selectedReciter: v.optional(v.number()),
    selectedTafsir: v.optional(v.number()),
    theme: v.optional(v.string()),
    fontSize: v.optional(v.string()),
    arabicFont: v.optional(v.string()),
    autoPlay: v.optional(v.boolean()),
    showTranslation: v.optional(v.boolean()),
    showTafsir: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("userPreferences", {
        userId,
        selectedReciter: 7,
        selectedTafsir: 167,
        theme: "light",
        fontSize: "medium",
        arabicFont: "uthmani",
        autoPlay: false,
        showTranslation: false,
        showTafsir: false,
        ...args,
      });
    }
  },
});

// Bookmarks
export const getUserBookmarks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const addBookmark = mutation({
  args: {
    pageNumber: v.number(),
    verseKey: v.string(),
    verseText: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    await ctx.db.insert("bookmarks", {
      userId,
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const removeBookmark = mutation({
  args: { bookmarkId: v.id("bookmarks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    const bookmark = await ctx.db.get(args.bookmarkId);
    if (!bookmark || bookmark.userId !== userId) {
      throw new Error("Bookmark not found or unauthorized");
    }

    await ctx.db.delete(args.bookmarkId);
  },
});

// Reading progress
export const updateReadingProgress = mutation({
  args: { pageNumber: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const existing = await ctx.db
      .query("readingProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastPageRead: args.pageNumber,
        lastReadAt: Date.now(),
        totalPagesRead: Math.max(existing.totalPagesRead, args.pageNumber),
      });
    } else {
      await ctx.db.insert("readingProgress", {
        userId,
        lastPageRead: args.pageNumber,
        lastReadAt: Date.now(),
        totalPagesRead: args.pageNumber,
      });
    }
  },
});

export const getReadingProgress = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("readingProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

// Search verses
export const searchVerses = action({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    try {
      const url = `https://api.quran.com/api/v4/search?q=${encodeURIComponent(args.query)}&size=20`;
      const response = await fetch(url);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const results = data.search?.results || [];

      return results.map((result: any) => ({
        verse_key: result.verse_key,
        text_uthmani: result.text,
        page_number: result.verse?.page_number || 1,
        chapter_id: result.verse?.chapter_id || 1,
        verse_number: result.verse?.verse_number || 1,
      }));
    } catch (error) {
      console.error("Error searching verses:", error);
      return [];
    }
  },
});
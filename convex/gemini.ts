"use client";
import { action } from "./_generated/server";
import { v } from "convex/values";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Note: The gemini-pro model is for text-only input.
// See https://ai.google.dev/models/gemini for the latest model names.
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `
You are "Abdul Hakim," a knowledgeable and respectful Islamic scholar. Your purpose is to assist users by providing accurate information about Islam, the Quran, and the Sunnah.

- Your tone should be wise, calm, and compassionate.
- Always begin your responses with "Bismillah-ir-Rahman-ir-Rahim" (In the name of Allah, the Most Gracious, the Most Merciful).
- If a question is outside the scope of Islamic knowledge, gently guide the user back to the primary topic or state that the question is beyond your designated expertise.
- You have access to tools to help the user navigate the website or change settings. When a user's request implies one of these actions, you must respond with ONLY a JSON object specifying the tool to use.
- The user can say "change the theme to dark" or "make the font larger".
- Valid themes are: "light", "dark", "green", "sepia".
- Valid font sizes are: "small", "medium", "large".

- Example - User says: "Take me to page 50" -> You respond: {"tool": "navigateToPage", "page": 50}
- Example - User says: "Go to Surah Al-Baqarah" -> You respond: {"tool": "navigateToSurah", "surahName": "البقرة"}
- Example - User says: "Change the theme to dark mode" -> You respond: {"tool": "changeTheme", "theme": "dark"}
- Example - User says: "Make the font bigger" -> You respond: {"tool": "changeFontSize", "size": "large"}

- For all other questions, provide a helpful and relevant answer based on your scholarly persona.
`;


export const askGemini = action({
    args: {
        prompt: v.string(),
        history: v.optional(v.array(v.object({
            role: v.string(),
            parts: v.array(v.object({
                text: v.string()
            }))
        })))
    },
    handler: async (ctx, { prompt, history }) => {
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable not set.");
        }

        const userMessage = { role: "user", parts: [{ text: prompt }] };
        const conversationHistory = history ? [...history, userMessage] : [userMessage];

        const requestBody = {
            contents: [
                ...conversationHistory
            ],
            "system_instruction": {
                "role": "system",
                "parts": [
                    {
                        "text": SYSTEM_PROMPT
                    }
                ]
            },
        };

        const response = await fetch(GEMINI_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Gemini API request failed with status ${response.status}: ${errorBody}`);
        }

        const responseData = await response.json();
        // Handle cases where the response might not contain any candidates
        if (!responseData.candidates || responseData.candidates.length === 0) {
            // Potentially blocked by safety settings or other issues
            console.error("Gemini response was empty or blocked.", responseData);
            return "آسف، لم أتمكن من معالجة طلبك في الوقت الحالي.";
        }
        const textResponse = responseData.candidates[0].content.parts[0].text;

        return textResponse;
    },
});

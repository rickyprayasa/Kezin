"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { AIParseResult } from "./types";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const parseTransactionWithGemini = async (
  text: string
): Promise<AIParseResult | null> => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("No API Key found in process.env.GEMINI_API_KEY");
    return null;
  }

  try {
    const ai = getAI();
    const today = new Date().toISOString().split('T')[0];
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Parse the following financial text into a JSON object: "${text}". 
      If the user mentions buying something, it's EXPENSE. 
      If receiving money, INCOME. 
      If moving money, TRANSFER.
      Default date to today (${today}) if not specified.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "The monetary value" },
            category: { type: Type.STRING, description: "Short category name e.g. Food, Salary" },
            description: { type: Type.STRING, description: "Brief description of the transaction" },
            type: { type: Type.STRING, enum: ["EXPENSE", "INCOME", "TRANSFER"] },
            date: { type: Type.STRING, description: "ISO Date string YYYY-MM-DD" }
          },
          required: ["amount", "category", "type"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIParseResult;
    }
    return null;

  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw error;
  }
};

export const suggestCategory = async (
  description: string,
  categories: string[]
): Promise<string | null> => {
  if (!process.env.GEMINI_API_KEY) return null;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a transaction classifier. 
      Task: Map the transaction description "${description}" to exactly one of the following categories: ${JSON.stringify(categories)}.
      Rule: Return ONLY the exact category name from the list. If it doesn't fit perfectly, pick the closest logical match. If completely unrelated, return "General".`,
    });

    const text = response.text?.trim();
    return text ? text.replace(/^"|"$/g, '') : null;
  } catch (error) {
    console.error("Gemini Categorization Error:", error);
    return null;
  }
};

export const analyzeFinances = async (
  summary: string,
  language: 'ID' | 'EN' = 'ID'
): Promise<string> => {
  if (!process.env.GEMINI_API_KEY) return "API Key missing in environment.";

  try {
    const ai = getAI();
    const prompt = language === 'ID'
      ? `Kamu adalah asisten keuangan pribadi yang friendly tapi jujur. Gunakan bahasa santai seperti ngobrol sama teman.

PENTING: Dashboard sudah menampilkan semua angka dan statistik. JANGAN ULANGI data yang sudah terlihat!

Tugas kamu: Berikan 2-3 insight personal dan tips praktis yang BELUM terlihat di dashboard:
- Pola kebiasaan uang yang perlu diperhatikan
- Saran spesifik yang bisa langsung dipraktikkan
- Motivasi atau perspektif baru tentang keuangan

FORMATTING RULES (WAJIB IKUTI):
- Gunakan **kata** untuk highlight kata/frasa penting (contoh: **harus nabung**, **Rent**)
- Gunakan *kata* untuk emphasis ringan (contoh: *irit banget*, *lumayan boros*)
- Tulis dalam 2-3 paragraf pendek, masing-masing 2-3 kalimat
- Tone: Ramah, supportif, tapi tetap jujur dan to-the-point
- Hindari bahasa formal/kaku seperti "Anda", "Bapak/Ibu"

Data transaksi:
${summary}`
      : `You are a friendly but honest personal finance assistant. Use casual language like talking to a friend.

IMPORTANT: The dashboard already shows all numbers and statistics. DO NOT REPEAT visible data!

Your job: Give 2-3 personal insights and practical tips NOT visible on the dashboard:
- Money habit patterns worth noting
- Specific actionable advice
- Motivation or new perspective on finances

FORMATTING RULES (MUST FOLLOW):
- Use **word** to highlight important words/phrases (e.g., **save more**, **Rent**)
- Use *word* for light emphasis (e.g., *pretty good*, *a bit much*)
- Write in 2-3 short paragraphs, each 2-3 sentences
- Tone: Friendly, supportive, but honest and to-the-point
- Avoid formal language

Transaction data:
${summary}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    return response.text || "Could not generate insights.";
  } catch (error) {
    console.error(error);
    return "Error generating insights.";
  }
};

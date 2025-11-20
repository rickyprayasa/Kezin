import { GoogleGenAI, Type } from "@google/genai";
import { AIParseResult } from "../types";

// Enforce API Key from environment variable exclusively
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseTransactionWithGemini = async (
  text: string
): Promise<AIParseResult | null> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found in process.env.API_KEY");
    return null;
  }

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Parse the following financial text into a JSON object: "${text}". 
      If the user mentions buying something, it's EXPENSE. 
      If receiving money, INCOME. 
      If moving money, TRANSFER.
      Default date to today if not specified.`,
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
  if (!process.env.API_KEY) return null;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a transaction classifier. 
      Task: Map the transaction description "${description}" to exactly one of the following categories: ${JSON.stringify(categories)}.
      Rule: Return ONLY the exact category name from the list. If it doesn't fit perfectly, pick the closest logical match. If completely unrelated, return "General".`,
    });

    const text = response.text?.trim();
    // Clean up potential quotes or extra whitespace
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
  if (!process.env.API_KEY) return "API Key missing in environment.";
  
  try {
    const ai = getAI();
    const prompt = language === 'ID' 
      ? `Anda adalah penasihat keuangan dengan kepribadian yang asik, tegas, dan bergaya 'brutalist'. Analisis ringkasan keuangan berikut dan berikan 3 poin saran praktis dalam Bahasa Indonesia:\n\n${summary}`
      : `You are a financial advisor with a fun, brutalist personality. Analyze this financial summary and give 3 bullet points of advice in English:\n\n${summary}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "Could not generate insights.";
  } catch (error) {
    console.error(error);
    return "Error generating insights.";
  }
};
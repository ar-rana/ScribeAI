import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const gemini_api_key = process.env.GEMINI_API_KEY;
if (!gemini_api_key) {
  throw new Error("GEMINI_API_KEY .env variable is required");
}

const googleAI = new GoogleGenerativeAI(gemini_api_key);

export const geminiModel = googleAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export const generateSummary = async (transcript: string): Promise<string> => {
  try {
    const instructions = "You have to Generate the Short Summary of a Audio Transcript. ONLY return the summary for :- ";
    const result = await geminiModel.generateContent(instructions + transcript);
    const response = result.response;

    return response.text();
  } catch (error) {
    console.log("GEMINI response error", error);
  }
  return "";
}


import { GoogleGenAI } from "@google/genai";
import type { ProgressNote } from '../types';

export const generateProgressSummary = async (
  notes: ProgressNote[]
): Promise<string> => {
  // FIX: Adhere to Gemini API guidelines by using environment variables for the API key.
  // The API key check is removed as the key is expected to be configured in the environment.
  if (notes.length === 0) {
    return "No progress notes available to generate a summary.";
  }

  // FIX: Initialize GoogleGenAI with the API key from environment variables.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const formattedNotes = notes.map(note => 
    `Date: ${new Date(note.date).toLocaleDateString()}\nNotes: ${note.notes}\nSkills: ${Object.entries(note.skills).map(([skill, rating]) => `${skill} (${rating}/5)`).join(', ')}`
  ).join('\n\n---\n\n');

  const prompt = `
You are an expert driving instructor. Based on the following driving lesson progress notes for a student, write a concise, encouraging, and helpful summary. 
Highlight their strengths and areas for improvement. Structure the response in clear, easy-to-understand language.

The student's progress notes are as follows:

${formattedNotes}

Please provide the summary.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    // FIX: Correctly access the text property from the response, which was already correct but is good practice to verify.
    return response.text ?? "Could not generate a summary.";
  } catch (error) {
    console.error("Error generating summary with Gemini API:", error);
    // FIX: Update the error message to remove the suggestion to check the API key, as it's now an environment-level configuration.
    return `An error occurred while generating the summary. Please check your network connection. Details: ${error instanceof Error ? error.message : String(error)}`;
  }
};

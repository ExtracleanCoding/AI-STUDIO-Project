
import { GoogleGenAI } from "@google/genai";
import type { ProgressNote } from '../types';
import { ALL_DRIVING_SKILLS, SKILL_STATUS } from '../constants';

export const generateProgressSummary = async (
  notes: ProgressNote[]
): Promise<string> => {
  if (notes.length === 0) {
    return "No progress notes available to generate a summary.";
  }

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
    return response.text ?? "Could not generate a summary.";
  } catch (error) {
    console.error("Error generating summary with Gemini API:", error);
    return `An error occurred while generating the summary. Please check your network connection. Details: ${error instanceof Error ? error.message : String(error)}`;
  }
};

export const generateNextSkillsToFocusOn = async (
  skills: Record<string, number>
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const mastered = Object.entries(skills).filter(([, rating]) => rating >= SKILL_STATUS.MASTERED).map(([skill]) => skill);
    const inProgress = Object.entries(skills).filter(([, rating]) => rating >= SKILL_STATUS.IN_PROGRESS_MIN && rating < SKILL_STATUS.MASTERED).map(([skill, rating]) => `${skill} (current rating: ${rating}/5)`);
    const notStarted = ALL_DRIVING_SKILLS.filter(skill => !(skill in skills) || skills[skill] === 0);

    const prompt = `
You are an expert driving instructor creating a focused lesson plan for a student.
Based on their current skill levels, identify the top 3-5 most important skills they should work on next.
Prioritize skills that are foundational for other skills, or skills that are currently rated low but are crucial for passing a driving test.
Provide a brief, encouraging rationale for why each skill is important. Do not use markdown formatting for the response.

Current Skill Status:
- Mastered Skills: ${mastered.length > 0 ? mastered.join(', ') : 'None'}
- Skills in Progress: ${inProgress.length > 0 ? inProgress.join(', ') : 'None'}
- Skills Not Started: ${notStarted.length > 0 ? notStarted.join(', ') : 'None'}

Please provide a list of the next skills to focus on and the reason for each. For example:
- Roundabouts: To build confidence in approaching, navigating, and exiting multi-lane roundabouts safely.
- Parallel Parking: As this is a common maneuver in the driving test, mastering it is essential.
  `;
  
   try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text ?? "Could not generate recommendations.";
  } catch (error) {
    console.error("Error generating next skills with Gemini API:", error);
    return `An error occurred while generating recommendations. Please check your network connection.`;
  }
};

export const createCustomerFeedback = async (
    customerName: string,
    notes: ProgressNote[]
): Promise<string> => {
    if (notes.length === 0) {
        return "No progress notes available to generate feedback.";
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const formattedNotes = notes.map(note =>
        `Date: ${new Date(note.date).toLocaleDateString()}\nNotes: ${note.notes}\nSkills Practiced: ${Object.entries(note.skills).map(([skill, rating]) => `${skill} (rated ${rating}/5)`).join(', ')}`
    ).join('\n\n---\n\n');

    const prompt = `
You are a friendly and encouraging driving instructor writing a progress report email to a student named ${customerName}.
Based on the following lesson notes, create a warm and clear email body.

The email should include:
1. A positive opening.
2. A summary of what was covered in recent lessons.
3. Mention specific skills they are doing well in ("Strengths").
4. Gently point out areas for improvement ("Areas to Focus On").
5. A concluding remark about the next lesson or overall progress.

Keep the tone supportive and professional. Do not include a subject line or a formal greeting like "Hi ${customerName}," or a closing like "Best regards,". Just generate the main body of the email.

Here are the notes:

${formattedNotes}
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text ?? "Could not generate customer feedback.";
    } catch (error) {
        console.error("Error generating customer feedback with Gemini API:", error);
        return `An error occurred while generating feedback. Please check your network connection. Details: ${error instanceof Error ? error.message : String(error)}`;
    }
};

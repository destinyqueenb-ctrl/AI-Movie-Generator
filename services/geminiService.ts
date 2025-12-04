
import { GoogleGenAI, Type } from "@google/genai";
import type { MovieScript } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const movieScriptSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A creative and fitting title for the movie."
    },
    genre: {
      type: Type.STRING,
      description: "The primary genre of the movie (e.g., Sci-Fi, Thriller, Comedy)."
    },
    scenes: {
      type: Type.ARRAY,
      description: "An array of scenes that make up the movie's plot.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "A concise title for the scene (e.g., 'The Discovery', 'Escape from Sector 7')."
          },
          description: {
            type: Type.STRING,
            description: "A detailed description of the scene's setting, action, and mood."
          },
          dialogue: {
            type: Type.STRING,
            description: "A key piece of dialogue from the scene, including the character's name (e.g., 'RYO: We have to get out of here.')."
          },
          imagePrompt: {
            type: Type.STRING,
            description: "A descriptive prompt for an AI image generator to create a visual for this scene (e.g., 'cinematic shot, a lone astronaut standing before a glowing alien artifact on a desolate red planet, high detail')."
          },
        },
        required: ["title", "description", "dialogue", "imagePrompt"]
      }
    }
  },
  required: ["title", "genre", "scenes"]
};

export const generateMovieScript = async (idea: string): Promise<MovieScript> => {
  const prompt = `
    Based on the following movie idea, generate a compelling movie script structure.
    The script should include a title, genre, and a series of 5 to 7 scenes that outline a clear narrative arc (beginning, middle, and end).
    For each scene, provide a title, a detailed description, a line of key dialogue, and a descriptive prompt for an AI image generator to create a representative image.

    Movie Idea: "${idea}"

    Please format the output as a JSON object that strictly adheres to the provided schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: movieScriptSchema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("API returned an empty response.");
    }
    
    // The response is expected to be a valid JSON string matching the schema
    const parsedScript: MovieScript = JSON.parse(jsonText);
    return parsedScript;

  } catch (error) {
    console.error("Error generating movie script:", error);
    throw new Error("Failed to communicate with the Gemini API.");
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image data found in the response.");
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image with the Gemini API.");
  }
};
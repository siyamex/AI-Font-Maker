import { GoogleGenAI } from "@google/genai";
import { PathCommand } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We ask Gemini to output SVG Path data directly.
// This is "Smart Edit" - generating a shape description.
export const generateGlyphPath = async (
  description: string, 
  character: string
): Promise<string> => {
  // Using Gemini 3 Pro for advanced spatial reasoning
  const model = "gemini-3-pro-preview";
  
  const prompt = `
    You are a typography engineering AI.
    Task: Create a single SVG path string (d attribute) for the character "${character}".
    Style Description: ${description}.
    
    Constraints:
    1. Return ONLY the raw SVG path string. No markdown, no XML, no <path> tags.
    2. The path should be within a 1000x1000 coordinate box.
    3. Use integers or decimals with max 1 precision.
    4. Ensure the glyph is centered and upright.
    5. The path must be valid.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    
    const text = response.text?.trim() || '';
    // Basic cleanup in case model adds markdown code blocks
    const cleanText = text.replace(/```xml|```svg|```/g, '').trim();
    return cleanText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate glyph path.");
  }
};

export const critiqueGlyph = async (svgPath: string): Promise<string> => {
  const model = "gemini-3-pro-preview";
  
  const prompt = `
    Analyze this SVG path data for a font glyph:
    "${svgPath}"
    
    Provide a very short, 2-sentence critique on its legibility and style.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text?.trim() || "No critique available.";
  } catch (error) {
    return "Could not generate critique.";
  }
};
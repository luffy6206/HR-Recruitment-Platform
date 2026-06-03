import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI;
const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

/**
 * Service for analyzing resume text using Google Gemini
 * Extracts structured candidate information
 */
export const openaiResumeAnalyzerService = {
  /**
   * Analyze resume text and extract candidate info using Gemini
   * Returns structured JSON with candidate details
   */
  async analyzeResume(resumeText) {
    try {
      if (!resumeText || resumeText.trim().length === 0) {
        throw new Error("Resume text is empty");
      }

      // Limit text to prevent token overflow
      const maxChars = 15000;
      const truncatedText = resumeText.substring(0, maxChars);

      const prompt = `You are a professional resume parser. Analyze the following resume and extract key information in JSON format.

IMPORTANT: Return ONLY valid JSON (no markdown, no code blocks, no extra text).

{
  "name": "string",
  "email": "string or null",
  "phone": "string or null",
  "skills": ["string"],
  "experienceYears": number,
  "education": "string or null",
  "currentCompany": "string or null",
  "designation": "string or null",
  "location": "string or null",
  "summary": "string (2-3 sentences max)",
  "resumeScore": number
}

Resume Text:
${truncatedText}

Requirements:
1. name: Full name of candidate (required, string)
2. email: Email address (null if not found)
3. phone: Phone number (null if not found)
4. skills: Array of technical and professional skills
5. experienceYears: Total years of experience (integer, 0 if not found)
6. education: Highest degree or education (null if not found)
7. currentCompany: Current or last company name (null if not found)
8. designation: Current or last job title (null if not found)
9. location: City/Country (null if not found)
10. summary: Brief 2-3 sentence summary of candidate
11. resumeScore: Score 0-100 based on completeness (100 = complete, 50 = partial, 0 = minimal)

Return ONLY the JSON object, nothing else.`;

      const model = getGenAI().getGenerativeModel({ model: "gemini-pro" });
      const response = await model.generateContent(prompt);
      const content = response.response.text();

      if (!content) {
        throw new Error("No response from Gemini API");
      }

      // Clean response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.replace(/^```json\n?/gi, "").replace(/\n?```$/gi, "");
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.replace(/^```\n?/gi, "").replace(/\n?```$/gi, "");
      }

      // Try to parse JSON
      let analysis = {};
      try {
        analysis = JSON.parse(cleanContent);
      } catch (parseError) {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          // If all parsing fails, fallback to defaults
          analysis = {};
        }
      }

      // Normalize and validate data with fallbacks (no crash)
      const candidateName = (analysis.name && String(analysis.name).trim()) || "Unknown Candidate";

      return {
        name: candidateName,
        email: analysis.email ? String(analysis.email).toLowerCase().trim() : null,
        phone: analysis.phone ? String(analysis.phone).trim() : null,
        skills: Array.isArray(analysis.skills) ? analysis.skills.filter((s) => s) : [],
        experienceYears: Math.max(0, parseInt(analysis.experienceYears) || 0),
        education: analysis.education ? String(analysis.education).trim() : null,
        currentCompany: analysis.currentCompany ? String(analysis.currentCompany).trim() : null,
        designation: analysis.designation ? String(analysis.designation).trim() : null,
        location: analysis.location ? String(analysis.location).trim() : null,
        summary: analysis.summary ? String(analysis.summary).trim() : "",
        resumeScore: Math.min(100, Math.max(0, parseInt(analysis.resumeScore) || 0)),
      };
    } catch (error) {
      throw new Error(`Resume analysis failed: ${error.message}`);
    }
  },
};
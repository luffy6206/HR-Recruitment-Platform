import OpenAI from "openai";
import { ALL_SKILLS } from "../constants/skillDictionary.js";
import { fallbackParseResume } from "./resumeFallbackParser.js";

if (!process.env.XAI_API_KEY) {
  console.error("[GROK] ❌ XAI_API_KEY not found in environment");
  throw new Error("XAI_API_KEY not configured");
}

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});
console.log(
  "[GROK] API Key Present:",
  !!process.env.XAI_API_KEY
);

console.log(
  "[GROK] Key Length:",
  process.env.XAI_API_KEY?.length
);

/**
 * Service for analyzing resume text using Grok (xAI)
 * Parser is the PRIMARY source — AI enhances parser output only.
 * AI values never overwrite parser values with null.
 */
export const openaiResumeAnalyzerService = {
  /**
   * Analyze resume text and extract candidate info
   * 1. Run primary regex parser first
   * 2. Optionally enhance with Grok AI
   * 3. Merge: parser wins, AI fills gaps only
   */
  async analyzeResume(resumeText) {
    try {
      if (!resumeText || resumeText.trim().length === 0) {
        throw new Error("Resume text is empty");
      }

      console.log(
        `[GROK] Analyzing resume (${resumeText.length} chars)...`
      );

      // ── Step 1: Dictionary skill detection ──
      const detectedSkills = ALL_SKILLS.filter(skill =>
        resumeText.toLowerCase().includes(skill.toLowerCase())
      );

      console.log(
        `[SKILLS] Dictionary detected ${detectedSkills.length} skills`
      );

      // ── Step 2: Run primary parser (always) ──
      const parserResult = fallbackParseResume(resumeText, detectedSkills);
      console.log(
        `[PARSER] Primary parser completed: name="${parserResult.name}", email="${parserResult.email}", skills=${parserResult.skills.length}`
      );

      // ── Step 3: Attempt AI enhancement ──
      let aiAnalysis = null;
      try {
        aiAnalysis = await this._callGrokAPI(resumeText);
      } catch (apiError) {
        console.error(
          "[GROK] ❌ API call failed:",
          apiError.message
        );
        console.log("[GROK] Continuing with parser-only result...");
      }

      // ── Step 4: Merge — parser is primary, AI fills gaps only ──
      const result = this._mergeParserAndAI(parserResult, aiAnalysis, detectedSkills);

      // Attach metadata for observability
      result._meta = {
        model: aiAnalysis ? 'grok-3-mini' : 'parser-only',
        parserScore: parserResult.resumeScore,
        aiAvailable: !!aiAnalysis,
      };

      console.log(
        `[GROK] ✅ Final: "${result.name}", email: "${result.email}", skills: ${result.skills.length}, score: ${result.resumeScore}`
      );

      return result;
    } catch (error) {
      console.error("[GROK] ❌ Resume analysis failed:", error.message);
      // Last resort — parser only
      try {
        let fallbackSkills = null;
        if (typeof ALL_SKILLS !== "undefined") {
          fallbackSkills = ALL_SKILLS.filter(skill => resumeText.toLowerCase().includes(skill.toLowerCase()));
        }
        return fallbackParseResume(resumeText, fallbackSkills);
      } catch (fallbackError) {
        throw new Error(`Resume analysis failed: ${error.message}`);
      }
    }
  },

  /**
   * Call Grok API for AI-based resume analysis
   * @private
   */
  async _callGrokAPI(resumeText) {
    const maxChars = 15000;
    const truncatedText = resumeText.substring(0, maxChars);

    const prompt = `You are a professional ATS-specific resume parser. Analyze the following resume and extract ONLY the following JSON structure.

    IMPORTANT: Return ONLY valid JSON (no markdown, no code blocks, no extra text).
    Never hallucinate. Use null when information is missing.
    Extract all projects. Extract all certifications. Extract all experiences.
    Confidence scores must be 0-100.

    {
      "name": "",
      "email": "",
      "phone": "",
      "designation": "",
      "location": "",
      "education": [
        {
          "degree": "",
          "specialization": "",
          "college": "",
          "year": "",
          "cgpa": ""
        }
      ],
      "experience": [
        {
          "company": "",
          "role": "",
          "startDate": "",
          "endDate": "",
          "duration": ""
        }
      ],
      "projects": [
        {
          "name": "",
          "description": "",
          "technologies": []
        }
      ],
      "certifications": [
        {
          "name": "",
          "issuer": ""
        }
      ],
      "summary": "",
      "linkedin": "",
      "github": "",
      "confidenceScores": {}
    }

    Resume Text:
    ${truncatedText}
    `;

    console.log("[GROK] Prompt prepared for Grok API");
    console.log("[GROK] Prompt preview:", prompt.slice(0, 500).replace(/\n/g, " "));
    console.log("[GROK] Model selected: grok-3-mini");
    console.log("[GROK] Sending request to Grok API...");

    const completion = await client.chat.completions.create({
      model: "grok-3-mini",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: "You are an ATS resume parser. Return ONLY valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const content = (completion?.choices?.[0]?.message?.content ?? "").trim();

    if (!content) {
      console.error("[GROK] ❌ Empty response from API");
      return null;
    }

    console.log(
      `[GROK] ✅ Received response (${content.length} chars)`
    );
    console.log(
      `[GROK] Response preview: ${content
        .slice(0, 500)
        .replace(/\n/g, " ")}`
    );

    // Clean response — remove markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent
        .replace(/^```json\n?/gi, "")
        .replace(/\n?```$/gi, "");
    } else if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent
        .replace(/^```\n?/gi, "")
        .replace(/\n?```$/gi, "");
    }

    // Try to parse JSON
    try {
      const analysis = JSON.parse(cleanContent);
      console.log("[GROK] ✅ JSON parsed successfully");
      return analysis;
    } catch (parseError) {
      console.warn("[GROK] ⚠️ JSON parse failed, attempting recovery...");
      console.warn("[GROK] Raw content:", cleanContent.substring(0, 500));

      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const analysis = JSON.parse(jsonMatch[0]);
          console.log("[GROK] ✅ JSON recovered from raw response");
          return analysis;
        } catch (recoveryError) {
          console.error("[GROK] ❌ JSON recovery also failed");
          return null;
        }
      }

      console.error("[GROK] ❌ No JSON object found in response");
      return null;
    }
  },

  /**
   * Merge parser result with AI analysis
   * RULE: Parser values are primary. AI fills gaps only. AI never overwrites with null.
   * @private
   */
  _mergeParserAndAI(parserResult, aiAnalysis, detectedSkills) {
    // If no AI result, return parser as-is
    if (!aiAnalysis) {
      return parserResult;
    }

    // Helper: pick parser value if present, else AI value (never overwrite with null)
    const pick = (parserVal, aiVal) => {
      if (parserVal !== null && parserVal !== undefined && parserVal !== "Unknown Candidate") {
        return parserVal;
      }
      return aiVal !== null && aiVal !== undefined ? aiVal : parserVal;
    };

    // Merge skills: union of dictionary + parser + AI skills
    const mergedSkills = [
      ...new Set([
        ...detectedSkills,
        ...(parserResult.skills || []),
        ...(Array.isArray(aiAnalysis.skills) ? aiAnalysis.skills : [])
      ])
    ];

    // Merge arrays: parser wins if non-empty, else use AI
    const mergeArray = (parserArr, aiArr) => {
      if (Array.isArray(parserArr) && parserArr.length > 0) return parserArr;
      if (Array.isArray(aiArr) && aiArr.length > 0) return aiArr;
      return parserArr || [];
    };

    // Education — normalize for toString compat
    let edu = mergeArray(parserResult.education, aiAnalysis.education);
    if (Array.isArray(edu) && edu.length > 0) {
      Object.defineProperty(edu, 'toString', {
        value: function () {
          return this.map(e => `${e.degree || ''} ${e.specialization || ''} ${e.college || ''}`).join(', ').trim();
        },
        enumerable: false
      });
    }

    const result = {
      name: pick(parserResult.name, aiAnalysis.name ? String(aiAnalysis.name).trim() : null),
      email: pick(parserResult.email, aiAnalysis.email ? String(aiAnalysis.email).toLowerCase().trim() : null),
      phone: pick(parserResult.phone, aiAnalysis.phone ? String(aiAnalysis.phone).trim() : null),
      linkedin: pick(parserResult.linkedin, aiAnalysis.linkedin ? String(aiAnalysis.linkedin).trim() : null),
      github: pick(parserResult.github, aiAnalysis.github ? String(aiAnalysis.github).trim() : null),
      location: pick(parserResult.location, aiAnalysis.location ? String(aiAnalysis.location).trim() : null),
      skills: mergedSkills,
      inferredSkills: parserResult.inferredSkills || [],
      experienceYears: Math.max(
        parserResult.experienceYears || 0,
        Math.max(0, parseInt(aiAnalysis.experienceYears) || 0)
      ),
      experience: mergeArray(parserResult.experience, aiAnalysis.experience),
      education: edu,
      projects: mergeArray(parserResult.projects, aiAnalysis.projects),
      certifications: mergeArray(parserResult.certifications, aiAnalysis.certifications),
      currentCompany: pick(
        parserResult.currentCompany,
        aiAnalysis.currentCompany ? String(aiAnalysis.currentCompany).trim()
          : (Array.isArray(aiAnalysis.experience) && aiAnalysis.experience.length > 0 ? aiAnalysis.experience[0].company : null)
      ),
      designation: pick(parserResult.designation, aiAnalysis.designation ? String(aiAnalysis.designation).trim() : null),
      summary: pick(parserResult.summary, aiAnalysis.summary ? String(aiAnalysis.summary).trim() : null),
      resumeScore: Math.max(
        parserResult.resumeScore || 0,
        Math.min(100, Math.max(0, parseInt(aiAnalysis.resumeScore) || 0))
      ),
      confidenceScores: {
        ...(parserResult.confidenceScores || {}),
        ...(typeof aiAnalysis.confidenceScores === 'object' && aiAnalysis.confidenceScores !== null
          ? aiAnalysis.confidenceScores
          : {}),
      },
    };

    return result;
  },
};
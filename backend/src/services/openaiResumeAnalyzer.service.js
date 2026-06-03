import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI;
const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[GEMINI] ❌ GEMINI_API_KEY not found in environment");
      throw new Error("Gemini API key not configured");
    }
    console.log(`[GEMINI] ✅ API key loaded (${apiKey.substring(0, 6)}...)`);
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

/**
 * Regex-based fallback parser for when Gemini is unavailable
 * Extracts basic candidate info directly from resume text
 */
function fallbackParseResume(resumeText) {
  console.log("[FALLBACK] Using regex-based resume parser");

  // Extract email
  const emailMatch = resumeText.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );
  const email = emailMatch ? emailMatch[0].toLowerCase().trim() : null;

  // Extract phone (various formats)
  const phoneMatch = resumeText.match(
    /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/
  );
  const phone = phoneMatch ? phoneMatch[0].trim() : null;

  // Extract name - try first non-empty line that looks like a name
  let name = "Unknown Candidate";
  const lines = resumeText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  for (const line of lines.slice(0, 5)) {
    // Check first 5 lines
    const cleaned = line.replace(/[^a-zA-Z\s.-]/g, "").trim();
    if (
      cleaned.length >= 3 &&
      cleaned.length <= 60 &&
      cleaned.split(/\s+/).length >= 2 &&
      cleaned.split(/\s+/).length <= 5 &&
      !/[@.com]/.test(line) &&
      !/\d{3}/.test(line)
    ) {
      name = cleaned;
      break;
    }
  }

  // Extract skills by looking for common tech keywords
  const skillKeywords = [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Python",
    "Java",
    "C++",
    "C#",
    "SQL",
    "MongoDB",
    "PostgreSQL",
    "AWS",
    "Docker",
    "Kubernetes",
    "Git",
    "HTML",
    "CSS",
    "Angular",
    "Vue",
    "Express",
    "Django",
    "Flask",
    "Spring",
    "REST",
    "GraphQL",
    "Redis",
    "Linux",
    "Agile",
    "Scrum",
    "CI/CD",
    "Machine Learning",
    "AI",
    "Data Science",
    "PHP",
    "Ruby",
    "Swift",
    "Kotlin",
    "Go",
    "Rust",
  ];
  const textLower = resumeText.toLowerCase();
  const skills = skillKeywords.filter((s) =>
    textLower.includes(s.toLowerCase())
  );

  // Extract years of experience
  const expMatch = resumeText.match(
    /(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i
  );
  const experienceYears = expMatch ? parseInt(expMatch[1]) : 0;

  console.log(
    `[FALLBACK] Extracted: name="${name}", email="${email}", phone="${phone}", skills=${skills.length}`
  );

  return {
    name,
    email,
    phone,
    skills,
    experienceYears,
    education: null,
    currentCompany: null,
    designation: null,
    location: null,
    summary: `Candidate resume parsed via fallback (AI unavailable). ${skills.length} skills detected.`,
    resumeScore: Math.min(100, skills.length * 5 + (email ? 20 : 0) + (phone ? 10 : 0)),
  };
}

/**
 * Service for analyzing resume text using Google Gemini
 * Extracts structured candidate information
 */
export const openaiResumeAnalyzerService = {
  /**
   * Analyze resume text and extract candidate info using Gemini
   * Returns structured JSON with candidate details
   * Falls back to regex parser if Gemini is unavailable
   */
  async analyzeResume(resumeText) {
    try {
      if (!resumeText || resumeText.trim().length === 0) {
        throw new Error("Resume text is empty");
      }

      console.log(
        `[GEMINI] Analyzing resume (${resumeText.length} chars)...`
      );

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

      console.log("[GEMINI] Prompt prepared for Gemini API");
      console.log("[GEMINI] Prompt preview:", prompt.slice(0, 500).replace(/\n/g, " "));
      console.log("[GEMINI] Model selected: gemini-2.0-flash");

      let model;
      try {
        model = getGenAI().getGenerativeModel({ model: "gemini-2.0-flash" });
      } catch (keyError) {
        console.error("[GEMINI] ❌ Failed to init model:", keyError.message);
        return fallbackParseResume(resumeText);
      }

      console.log("[GEMINI] Sending request to Gemini API...");
      let response;
      try {
        response = await model.generateContent(prompt);
      } catch (apiError) {
        console.error(
          "[GEMINI] ❌ API call failed:",
          apiError.message
        );
        console.log("[GEMINI] Falling back to regex parser...");
        return fallbackParseResume(resumeText);
      }

      let content = "";

      if (typeof response?.response?.text === "function") {
        content = await response.response.text();
      } else if (typeof response?.response === "string") {
        content = response.response;
      } else if (Array.isArray(response?.output)) {
        content = response.output
          .map((item) => {
            if (typeof item?.content === "string") return item.content;
            if (Array.isArray(item?.content)) {
              return item.content.map((c) => c?.text ?? "").join(" ");
            }
            return "";
          })
          .join(" ");
      }

      content = String(content ?? "").trim();

      if (!content) {
        console.error("[GEMINI] ❌ Empty response from API");
        return fallbackParseResume(resumeText);
      }

      console.log(
        `[GEMINI] ✅ Received response (${content.length} chars)`
      );
      console.log(
        `[GEMINI] Response preview: ${content
          .slice(0, 500)
          .replace(/\n/g, " ")}`
      );

      // Clean response - remove markdown code blocks if present
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
      let analysis = {};
      try {
        analysis = JSON.parse(cleanContent);
        console.log("[GEMINI] ✅ JSON parsed successfully");
      } catch (parseError) {
        console.warn(
          "[GEMINI] ⚠️ JSON parse failed, attempting recovery..."
        );
        console.warn("[GEMINI] Raw content:", cleanContent.substring(0, 500));

        // Try to extract JSON from the response
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            analysis = JSON.parse(jsonMatch[0]);
            console.log("[GEMINI] ✅ JSON recovered from raw response");
          } catch (recoveryError) {
            console.error(
              "[GEMINI] ❌ JSON recovery also failed, using fallback"
            );
            return fallbackParseResume(resumeText);
          }
        } else {
          console.error(
            "[GEMINI] ❌ No JSON object found in response, using fallback"
          );
          return fallbackParseResume(resumeText);
        }
      }

      // Normalize and validate data with fallbacks (no crash)
      const candidateName =
        (analysis.name && String(analysis.name).trim()) || "Unknown Candidate";

      const result = {
        name: candidateName,
        email: analysis.email
          ? String(analysis.email).toLowerCase().trim()
          : null,
        phone: analysis.phone ? String(analysis.phone).trim() : null,
        skills: Array.isArray(analysis.skills)
          ? analysis.skills.filter((s) => s)
          : [],
        experienceYears: Math.max(0, parseInt(analysis.experienceYears) || 0),
        education: analysis.education
          ? String(analysis.education).trim()
          : null,
        currentCompany: analysis.currentCompany
          ? String(analysis.currentCompany).trim()
          : null,
        designation: analysis.designation
          ? String(analysis.designation).trim()
          : null,
        location: analysis.location
          ? String(analysis.location).trim()
          : null,
        summary: analysis.summary ? String(analysis.summary).trim() : "",
        resumeScore: Math.min(
          100,
          Math.max(0, parseInt(analysis.resumeScore) || 0)
        ),
      };

      // Attach metadata for observability
      result._meta = {
        model: 'gemini-2.0-flash',
        promptPreview: prompt.slice(0, 500),
        raw: content,
      };

      console.log(
        `[GEMINI] ✅ Candidate: "${result.name}", email: "${result.email}", skills: ${result.skills.length}`
      );

      return result;
    } catch (error) {
      console.error("[GEMINI] ❌ Resume analysis failed:", error.message);
      // Last resort - use fallback parser instead of throwing
      try {
        return fallbackParseResume(resumeText);
      } catch (fallbackError) {
        throw new Error(`Resume analysis failed: ${error.message}`);
      }
    }
  },
};
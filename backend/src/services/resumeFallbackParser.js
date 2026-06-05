import { ALL_SKILLS, SKILL_CATEGORIES, DEGREE_KEYWORDS, COLLEGE_KEYWORDS, COMMON_CERTIFICATIONS } from "../constants/skillDictionary.js";
import { COLLEGE_ALIASES } from "../constants/collegeDictionary.js";
// ─── Placeholder Detection ──────────────────────────────────────────────────

const PLACEHOLDER_EMAILS = new Set([
  "email@email.com",
  "example@example.com",
  "test@test.com",
  "yourname@email.com",
  "firstname.lastname@email.com",
  "name@example.com",
  "user@example.com",
  "your.email@example.com",
  "john.doe@email.com",
  "jane.doe@email.com",
]);

const PLACEHOLDER_PHONES = new Set([
  "(541) 754-3010",
  "5417543010",
  "1234567890",
  "0000000000",
  "9999999999",
  "(123) 456-7890",
  "1234567890",
  "(000) 000-0000",
  "000-000-0000",
  "(999) 999-9999",
  "999-999-9999",
  "(555) 555-5555",
  "555-555-5555",
  "+1 (234) 567-8901",
]);

/**
 * Normalize a phone string to digits-only for comparison
 */
function normalizePhone(phone) {
  return phone.replace(/[^\d]/g, "");
}

function isPlaceholderPhone(phone) {
  if (!phone) return true;
  const cleaned = phone.trim();
  const digits = normalizePhone(cleaned);

  // Check exact matches
  if (PLACEHOLDER_PHONES.has(cleaned)) return true;

  // Check digits-only matches
  for (const p of PLACEHOLDER_PHONES) {
    if (normalizePhone(p) === digits) return true;
  }

  // All same digit (0000000000, 9999999999, etc.)
  if (/^(\d)\1{9}$/.test(digits)) return true;

  // Sequential ascending (1234567890)
  if (digits === "1234567890") return true;

  return false;
}

function detectCollege(text) {
  const lowerText = text.toLowerCase();

  for (const [college, aliases] of Object.entries(COLLEGE_ALIASES)) {
    const found = aliases.some(alias =>
      lowerText.includes(alias.toLowerCase())
    );

    if (found) {
      return college;
    }
  }

  return null;
}

function isPlaceholderEmail(email) {
  if (!email) return true;
  return PLACEHOLDER_EMAILS.has(email.toLowerCase().trim());
}

// ─── Contact Extraction ─────────────────────────────────────────────────────

/**
 * Extract email from resume text, filtering placeholders
 */
function extractEmail(text) {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  for (const m of matches) {
    const email = m.toLowerCase().trim();
    if (!isPlaceholderEmail(email)) return email;
  }
  return null;
}

/**
 * Extract phone from resume text, filtering placeholders
 */
function extractPhone(text) {
  const phoneRegex = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\d{5}[\s.-]?\d{5})/g;
  const matches = text.match(phoneRegex) || [];
  for (const m of matches) {
    const phone = m.trim();
    if (!isPlaceholderPhone(phone)) return phone;
  }
  return null;
}

/**
 * Extract LinkedIn profile URL
 */
function extractLinkedIn(text) {
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-/]+/i;
  const match = text.match(linkedinRegex);
  if (match) {
    let url = match[0].trim().replace(/\/+$/, "");
    if (!url.startsWith("http")) url = "https://" + url;
    return url;
  }
  return null;
}

/**
 * Extract GitHub profile URL
 */
function extractGitHub(text) {
  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_\-]+/i;
  const match = text.match(githubRegex);
  if (match) {
    let url = match[0].trim().replace(/\/+$/, "");
    if (!url.startsWith("http")) url = "https://" + url;
    return url;
  }
  return null;
}

/**
 * Extract location from resume text
 * Looks for "City, State" / "City, Country" patterns near top of resume
 */
function extractLocation(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  // Search top 15 lines for location patterns
  const topLines = lines.slice(0, 15);

  // Pattern: City, State (2-letter) or City, State Name
  const locationPatterns = [
    /([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})\b/,                    // "San Francisco, CA"
    /([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)/,              // "Moscow, Idaho"
    /([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s*[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/,  // multi-word
  ];

  for (const line of topLines) {
    // Skip lines that are clearly emails, phones, URLs, or names-only
    if (/@/.test(line)) continue;
    if (/linkedin\.com|github\.com/i.test(line)) continue;

    for (const pattern of locationPatterns) {
      const match = line.match(pattern);
      if (match) {
        const loc = match[1].trim();
        // Filter out things that look like degree/section headers
        if (/education|experience|project|skill|certif|summary|objective/i.test(loc)) continue;
        if (loc.length >= 4 && loc.length <= 60) return loc;
      }
    }
  }
  return null;
}

/**
 * Extract candidate name from top 10 lines
 * Prefers largest capitalized text block (ALL CAPS names like "MICHELLE LOPEZ")
 * Ignores addresses, emails, phone numbers
 */
function extractName(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const top10 = lines.slice(0, 10);

  // Pass 1: Look for ALL-CAPS name (highest priority — typical resume header)
  for (const line of top10) {
    // Skip lines with emails, phones, URLs, digits
    if (/@/.test(line)) continue;
    if (/\d{3}/.test(line)) continue;
    if (/linkedin\.com|github\.com|http/i.test(line)) continue;
    if (/,\s*[A-Z]{2}\s*\d{5}/.test(line)) continue; // Address with zip

    // Extract ALL-CAPS words
    const capsOnly = line.replace(/[^A-Z\s.\-']/g, "").trim();
    const words = capsOnly.split(/\s+/).filter(w => w.length >= 2);

    if (words.length >= 2 && words.length <= 5) {
      // Verify the original line is predominantly uppercase
      const upperCount = (line.match(/[A-Z]/g) || []).length;
      const lowerCount = (line.match(/[a-z]/g) || []).length;
      if (upperCount > lowerCount) {
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      }
    }
  }

  // Pass 2: Look for a mixed-case name (e.g. "Michelle Lopez")
  for (const line of top10) {
    if (/@/.test(line)) continue;
    if (/\d{3}/.test(line)) continue;
    if (/linkedin\.com|github\.com|http/i.test(line)) continue;
    if (/,\s*[A-Z]{2}\s*\d{5}/.test(line)) continue;

    const cleaned = line.replace(/[^a-zA-Z\s.\-']/g, "").trim();
    const words = cleaned.split(/\s+/).filter(w => w.length >= 2);

    if (
      words.length >= 2 &&
      words.length <= 5 &&
      cleaned.length >= 3 &&
      cleaned.length <= 60
    ) {
      // Check first word starts with uppercase
      if (/^[A-Z]/.test(words[0])) {
        return cleaned;
      }
    }
  }

  return "Unknown Candidate";
}

// ─── Section Detection ──────────────────────────────────────────────────────

const SECTION_PATTERNS = {
  EDUCATION: /^(?:={0,3}\s*)?(?:EDUCATION|ACADEMIC|ACADEMICS|EDUCATIONAL\s+BACKGROUND|ACADEMIC\s+QUALIFICATIONS?)(?:\s*[:|\-=]*)?\s*$/i,
  EXPERIENCE: /^(?:={0,3}\s*)?(?:(?:WORK\s+)?EXPERIENCE|EMPLOYMENT(?:\s+HISTORY)?|PROFESSIONAL\s+EXPERIENCE|CAREER\s+HISTORY|WORK\s+HISTORY)(?:\s*[:|\-=]*)?\s*$/i,
  PROJECTS: /^(?:={0,3}\s*)?(?:PROJECTS?|PERSONAL\s+PROJECTS?|ACADEMIC\s+PROJECTS?|KEY\s+PROJECTS?)(?:\s*[:|\-=]*)?\s*$/i,
  CERTIFICATIONS: /^(?:={0,3}\s*)?(?:CERTIFICATIONS?|CERTIFICATES?|LICENSES?\s*(?:&|AND)?\s*CERTIFICATIONS?|PROFESSIONAL\s+CERTIFICATIONS?)(?:\s*[:|\-=]*)?\s*$/i,
  SKILLS: /^(?:={0,3}\s*)?(?:(?:TECHNICAL\s+)?SKILLS|CORE\s+COMPETENC(?:IES|Y)|TECHNOLOGIES|TOOLS?\s*(?:&|AND)?\s*TECHNOLOGIES)(?:\s*[:|\-=]*)?\s*$/i,
};

/**
 * Detect section boundaries in resume text
 * Returns a map of section name → { start, end } line indices
 */
function detectSections(lines) {
  const sections = {};
  const sectionOrder = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    for (const [sectionName, pattern] of Object.entries(SECTION_PATTERNS)) {
      if (pattern.test(line)) {
        sectionOrder.push({ name: sectionName, start: i + 1 }); // content starts on next line
        break;
      }
    }
  }

  // Set end boundaries
  for (let i = 0; i < sectionOrder.length; i++) {
    const current = sectionOrder[i];
    const next = sectionOrder[i + 1];
    sections[current.name] = {
      start: current.start,
      end: next ? next.start - 1 : lines.length,
    };
  }

  return sections;
}

/**
 * Get the text lines for a specific section
 */
function getSectionLines(lines, sections, sectionName) {
  const section = sections[sectionName];
  if (!section) return [];
  return lines.slice(section.start, section.end).filter(l => l.trim().length > 0);
}

// ─── Section Parsers ────────────────────────────────────────────────────────

/**
 * Parse EDUCATION section into structured objects
 */
function parseEducation(sectionLines) {
  if (!sectionLines || sectionLines.length === 0) return [];

  const entries = [];
  let current = null;

  const STOP_WORDS = /^(?:={0,3}\s*)?(?:PROJECTS?|CERTIFICATIONS?|SKILLS|EXPERIENCE|WORK\s+EXPERIENCE|ACHIEVEMENTS|EXTRACURRICULAR|LANGUAGES)(?:\s*[:|\-=]*)?\s*$/i;

  for (const line of sectionLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Terminate parsing if we hit another section header
    if (STOP_WORDS.test(trimmed)) {
      break;
    }

    // Check if line contains a degree keyword
    const hasDegree = DEGREE_KEYWORDS.some(d => trimmed.toUpperCase().includes(d.toUpperCase()));

    // Check if line contains a college keyword
    const hasCollege = COLLEGE_KEYWORDS.some(c => trimmed.toLowerCase().includes(c.toLowerCase()));

    // Year pattern: 4-digit year
    const yearMatch = trimmed.match(/\b(19|20)\d{2}\b/g);
    // CGPA pattern
    const cgpaMatch = trimmed.match(/(?:CGPA|GPA|GRADE|cgpa|gpa)[\s:]*(\d+\.?\d*)/i) ||
      trimmed.match(/(\d+\.\d+)\s*(?:\/\s*(?:10|4)(?:\.0)?|CGPA|GPA)/i);

    if (hasDegree || hasCollege) {
      // New entry
      if (current) entries.push(current);
      current = { degree: null, specialization: null, college: null, year: null, cgpa: null };

      // Extract degree
      for (const d of DEGREE_KEYWORDS) {
        if (trimmed.toUpperCase().includes(d.toUpperCase())) {
          current.degree = d;
          break;
        }
      }

      // Try to extract specialization and college from text after degree keyword
      if (current.degree) {
        const afterDegree = trimmed.split(new RegExp(current.degree.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
        if (afterDegree[1]) {
          // Remove year at the end e.g. "Expected 2027" or "2024"
          let specStr = afterDegree[1].replace(/^[\s\-–—,in]+/i, "").replace(/[,\-–—]?\s*(?:Expected\s*)?\d{4}.*$/i, "").trim();

          if (hasCollege) {
            // Split by common separators to isolate college
            const parts = specStr.split(/\s*(?:[-–—|]|\s,\s)\s*/);
            let colIdx = -1;
            for (let i = 0; i < parts.length; i++) {
              if (COLLEGE_KEYWORDS.some(c => parts[i].toLowerCase().includes(c.toLowerCase()))) {
                colIdx = i;
                break;
              }
            }

            if (colIdx > 0) {
              current.specialization = parts.slice(0, colIdx).join(" ").trim();
              current.college = parts.slice(colIdx).join(" ").trim();
            } else if (colIdx === 0) {
              current.college = specStr;
            } else {
              current.specialization = specStr;
              current.college = trimmed.replace(/[,\-–—]?\s*(?:Expected\s*)?\d{4}.*$/i, "").trim();
            }
          } else {
            if (specStr.length > 2 && specStr.length < 80) {
              current.specialization = specStr;
            }
          }
        }
      } else if (hasCollege) {
        current.college = trimmed.replace(/[,\-–—]?\s*(?:Expected\s*)?\d{4}.*$/i, "").trim();
      }

      if (yearMatch) {
        current.year = yearMatch[yearMatch.length - 1]; // take the latest year
      }

      if (cgpaMatch) {
        current.cgpa = cgpaMatch[1];
      }
    } else if (current) {
      // Continuation of current entry — look for college, year, cgpa
      if (!current.college && hasCollege) {
        current.college = trimmed;
      } else if (!current.college && trimmed.length > 5 && !trimmed.startsWith("•") && !trimmed.startsWith("-")) {
        // Might be the college name
        current.college = trimmed;
      }

      if (!current.year && yearMatch) {
        current.year = yearMatch[yearMatch.length - 1];
      }

      if (!current.cgpa && cgpaMatch) {
        current.cgpa = cgpaMatch[1];
      }
    } else {
      // First line without degree — could be college name leading
      current = { degree: null, specialization: null, college: trimmed, year: null, cgpa: null };
      if (yearMatch) current.year = yearMatch[yearMatch.length - 1];
      if (cgpaMatch) current.cgpa = cgpaMatch[1];
    }
  }

  if (current) entries.push(current);

  return entries;
}

/**
 * Parse month-year date string into a Date object for duration calculation
 */
function parseDateStr(dateStr) {
  if (!dateStr) return null;
  const cleaned = dateStr.trim().toLowerCase();
  if (cleaned === "present" || cleaned === "current" || cleaned === "now") return new Date();

  // Try "Mon YYYY" or "Month YYYY"
  const monthYear = cleaned.match(/(\w+)\s+(\d{4})/);
  if (monthYear) {
    const months = {
      jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
      apr: 3, april: 3, may: 4, jun: 5, june: 5,
      jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8, sept: 8,
      oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
    };
    const monthNum = months[monthYear[1].toLowerCase()];
    if (monthNum !== undefined) {
      return new Date(parseInt(monthYear[2]), monthNum);
    }
  }

  // Try just "YYYY"
  const yearOnly = cleaned.match(/\b(19|20)\d{2}\b/);
  if (yearOnly) {
    return new Date(parseInt(yearOnly[0]), 0);
  }

  return null;
}

/**
 * Parse EXPERIENCE section into structured objects
 */
function parseExperience(sectionLines) {
  if (!sectionLines || sectionLines.length === 0) return [];

  const entries = [];
  let current = null;
  const descriptionLines = [];

  // Date range pattern: "Mon YYYY - Mon YYYY" or "Mon YYYY - Present"
  const dateRangeRegex = /(\w+\.?\s+\d{4})\s*[-–—to]+\s*(\w+\.?\s+\d{4}|present|current|now)/i;
  // Also try: "YYYY - YYYY" or "YYYY - Present"
  const yearRangeRegex = /\b(\d{4})\s*[-–—to]+\s*(\d{4}|present|current|now)\b/i;

  function flushCurrent() {
    if (current) {
      current.description = descriptionLines.join(" ").trim() || null;
      entries.push(current);
      descriptionLines.length = 0;
    }
  }

  for (const line of sectionLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const dateMatch = trimmed.match(dateRangeRegex) || trimmed.match(yearRangeRegex);

    // Detect new entry: line with a date range, or a line that looks like a company/role header
    if (dateMatch) {
      // This line or the previous line is a new entry
      const startDate = dateMatch[1].trim();
      const endDate = dateMatch[2].trim();

      // Calculate duration
      const startD = parseDateStr(startDate);
      const endD = parseDateStr(endDate);
      let duration = null;
      if (startD && endD) {
        const months = (endD.getFullYear() - startD.getFullYear()) * 12 + (endD.getMonth() - startD.getMonth());
        const years = Math.floor(months / 12);
        const remainMonths = months % 12;
        duration = years > 0 ? `${years} year${years > 1 ? 's' : ''}${remainMonths > 0 ? ` ${remainMonths} month${remainMonths > 1 ? 's' : ''}` : ''}` : `${remainMonths} month${remainMonths > 1 ? 's' : ''}`;
      }

      // The text before the date is likely the role or company
      const beforeDate = trimmed.replace(dateRangeRegex, "").replace(yearRangeRegex, "").replace(/[|,\-–—]+$/, "").trim();

      flushCurrent();

      current = {
        company: null,
        role: null,
        startDate,
        endDate,
        duration,
        description: null,
      };

      // Try to split "Role at Company" or "Company - Role"
      if (beforeDate) {
        const atSplit = beforeDate.split(/\s+at\s+/i);
        const dashSplit = beforeDate.split(/\s*[-–—|]\s*/);

        if (atSplit.length === 2) {
          current.role = atSplit[0].trim();
          current.company = atSplit[1].trim();
        } else if (dashSplit.length === 2) {
          current.company = dashSplit[0].trim();
          current.role = dashSplit[1].trim();
        } else {
          current.role = beforeDate;
        }
      }
    } else if (current && !current.company && /^[A-Z]/.test(trimmed) && !trimmed.startsWith("•") && !trimmed.startsWith("-") && trimmed.length < 80) {
      // Continuation — likely company name if role was set but company wasn't
      current.company = trimmed;
    } else if (current && !current.role && /^[A-Z]/.test(trimmed) && !trimmed.startsWith("•") && !trimmed.startsWith("-") && trimmed.length < 80 && !dateRangeRegex.test(trimmed)) {
      // Could be a role line
      current.role = trimmed;
    } else if (current) {
      // Description bullets
      descriptionLines.push(trimmed.replace(/^[•\-*]\s*/, ""));
    } else {
      // No current entry yet — this might be a company/role header without dates
      // Start a new entry
      flushCurrent();
      current = {
        company: null,
        role: trimmed,
        startDate: null,
        endDate: null,
        duration: null,
        description: null,
      };
    }
  }

  flushCurrent();
  return entries;
}

/**
 * Parse PROJECTS section into structured objects
 * Extract technologies using ALL_SKILLS matching
 */
function parseProjects(sectionLines) {
  if (!sectionLines || sectionLines.length === 0) return [];

  const entries = [];
  let current = null;
  const descLines = [];

  function flushProject() {
    if (current) {
      const fullDesc = descLines.join(" ").trim();
      current.description = fullDesc || null;

      // Extract technologies from description using ALL_SKILLS
      const techs = new Set();
      const fullText = `${current.name || ""} ${fullDesc}`.toLowerCase();
      for (const skill of ALL_SKILLS) {
        if (fullText.includes(skill.toLowerCase())) {
          techs.add(skill);
        }
      }
      current.technologies = [...techs];

      entries.push(current);
      descLines.length = 0;
    }
  }

  for (const line of sectionLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // A project title: non-bullet line, relatively short, often title-cased or bold
    const isBullet = /^[•\-*]/.test(trimmed);
    const isShortHeader = !isBullet && trimmed.length < 80 && /^[A-Z]/.test(trimmed);
    const hasColon = trimmed.includes(":");

    if (isShortHeader && !current) {
      // First project
      current = { name: trimmed.replace(/[:–—\-|]+$/, "").trim(), description: null, technologies: [] };
    } else if (isShortHeader && current && !isBullet && descLines.length > 0) {
      // New project header (we had content for previous)
      flushProject();
      current = { name: trimmed.replace(/[:–—\-|]+$/, "").trim(), description: null, technologies: [] };
    } else if (isShortHeader && current && descLines.length === 0 && !hasColon) {
      // Could be a subtitle / tech line for current project
      descLines.push(trimmed);
    } else if (current) {
      descLines.push(trimmed.replace(/^[•\-*]\s*/, ""));
    } else {
      // Start new project even from bullet text
      current = { name: trimmed.replace(/^[•\-*]\s*/, "").replace(/[:–—\-|]+$/, "").trim(), description: null, technologies: [] };
    }
  }

  flushProject();
  return entries;
}

/**
 * Parse CERTIFICATIONS section into structured objects
 */
function parseCertifications(sectionLines) {
  if (!sectionLines || sectionLines.length === 0) return [];

  const entries = [];

  for (const line of sectionLines) {
    const trimmed = line.trim().replace(/^[•\-*]\s*/, "");
    if (!trimmed || trimmed.length < 3) continue;

    let name = trimmed;
    let issuer = null;

    // Try to split on " - ", " by ", " from ", " | "
    const splitPatterns = [/\s*[-–—|]\s*/, /\s+by\s+/i, /\s+from\s+/i, /\s*,\s+issued by\s+/i];
    for (const pat of splitPatterns) {
      const parts = trimmed.split(pat);
      if (parts.length >= 2 && parts[0].length > 3) {
        name = parts[0].trim();
        issuer = parts.slice(1).join(" ").trim();
        break;
      }
    }

    // Check against known certifications for better matching
    for (const cert of COMMON_CERTIFICATIONS) {
      if (trimmed.toLowerCase().includes(cert.toLowerCase())) {
        name = cert;
        // Issuer is the rest
        const rest = trimmed.replace(new RegExp(cert.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), "").trim().replace(/^[-–—|,]\s*/, "");
        if (rest.length > 2) issuer = rest;
        break;
      }
    }

    entries.push({ name, issuer });
  }

  return entries;
}

/**
 * Parse SKILLS section — use ALL_SKILLS dictionary matching
 */
function parseSkills(sectionLines, fullText) {
  const skills = new Set();
  const textToSearch = sectionLines.length > 0 ? sectionLines.join(" ") : fullText;
  const textLower = textToSearch.toLowerCase();

  for (const skill of ALL_SKILLS) {
    if (textLower.includes(skill.toLowerCase())) {
      skills.add(skill);
    }
  }

  return [...skills];
}

// ─── Experience Years Calculation ───────────────────────────────────────────

/**
 * Calculate total experience years from parsed experience entries
 * Falls back to text pattern matching
 */
function calculateExperienceYears(experienceEntries, fullText) {
  // Method 1: Sum durations from parsed experience entries
  let totalMonths = 0;
  let hasCalculated = false;

  for (const entry of experienceEntries) {
    if (entry.startDate && entry.endDate) {
      const start = parseDateStr(entry.startDate);
      const end = parseDateStr(entry.endDate);
      if (start && end) {
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        if (months > 0) {
          totalMonths += months;
          hasCalculated = true;
        }
      }
    }
  }

  if (hasCalculated && totalMonths > 0) {
    return Math.round(totalMonths / 12);
  }

  // Method 2: Regex patterns from text
  const patterns = [
    /(\d{1,2})\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/i,
    /(?:experience|exp)(?:\s+of)?\s*:?\s*(\d{1,2})\+?\s*(?:years?|yrs?)/i,
    /(\d{1,2})\+?\s*(?:years?|yrs?)\s+(?:in|of)\s+/i,
  ];

  for (const pattern of patterns) {
    const match = fullText.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }

  return 0;
}

// ─── Inferred Skills ────────────────────────────────────────────────────────

/**
 * Extract inferredSkills from project descriptions
 * These are skills found in project context but not in the SKILLS section
 */
function extractInferredSkills(projects, explicitSkills) {
  const explicitSet = new Set(explicitSkills.map(s => s.toLowerCase()));
  const inferred = new Set();

  for (const project of projects) {
    const text = `${project.name || ""} ${project.description || ""} ${(project.technologies || []).join(" ")}`.toLowerCase();
    for (const skill of ALL_SKILLS) {
      if (text.includes(skill.toLowerCase()) && !explicitSet.has(skill.toLowerCase())) {
        inferred.add(skill);
      }
    }
  }

  return [...inferred];
}

// ─── Resume Scoring ─────────────────────────────────────────────────────────

/**
 * Deterministic resume scoring (100 point scale)
 * Skills: 40, Experience: 25, Education: 15, Projects: 10, Certifications: 10
 */
function calculateResumeScore(parsed) {
  let score = 0;

  // Skills: 40 points — scale by count (1 skill = 4pts, max 40)
  const skillCount = (parsed.skills || []).length;
  score += Math.min(40, skillCount * 4);

  // Experience: 25 points — scale by entries and years
  const expEntries = (parsed.experience || []).length;
  const expYears = parsed.experienceYears || 0;
  score += Math.min(25, expEntries * 5 + expYears * 2);

  // Education: 15 points — per entry (max 15)
  const eduEntries = (parsed.education || []).length;
  score += Math.min(15, eduEntries * 8);

  // Projects: 10 points — per project (max 10)
  const projCount = (parsed.projects || []).length;
  score += Math.min(10, projCount * 3);

  // Certifications: 10 points — per cert (max 10)
  const certCount = (parsed.certifications || []).length;
  score += Math.min(10, certCount * 5);

  return Math.min(100, score);
}

// ─── Confidence Scores ──────────────────────────────────────────────────────

/**
 * Generate deterministic per-field confidence scores
 * 95 = exact extraction, 80 = section-based, 60 = inferred, 30 = estimated
 */
function calculateConfidenceScores(parsed, sections) {
  const scores = {};

  // Contact info — exact regex extraction = 95, missing = 0
  scores.name = parsed.name && parsed.name !== "Unknown Candidate" ? 95 : 30;
  scores.email = parsed.email ? 95 : 0;
  scores.phone = parsed.phone ? 95 : 0;
  scores.linkedin = parsed.linkedin ? 95 : 0;
  scores.github = parsed.github ? 95 : 0;
  scores.location = parsed.location ? 80 : 0;

  // Section-based = 80 (found section header), inferred = 60 (content without header)
  scores.skills = (parsed.skills || []).length > 0
    ? (sections.SKILLS ? 80 : 60)
    : 0;

  scores.education = (parsed.education || []).length > 0
    ? (sections.EDUCATION ? 80 : 60)
    : 0;

  scores.experience = (parsed.experience || []).length > 0
    ? (sections.EXPERIENCE ? 80 : 60)
    : 0;

  scores.projects = (parsed.projects || []).length > 0
    ? (sections.PROJECTS ? 80 : 60)
    : 0;

  scores.certifications = (parsed.certifications || []).length > 0
    ? (sections.CERTIFICATIONS ? 80 : 60)
    : 0;

  // Experience years: calculated from dates = 80, from text pattern = 60, estimated = 30
  if (parsed.experienceYears > 0) {
    const hasDateBasedCalc = (parsed.experience || []).some(e => e.startDate && e.endDate);
    scores.experienceYears = hasDateBasedCalc ? 80 : 60;
  } else {
    scores.experienceYears = 0;
  }

  scores.inferredSkills = (parsed.inferredSkills || []).length > 0 ? 60 : 0;

  return scores;
}

// ─── Main Parser ────────────────────────────────────────────────────────────

/**
 * Primary regex-based resume parser
 * Extracts structured candidate information without any external AI model
 *
 * @param {string} resumeText - Raw text extracted from resume file
 * @param {string[]|null} preDetectedSkills - Skills already detected via ALL_SKILLS dictionary (optional)
 * @returns {object} Structured candidate data
 */
export function fallbackParseResume(resumeText, preDetectedSkills = null) {
  console.log("[PARSER] Using primary regex-based resume parser");

  if (!resumeText || resumeText.trim().length === 0) {
    return {
      name: "Unknown Candidate",
      email: null,
      phone: null,
      linkedin: null,
      github: null,
      location: null,
      skills: [],
      inferredSkills: [],
      experienceYears: 0,
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      designation: null,
      currentCompany: null,
      summary: "Empty resume text — no data extracted.",
      resumeScore: 0,
      confidenceScores: {},
    };
  }

  const lines = resumeText.split("\n").map(l => l.trim());

  // 1. Contact extraction
  const email = extractEmail(resumeText);
  const phone = extractPhone(resumeText);
  const name = extractName(resumeText);
  const linkedin = extractLinkedIn(resumeText);
  const github = extractGitHub(resumeText);
  const location = extractLocation(resumeText);

  // 2. Section detection
  const sections = detectSections(lines);

  // 3. Parse each section
  const educationLines = getSectionLines(lines, sections, "EDUCATION");
  const education = parseEducation(educationLines);
  const detectedCollege = detectCollege(resumeText);

  if (detectedCollege) {
    education.forEach(edu => {
      if (
        !edu.college ||
        edu.college.length < 5
      ) {
        edu.college = detectedCollege;
      }
    });
  }

  const experienceLines = getSectionLines(lines, sections, "EXPERIENCE");
  const experience = parseExperience(experienceLines);

  const projectLines = getSectionLines(lines, sections, "PROJECTS");
  const projects = parseProjects(projectLines);

  const certificationLines = getSectionLines(lines, sections, "CERTIFICATIONS");
  const certifications = parseCertifications(certificationLines);

  const skillLines = getSectionLines(lines, sections, "SKILLS");
  const skills = preDetectedSkills && preDetectedSkills.length > 0
    ? preDetectedSkills
    : parseSkills(skillLines, resumeText);

  // 4. Inferred skills from project descriptions
  const inferredSkills = extractInferredSkills(projects, skills);

  // 5. Experience years
  const experienceYears = calculateExperienceYears(experience, resumeText);

  // 6. Derive designation and current company from first experience entry
  const designation = experience.length > 0 ? experience[0].role : null;
  const currentCompany = experience.length > 0 ? experience[0].company : null;

  // 7. Generate summary
  const summary = `Candidate resume parsed via primary parser. ${skills.length} skills detected, ${experience.length} experience entries, ${education.length} education entries, ${projects.length} projects, ${certifications.length} certifications.`;

  // Build result
  const result = {
    name,
    email,
    phone,
    linkedin,
    github,
    location,
    skills,
    inferredSkills,
    experienceYears,
    experience,
    education,
    projects,
    certifications,
    designation,
    currentCompany,
    summary,
    resumeScore: 0,
    confidenceScores: {},
  };

  // 8. Calculate scores
  result.resumeScore = calculateResumeScore(result);
  result.confidenceScores = calculateConfidenceScores(result, sections);

  console.log(
    `[PARSER] Extracted: name="${name}", email="${email}", phone="${phone}", skills=${skills.length}, education=${education.length}, experience=${experience.length}, projects=${projects.length}, certs=${certifications.length}, inferredSkills=${inferredSkills.length}, score=${result.resumeScore}`
  );

  return result;
}

// Export helpers for testing
export {
  extractEmail,
  extractPhone,
  extractName,
  extractLinkedIn,
  extractGitHub,
  extractLocation,
  detectSections,
  parseEducation,
  parseExperience,
  parseProjects,
  parseCertifications,
  parseSkills,
  calculateExperienceYears,
  extractInferredSkills,
  calculateResumeScore,
  calculateConfidenceScores,
  isPlaceholderEmail,
  isPlaceholderPhone,
};

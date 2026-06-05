import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fallbackParseResume,
  extractEmail,
  extractPhone,
  extractName,
  extractLinkedIn,
  extractGitHub,
  extractLocation,
  isPlaceholderEmail,
  isPlaceholderPhone,
  parseEducation,
  parseExperience,
  parseProjects,
  parseCertifications,
  calculateResumeScore,
  calculateConfidenceScores,
  extractInferredSkills,
} from "../resumeFallbackParser.js";

// ─── Test Resume Fixtures ───────────────────────────────────────────────────

const SOFTWARE_ENGINEER_RESUME = `
MICHELLE LOPEZ
Moscow, Idaho
(208) 555-1234
michelle.lopez@gmail.com
linkedin.com/in/michelle-lopez
github.com/michellelopez

SUMMARY
Full-stack software engineer with 5+ years of experience building scalable web applications
using React, Node.js, and cloud technologies.

SKILLS
JavaScript, TypeScript, React, Node.js, Express, MongoDB, PostgreSQL, Docker,
Kubernetes, AWS, Git, CI/CD, GraphQL, REST API, Redis, Python, Agile, Scrum

EXPERIENCE
Senior Software Engineer at TechCorp Inc
Jan 2022 - Present
• Led development of a microservices architecture serving 2M daily active users
• Implemented real-time data pipeline using Kafka and Redis
• Mentored team of 4 junior developers on React best practices

Software Engineer - DataFlow Systems
Jun 2019 - Dec 2021
• Built REST APIs using Node.js and Express handling 10K requests/second
• Designed and maintained PostgreSQL database schemas
• Deployed services to AWS ECS using Docker containers

EDUCATION
B.Tech Computer Science
Indian Institute of Technology (IIT) Delhi
2019
CGPA: 8.7

PROJECTS
E-Commerce Platform
• Full-stack e-commerce solution built with React, Node.js, MongoDB
• Implemented payment gateway integration with Stripe
• Deployed on AWS with Docker and Kubernetes orchestration

Real-Time Chat Application
• WebSocket-based chat app using Socket.io and Express
• React frontend with Redux state management
• Redis-based pub/sub for horizontal scaling

CERTIFICATIONS
AWS Certified Solutions Architect - Amazon
Certified Kubernetes Administrator - CNCF
`;

const DESIGNER_RESUME = `
SARAH CHEN
San Francisco, CA
sarah.chen.design@outlook.com
linkedin.com/in/sarahchenux

SUMMARY
Creative UX/UI Designer with 4 years of experience crafting intuitive digital experiences.
Expert in user research, prototyping, and design systems.

SKILLS
UI Design, UX Design, Figma, Adobe XD, Photoshop, Illustrator, Wireframing,
Prototyping, Design Systems, User Research, A/B Testing, HTML, CSS, SCSS

EXPERIENCE
Senior UX Designer at DesignStudio Co
Mar 2021 - Present
• Redesigned flagship product resulting in 35% increase in user engagement
• Created and maintained company-wide design system with 200+ components
• Conducted user research interviews with 50+ participants quarterly

UX Designer - AppWorks Inc
Aug 2019 - Feb 2021
• Designed mobile app interfaces for iOS and Android platforms
• Built interactive prototypes in Figma for stakeholder presentations
• Implemented A/B testing framework improving conversion rates by 22%

EDUCATION
BSc Interaction Design
California College of the Arts
2019

PROJECTS
Healthcare Dashboard
• Designed data visualization dashboard for patient monitoring
• Used Figma for prototyping and user testing with medical professionals
• Implemented responsive layouts with CSS Grid and Flexbox

Portfolio Website
• Personal portfolio built with HTML, CSS, and JavaScript
• Responsive design with smooth animations and transitions
• Accessibility-compliant with WCAG 2.1 AA standards
`;

const SALES_EXECUTIVE_RESUME = `
JAMES MARTINEZ
Austin, TX
james.martinez@yahoo.com
(512) 867-5309
linkedin.com/in/jamesmartinezsales

SUMMARY
Results-driven Sales Executive with 7+ years of experience in B2B SaaS sales.
Consistently exceeded quota by 120%+ across enterprise and mid-market segments.

SKILLS
Lead Generation, Cold Calling, Prospecting, CRM, Salesforce, Negotiation,
B2B Sales, Account Management, Sales Forecasting, Customer Acquisition,
Inside Sales, Outside Sales, Closing, Strategic Planning, Presentation Skills

EXPERIENCE
Senior Sales Executive at CloudSoft Solutions
Feb 2020 - Present
• Managed $5M annual revenue pipeline across 50+ enterprise accounts
• Exceeded sales quota by 135% in 2023 with $6.75M closed deals
• Developed strategic account plans for Fortune 500 clients

Sales Representative - TechSales Pro
Jul 2017 - Jan 2020
• Generated $2.3M in new business through outbound prospecting
• Built and maintained CRM database of 500+ qualified leads
• Achieved President's Club recognition for top 5% performers

Account Executive - StartupGrowth LLC
Jun 2016 - Jun 2017
• Closed 45 new accounts in first year with average deal size of $25K
• Conducted product demos for C-level executives
• Collaborated with marketing team on lead nurturing campaigns

EDUCATION
MBA Marketing
University of Texas at Austin
2016

BSc Business Administration
Texas A&M University
2014

CERTIFICATIONS
Salesforce Administrator - Salesforce
PMP - Project Management Institute
Certified Scrum Master - Scrum Alliance

PROJECTS
CRM Migration Initiative
• Led migration from legacy CRM to Salesforce for 200-person sales org
• Trained 50+ sales reps on new Salesforce workflows and reporting
• Reduced sales cycle time by 20% through process automation
`;

const HR_RECRUITER_RESUME = `
PRIYA SHARMA
Bangalore, India
priya.sharma.hr@gmail.com
+91 98765 43210
linkedin.com/in/priyasharma-hr

SUMMARY
Experienced HR Recruiter specializing in talent acquisition for technology companies.
3 years experience in full-cycle recruitment with a focus on scaling engineering teams.

SKILLS
Recruitment, Talent Acquisition, Employee Relations, Onboarding, Interviewing,
Performance Management, HRMS, Workforce Planning, Communication, Leadership,
LinkedIn Recruiter, Microsoft Excel, Google Sheets, Jira, Slack

EXPERIENCE
Senior HR Recruiter at TechHire Solutions
Apr 2022 - Present
• Managed full-cycle recruitment for 100+ technical positions annually
• Reduced time-to-hire by 30% through structured interview processes
• Built talent pipeline of 2000+ candidates across engineering roles

HR Recruiter - InnovateTech Pvt Ltd
Jan 2021 - Mar 2022
• Sourced and screened 500+ candidates per quarter using LinkedIn Recruiter
• Conducted behavioral interviews and technical screening coordination
• Organized campus recruitment drives at 10+ engineering colleges

EDUCATION
MBA Human Resource Management
Symbiosis International University
2020
CGPA: 8.2

BCA Computer Applications
Christ University
2018

PROJECTS
Recruitment Analytics Dashboard
• Built Excel-based recruitment analytics tracking hiring metrics
• Automated weekly reporting using Google Sheets and macros
• Reduced manual reporting time by 60%

CERTIFICATIONS
SHRM-CP - SHRM
LinkedIn Recruiter Certification - LinkedIn
`;

// ─── Placeholder Detection Tests ────────────────────────────────────────────

describe("Placeholder Detection", () => {
  it("detects placeholder emails", () => {
    assert.equal(isPlaceholderEmail("email@email.com"), true);
    assert.equal(isPlaceholderEmail("example@example.com"), true);
    assert.equal(isPlaceholderEmail("test@test.com"), true);
    assert.equal(isPlaceholderEmail("yourname@email.com"), true);
    assert.equal(isPlaceholderEmail("michelle.lopez@gmail.com"), false);
    assert.equal(isPlaceholderEmail("sarah.chen.design@outlook.com"), false);
  });

  it("detects placeholder phones", () => {
    assert.equal(isPlaceholderPhone("(541) 754-3010"), true);
    assert.equal(isPlaceholderPhone("1234567890"), true);
    assert.equal(isPlaceholderPhone("0000000000"), true);
    assert.equal(isPlaceholderPhone("9999999999"), true);
    assert.equal(isPlaceholderPhone("(555) 555-5555"), true);
    assert.equal(isPlaceholderPhone("(208) 555-1234"), false);
    assert.equal(isPlaceholderPhone("(512) 867-5309"), false);
  });

  it("returns null email for placeholder in resume", () => {
    const resume = `John Doe\nemail@email.com\n(123) 456-7890\n\nSKILLS\nJavaScript, React`;
    const result = fallbackParseResume(resume);
    assert.equal(result.email, null);
  });

  it("returns null phone for placeholder in resume", () => {
    const resume = `John Doe\njohn@real.com\n(541) 754-3010\n\nSKILLS\nJavaScript, React`;
    const result = fallbackParseResume(resume);
    assert.equal(result.phone, null);
  });
});

// ─── Software Engineer Resume Tests ─────────────────────────────────────────

describe("Software Engineer Resume", () => {
  const result = fallbackParseResume(SOFTWARE_ENGINEER_RESUME);

  it("extracts name (MICHELLE LOPEZ → titlecase)", () => {
    assert.equal(result.name, "Michelle Lopez");
  });

  it("extracts email", () => {
    assert.equal(result.email, "michelle.lopez@gmail.com");
  });

  it("extracts phone", () => {
    assert.ok(result.phone, "phone should not be null");
    assert.match(result.phone, /208/);
  });

  it("extracts LinkedIn", () => {
    assert.ok(result.linkedin, "linkedin should not be null");
    assert.match(result.linkedin, /linkedin\.com\/in\/michelle-lopez/);
  });

  it("extracts GitHub", () => {
    assert.ok(result.github, "github should not be null");
    assert.match(result.github, /github\.com\/michellelopez/);
  });

  it("extracts location", () => {
    assert.ok(result.location, "location should not be null");
    assert.match(result.location, /Moscow/i);
  });

  it("detects skills from ALL_SKILLS dictionary", () => {
    assert.ok(result.skills.length >= 5, `Expected at least 5 skills, got ${result.skills.length}`);
    const skillsLower = result.skills.map(s => s.toLowerCase());
    assert.ok(skillsLower.includes("react"), "Should detect React");
    assert.ok(skillsLower.includes("node.js"), "Should detect Node.js");
    assert.ok(skillsLower.includes("javascript"), "Should detect JavaScript");
    assert.ok(skillsLower.includes("docker"), "Should detect Docker");
  });

  it("parses education into structured objects", () => {
    assert.ok(Array.isArray(result.education), "education should be array");
    assert.ok(result.education.length >= 1, `Expected at least 1 education entry, got ${result.education.length}`);
    const firstEdu = result.education[0];
    assert.ok(firstEdu.degree, "degree should be extracted");
    assert.match(firstEdu.degree, /B\.?Tech/i);
  });

  it("parses experience into structured objects", () => {
    assert.ok(Array.isArray(result.experience), "experience should be array");
    assert.ok(result.experience.length >= 2, `Expected at least 2 experience entries, got ${result.experience.length}`);
  });

  it("parses projects with technologies", () => {
    assert.ok(Array.isArray(result.projects), "projects should be array");
    assert.ok(result.projects.length >= 1, `Expected at least 1 project, got ${result.projects.length}`);
    // At least one project should have technologies
    const hastech = result.projects.some(p => p.technologies && p.technologies.length > 0);
    assert.ok(hastech, "At least one project should have detected technologies");
  });

  it("parses certifications", () => {
    assert.ok(Array.isArray(result.certifications), "certifications should be array");
    assert.ok(result.certifications.length >= 1, `Expected at least 1 certification, got ${result.certifications.length}`);
  });

  it("calculates experience years", () => {
    assert.ok(result.experienceYears >= 2, `Expected at least 2 years experience, got ${result.experienceYears}`);
  });

  it("generates inferredSkills from project descriptions", () => {
    assert.ok(Array.isArray(result.inferredSkills), "inferredSkills should be array");
    // E-Commerce project mentions MongoDB, Kubernetes etc.
  });

  it("generates resume score > 0", () => {
    assert.ok(result.resumeScore > 0, `Expected score > 0, got ${result.resumeScore}`);
    assert.ok(result.resumeScore <= 100, `Score should be <= 100, got ${result.resumeScore}`);
  });

  it("generates confidence scores per field", () => {
    assert.ok(result.confidenceScores, "confidenceScores should exist");
    assert.ok(typeof result.confidenceScores.name === "number", "name confidence should be number");
    assert.ok(typeof result.confidenceScores.email === "number", "email confidence should be number");
    assert.ok(typeof result.confidenceScores.skills === "number", "skills confidence should be number");
  });
});

// ─── UX Designer Resume Tests ───────────────────────────────────────────────

describe("UX Designer Resume", () => {
  const result = fallbackParseResume(DESIGNER_RESUME);

  it("extracts name", () => {
    assert.equal(result.name, "Sarah Chen");
  });

  it("extracts email", () => {
    assert.equal(result.email, "sarah.chen.design@outlook.com");
  });

  it("extracts location", () => {
    assert.ok(result.location, "location should not be null");
    assert.match(result.location, /San Francisco/i);
  });

  it("detects design-related skills", () => {
    assert.ok(result.skills.length >= 3, `Expected at least 3 skills, got ${result.skills.length}`);
    const skillsLower = result.skills.map(s => s.toLowerCase());
    assert.ok(skillsLower.includes("figma"), "Should detect Figma");
    assert.ok(skillsLower.includes("ui design"), "Should detect UI Design");
  });

  it("parses education", () => {
    assert.ok(Array.isArray(result.education), "education should be array");
    assert.ok(result.education.length >= 1, `Expected at least 1 education entry, got ${result.education.length}`);
  });

  it("parses experience", () => {
    assert.ok(Array.isArray(result.experience), "experience should be array");
    assert.ok(result.experience.length >= 2, `Expected at least 2 experience entries, got ${result.experience.length}`);
  });

  it("parses projects", () => {
    assert.ok(Array.isArray(result.projects), "projects should be array");
    assert.ok(result.projects.length >= 1, `Expected at least 1 project, got ${result.projects.length}`);
  });

  it("phone is null (no phone listed)", () => {
    // Designer resume has no phone number
    assert.equal(result.phone, null);
  });

  it("generates resume score > 0", () => {
    assert.ok(result.resumeScore > 0, `Expected score > 0, got ${result.resumeScore}`);
  });
});

// ─── Sales Executive Resume Tests ───────────────────────────────────────────

describe("Sales Executive Resume", () => {
  const result = fallbackParseResume(SALES_EXECUTIVE_RESUME);

  it("extracts name", () => {
    assert.equal(result.name, "James Martinez");
  });

  it("extracts email", () => {
    assert.equal(result.email, "james.martinez@yahoo.com");
  });

  it("extracts phone", () => {
    assert.ok(result.phone, "phone should not be null");
    assert.match(result.phone, /512/);
  });

  it("extracts LinkedIn", () => {
    assert.ok(result.linkedin, "linkedin should not be null");
    assert.match(result.linkedin, /linkedin\.com\/in\/jamesmartinezsales/);
  });

  it("detects sales-related skills", () => {
    assert.ok(result.skills.length >= 3, `Expected at least 3 skills, got ${result.skills.length}`);
    const skillsLower = result.skills.map(s => s.toLowerCase());
    assert.ok(skillsLower.includes("crm"), "Should detect CRM");
    assert.ok(skillsLower.includes("lead generation"), "Should detect Lead Generation");
    assert.ok(skillsLower.includes("b2b sales"), "Should detect B2B Sales");
  });

  it("parses education (multiple entries)", () => {
    assert.ok(Array.isArray(result.education), "education should be array");
    assert.ok(result.education.length >= 2, `Expected at least 2 education entries, got ${result.education.length}`);
  });

  it("parses experience (3 entries)", () => {
    assert.ok(Array.isArray(result.experience), "experience should be array");
    assert.ok(result.experience.length >= 3, `Expected at least 3 experience entries, got ${result.experience.length}`);
  });

  it("parses certifications (3 entries)", () => {
    assert.ok(Array.isArray(result.certifications), "certifications should be array");
    assert.ok(result.certifications.length >= 3, `Expected at least 3 certifications, got ${result.certifications.length}`);
  });

  it("calculates experience years from dates", () => {
    assert.ok(result.experienceYears >= 3, `Expected at least 3 years, got ${result.experienceYears}`);
  });

  it("generates resume score > 30", () => {
    assert.ok(result.resumeScore > 30, `Expected score > 30 for rich resume, got ${result.resumeScore}`);
  });
});

// ─── HR Recruiter Resume Tests ──────────────────────────────────────────────

describe("HR Recruiter Resume", () => {
  const result = fallbackParseResume(HR_RECRUITER_RESUME);

  it("extracts name", () => {
    assert.equal(result.name, "Priya Sharma");
  });

  it("extracts email", () => {
    assert.equal(result.email, "priya.sharma.hr@gmail.com");
  });

  it("extracts phone", () => {
    assert.ok(result.phone, "phone should not be null");
  });

  it("extracts LinkedIn", () => {
    assert.ok(result.linkedin, "linkedin should not be null");
    assert.match(result.linkedin, /linkedin\.com\/in\/priyasharma-hr/);
  });

  it("detects HR-related skills", () => {
    assert.ok(result.skills.length >= 3, `Expected at least 3 skills, got ${result.skills.length}`);
    const skillsLower = result.skills.map(s => s.toLowerCase());
    assert.ok(skillsLower.includes("recruitment"), "Should detect Recruitment");
    assert.ok(skillsLower.includes("talent acquisition"), "Should detect Talent Acquisition");
  });

  it("parses education (2 entries)", () => {
    assert.ok(Array.isArray(result.education), "education should be array");
    assert.ok(result.education.length >= 2, `Expected at least 2 education entries, got ${result.education.length}`);
  });

  it("parses experience", () => {
    assert.ok(Array.isArray(result.experience), "experience should be array");
    assert.ok(result.experience.length >= 2, `Expected at least 2 experience entries, got ${result.experience.length}`);
  });

  it("parses projects", () => {
    assert.ok(Array.isArray(result.projects), "projects should be array");
    assert.ok(result.projects.length >= 1, `Expected at least 1 project, got ${result.projects.length}`);
  });

  it("generates resume score > 0", () => {
    assert.ok(result.resumeScore > 0, `Expected score > 0, got ${result.resumeScore}`);
  });

  it("generates confidence scores", () => {
    assert.ok(result.confidenceScores, "confidenceScores should exist");
    assert.ok(result.confidenceScores.name === 95, "name should have 95 confidence for exact extraction");
  });
});

// ─── Edge Case Tests ────────────────────────────────────────────────────────

describe("Edge Cases", () => {
  it("handles empty resume text", () => {
    const result = fallbackParseResume("");
    assert.equal(result.name, "Unknown Candidate");
    assert.equal(result.email, null);
    assert.equal(result.phone, null);
    assert.equal(result.resumeScore, 0);
  });

  it("handles single-line education to avoid duplication", () => {
    const resume = `John Doe\n\nEDUCATION\nB.Tech, Computer Engineering — Bharati Vidyapeeth College of Engineering, Pune Expected 2027`;
    const result = fallbackParseResume(resume);
    assert.ok(result.education.length > 0);
    const edu = result.education[0];
    assert.equal(edu.degree, "B.Tech");
    assert.equal(edu.specialization, "Computer Engineering");
    assert.equal(edu.college, "Bharati Vidyapeeth College of Engineering, Pune");
    assert.equal(edu.year, "2027");
  });

  it("handles resume with only placeholder data", () => {
    const resume = `John Doe\nemail@email.com\n(541) 754-3010\nSome content here`;
    const result = fallbackParseResume(resume);
    assert.equal(result.email, null, "placeholder email should be null");
    assert.equal(result.phone, null, "placeholder phone should be null");
  });

  it("upload never fails — null email and phone are valid", () => {
    const resume = `Test Resume\nNo contact info here\n\nSKILLS\nJavaScript, Python`;
    const result = fallbackParseResume(resume);
    // These should be null, not throw
    assert.equal(result.email, null);
    assert.equal(result.phone, null);
    // But the result itself should still be valid
    assert.ok(result.name, "name should still be extracted");
    assert.ok(Array.isArray(result.skills), "skills should be an array");
  });

  it("preserves ALL_SKILLS dictionary detection when preDetectedSkills provided", () => {
    const resume = `John Doe\njohn@test123.com\n\nSKILLS\nSome skills here`;
    const preDetected = ["React", "Node.js", "Docker"];
    const result = fallbackParseResume(resume, preDetected);
    assert.deepEqual(result.skills, preDetected, "Should use preDetectedSkills");
  });

  it("resume score components sum to max 100", () => {
    const result = fallbackParseResume(SOFTWARE_ENGINEER_RESUME);
    assert.ok(result.resumeScore <= 100, `Score should be <= 100, got ${result.resumeScore}`);
  });
});

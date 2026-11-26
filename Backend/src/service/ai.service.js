const { GoogleGenAI } = require("@google/genai");
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

// Model names can be changed from .env without touching code
// (preview / free-tier models get renamed or retired often).
const REPORT_MODEL = process.env.GEMINI_REPORT_MODEL || "gemini-3.5-flash-lite";
// gemini-3-flash-preview has no free-tier quota left (429), so the resume uses the same working model.
const RESUME_MODEL = process.env.GEMINI_RESUME_MODEL || REPORT_MODEL;



const responseSchema = {
  type: "object",
  properties: {
    matchScore: { type: "number" },
    technicalQuestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          intention: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "intention", "answer"],
      },
    },
    behavioralQuestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          intention: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "intention", "answer"],
      },
    },
    skillGaps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skill: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["skill", "severity"],
      },
    },
    preparationPlan: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "number" },
          focus: { type: "string" },
          tasks: { type: "array", items: { type: "string" } },
        },
        required: ["day", "focus", "tasks"],
      },
      minItems: 7,
    },
    title: { type: "string" },
  },
  required: [
    "matchScore",
    "technicalQuestions",
    "behavioralQuestions",
    "skillGaps",
    "preparationPlan",
    "title",
  ],
};


async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `
You are an expert technical recruiter and interviewer.

Your task is to analyze the candidate profile against the job description and generate a structured interview report.

// Return ONLY valid JSON matching this exact schema:
// {
//   "matchScore": number,
//   "technicalQuestions": [
//     {
//       "question": string,
//       "intention": string,
//       "answer": string
//     }
//   ],
//   "behavioralQuestions": [
//     {
//       "question": string,
//       "intention": string,
//       "answer": string
//     }
//   ],
//   "skillGaps": [
//     {
//       "skill": string,
//       "severity": "low" | "medium" | "high"
//     }
//   ],
//   "preparationPlan": [
//     {
//       "day": number,
//       "focus": string,
//       "tasks": [string]
//     }
//   ],
//   "title": string
// }

// Important rules:
// 1. Return only JSON. No markdown, no explanation, no extra fields, no wrapper object.
// 2. Do not include keys like "message", "data", "resume", "candidate_information", "selfDescription", or any other extra field.
// 3. The response must follow the schema exactly.
// 4. Evaluate the candidate based only on the provided resume, self description, and job description.
// 5. "matchScore" must be a number between 0 and 100.
// 6. "title" should be the job title.
// 7. For technicalQuestions and behavioralQuestions, create realistic interview questions, each with its intention and a good answer strategy.
// 8. For skillGaps, identify real gaps between candidate profile and job requirements.
// 9. For preparationPlan, create an actionable day-wise plan with realistic tasks.
// 10. The preparationPlan must contain at least 7 distinct days. Prefer 7 to 10 days unless the job description clearly requires more.
// 11. Ensure valid JSON syntax with double quotes around keys and string values.

Candidate Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}
`;


  const response = await ai.models.generateContent({
    model: REPORT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      // responseSchema: zodToJsonSchema(interviewReportSchema),
      responseSchema,
    },
  });

  const interviewReport = JSON.parse(response.text);

  return interviewReport;
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    try {
        const page = await browser.newPage();
        // Block outside requests (fonts/images in AI HTML) so a slow network can't hang the PDF.
        await page.setRequestInterception(true)
        page.on("request", (request) => {
            const url = request.url()
            if (url.startsWith("data:") || url === "about:blank") request.continue()
            else request.abort()
        })
        await page.setContent(htmlContent, { waitUntil: "load", timeout: 30000 })

        const pdfBuffer = await page.pdf({
            format: "A4", margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            }
        })

        return Buffer.from(pdfBuffer)
    } finally {
        await browser.close()
    }
}

const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")

function createFallbackResumeHtml({ resume, selfDescription, jobDescription }) {
    const lines = String(resume || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    const sectionNames = new Set([
        "CAREER OBJECTIVE", "SUMMARY", "PROFESSIONAL SUMMARY", "EDUCATION",
        "TECHNICAL SKILLS", "SKILLS", "PROJECTS", "EXPERIENCE",
        "INTERNSHIP / TRAINING", "INTERNSHIPS", "CERTIFICATIONS & HIGHLIGHTS",
        "CERTIFICATIONS", "ACHIEVEMENTS", "LANGUAGES"
    ])
    const sections = []
    let currentSection = { title: "PROFESSIONAL SUMMARY", lines: [] }
    for (const line of lines) {
        const normalizedLine = line.toUpperCase().replace(/\s+/g, " ")
        if (sectionNames.has(normalizedLine)) {
            if (currentSection.lines.length) sections.push(currentSection)
            currentSection = { title: normalizedLine, lines: [] }
        } else {
            currentSection.lines.push(line)
        }
    }
    if (currentSection.lines.length) sections.push(currentSection)

    const [name = "Professional Resume", ...headerLines] = lines
    const title = headerLines.find((line) => !line.includes("@") && !line.includes("•") && !line.includes("|")) || "Full Stack Web Developer"
    const contact = headerLines.filter((line) => line !== title && !sectionNames.has(line.toUpperCase())).join(" • ")
    const renderSection = ({ title: sectionTitle, lines: sectionLines }) => {
        const body = sectionLines.map((line) => {
            const isBullet = /^[•*-]\s*/.test(line)
            const cleanLine = line.replace(/^[•*-]\s*/, "")
            return isBullet
                ? `<li>${escapeHtml(cleanLine)}</li>`
                : `<p>${escapeHtml(cleanLine)}</p>`
        }).join("")
        return `<section><h2>${escapeHtml(sectionTitle)}</h2><div class="section-content">${body}</div></section>`
    }

    return `
        <html>
            <head>
                <style>
                    @page { size: A4; margin: 15mm 16mm; }
                    body { font-family: Arial, Helvetica, sans-serif; color: #202b33; font-size: 9.5pt; line-height: 1.35; }
                    header { text-align: center; border-bottom: 2px solid #226b62; padding-bottom: 9px; }
                    h1 { margin: 0; color: #173e43; font-size: 23pt; letter-spacing: .3px; }
                    .title { margin: 3px 0 7px; color: #226b62; font-size: 11pt; font-weight: 700; }
                    .contact { margin: 0; color: #4f5d63; font-size: 8.5pt; }
                    section { margin-top: 13px; page-break-inside: avoid; }
                    h2 { margin: 0 0 5px; padding-bottom: 3px; border-bottom: 1px solid #b9d5ce; color: #226b62; font-size: 10.5pt; letter-spacing: .7px; }
                    .section-content p { margin: 3px 0; }
                    ul { margin: 3px 0 4px; padding-left: 17px; }
                    li { margin: 2px 0; }
                </style>
            </head>
            <body>
                <header>
                    <h1>${escapeHtml(name)}</h1>
                    <p class="title">${escapeHtml(title)}</p>
                    <p class="contact">${escapeHtml(contact)}</p>
                </header>
                ${selfDescription ? `<section><h2>PROFESSIONAL SUMMARY</h2><div class="section-content"><p>${escapeHtml(selfDescription)}</p></div></section>` : ""}
                ${sections.filter((section) => section.title !== "PROFESSIONAL SUMMARY").map(renderSection).join("")}
            </body>
        </html>
    `
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    // NOTE: zod-to-json-schema v3 does not support zod v4 and returned an EMPTY schema
    // (no "html" field), which broke this Gemini call. A plain schema is used instead.
    const resumePdfSchema = {
        type: "object",
        properties: {
            html: {
                type: "string",
                description: "The HTML content of the resume which can be converted to PDF using puppeteer",
            },
        },
        required: ["html"],
    }

    const prompt = `Generate a professional, ATS-friendly resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        The response should be a JSON object with a single field "html" containing a complete HTML document that can be converted to PDF using Puppeteer.
                        Match this exact professional format: a centered header with the candidate's name, target title, and contact details; then compact one-column sections in this order where applicable: CAREER OBJECTIVE or PROFESSIONAL SUMMARY, EDUCATION, TECHNICAL SKILLS, PROJECTS, EXPERIENCE or INTERNSHIP / TRAINING, CERTIFICATIONS & HIGHLIGHTS, ACHIEVEMENTS, and LANGUAGES.
                        Use uppercase teal section headings with thin divider lines, concise bullet points, readable Arial/Helvetica typography, compact spacing, and an A4-friendly 1-2 page layout. Do not use tables, columns, icons, photos, or decorative graphics.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    let html
    try {
        const response = await ai.models.generateContent({
            model: RESUME_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: resumePdfSchema,
            }
        })

        html = JSON.parse(response.text)?.html
        if (typeof html !== "string" || !html.trim()) {
            throw new Error("AI response did not contain resume HTML")
        }
    } catch (error) {
        // Any AI failure (quota 429, retired model 404, overload 503, bad JSON) falls back
        // to the locally formatted resume so the PDF download still works.
        console.warn("Resume PDF AI formatting failed; using local PDF fallback:", error?.status ?? "", error?.message)
        html = createFallbackResumeHtml({ resume, selfDescription, jobDescription })
    }

    return generatePdfFromHtml(html)

}

module.exports = { generateInterviewReport , generateResumePdf  };

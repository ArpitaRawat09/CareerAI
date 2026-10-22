const pdfParse = require("pdf-parse")
const puppeteer = require("puppeteer")
const { generateInterviewReport } = require("../service/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")



/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    if (!req.file) {
        return res.status(400).json({ message: "Resume PDF is required." })
    }

    try {
        const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
        const { selfDescription, jobDescription } = req.body

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeContent.text,
            selfDescription,
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeContent.text,
            selfDescription,
            jobDescription,
            ...interViewReportByAi
        })

        return res.status(201).json({
            message: "Interview report generated successfully.",
            data: interviewReport,
            interviewReport
        })
    } catch (error) {
        console.error("Interview report generation failed:", error)
        return res.status(500).json({
            message: "Unable to generate the interview report. Please try again."
        })
    }

}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        data: interviewReport,
        interviewReport
    })
}


/**
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        data: interviewReports,
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findOne({
        _id: interviewReportId,
        user: req.user.id
    })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const browser = await puppeteer.launch({ headless: true })
    try {
        const page = await browser.newPage()
        const skillGaps = (interviewReport.skillGaps || [])
            .map((gap) => `<li>${escapeHtml(gap.skill)} (${escapeHtml(gap.severity)})</li>`)
            .join("")
        const preparationPlan = (interviewReport.preparationPlan || [])
            .map((day) => `<li><strong>Day ${day.day}: ${escapeHtml(day.focus)}</strong><ul>${(day.tasks || [])
                .map((task) => `<li>${escapeHtml(task)}</li>`)
                .join("")}</ul></li>`)
            .join("")

        await page.setContent(`
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; color: #172b3a; padding: 32px; }
                        h1 { color: #126b67; } h2 { margin-top: 28px; }
                        li { margin: 8px 0; line-height: 1.4; }
                    </style>
                </head>
                <body>
                    <h1>${escapeHtml(interviewReport.title || "Interview preparation plan")}</h1>
                    <p>Match score: ${interviewReport.matchScore ?? "N/A"} / 100</p>
                    <h2>Skills to strengthen</h2>
                    <ul>${skillGaps || "<li>No major skill gaps identified.</li>"}</ul>
                    <h2>Preparation plan</h2>
                    <ol>${preparationPlan || "<li>No preparation plan available.</li>"}</ol>
                </body>
            </html>
        `)
        const pdfBuffer = await page.pdf({ format: "A4", printBackground: true })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=interview-preparation-${interviewReportId}.pdf`
        })
        return res.send(pdfBuffer)
    } finally {
        await browser.close()
    }
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }
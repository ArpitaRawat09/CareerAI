const pdfParse = require("pdf-parse")
const mongoose = require("mongoose")
const { generateInterviewReport , generateResumePdf } = require("../service/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

/**
 * Turns common Gemini API failures into a message the user can act on.
 */
function getAiErrorMessage(error) {
    const status = error?.status ?? error?.error?.code
    if (status === 429) return "AI quota exhausted (Gemini free tier limit). Please wait a minute or use another API key."
    if (status === 401 || status === 403 || String(error?.message).includes("API_KEY_INVALID")) return "Gemini API key is invalid or not allowed. Check GOOGLE_GENAI_API_KEY in backend .env."
    if (status === 404) return "Configured Gemini model was not found. Set GEMINI_REPORT_MODEL in backend .env to an available model."
    if (status === 503) return "Gemini is overloaded right now. Please try again in a moment."
    return null
}



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
        console.error("Interview report generation failed:", error?.status ?? "", error?.message)
        return res.status(500).json({
            message: getAiErrorMessage(error) || "Unable to generate the interview report. Please try again."
        })
    }

}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    if (!mongoose.isValidObjectId(interviewId)) {
        return res.status(404).json({ message: "Interview report not found." })
    }

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

    if (!mongoose.isValidObjectId(interviewReportId)) {
        return res.status(404).json({ message: "Interview report not found." })
    }

    try {
        // Only the owner of the report may download its resume PDF.
        const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        return res.send(pdfBuffer)
    } catch (error) {
        console.error("Resume PDF generation failed:", error)
        return res.status(500).json({ message: "Unable to generate the resume PDF. Please try again." })
    }
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }
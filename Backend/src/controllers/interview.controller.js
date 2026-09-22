const pdfParse = require("pdf-parse");
const path = require("path");
const { pathToFileURL } = require("url");
const { generateInterviewReport } = require("../service/ai.service.js");
const interviewReportModel = require("../models/interviewReport.model");

const standardFontDataUrl = pathToFileURL(
  path.join(path.dirname(require.resolve("pdfjs-dist")), "../standard_fonts/"),
).href;

async function generateInterviewReportController(req, res) {
  const parser = new pdfParse.PDFParse({
    data: Uint8Array.from(req.file.buffer),
    standardFontDataUrl,
  });
  const resumeContent = await parser.getText();
  await parser.destroy();

  const { selfDescription, jobDescription } = req.body;

  const interReportByAi = await generateInterviewReport({
    resume: resumeContent.text,
    selfDescription,
    jobDescription,
  });

  const interviewReport = await interviewReportModel.create({
    user: req.user.id,
    resume: resumeContent.text,
    selfDescription,
    jobDescription,
    ...interReportByAi,
  });


  res.status(201).json({
    message: "Interview report generated successfully",
    data: interviewReport,
  });
}

module.exports = {
  generateInterviewReportController,
};

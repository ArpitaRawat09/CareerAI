const pdfParse = require("pdf-parse");
const path = require("path");
const { pathToFileURL } = require("url");
const { generateInterviewReport } = require("../service/ai.service.js");

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

  const interviewReport = {
    user: req.user._id,
    resume: resumeContent.text,
    selfDescription,
    jobDescription,
    ...interReportByAi,
  };
  res.status(201).json({
    message: "Interview report generated successfully",
    data: interviewReport,
  });
}

module.exports = {
  generateInterviewReportController,
};

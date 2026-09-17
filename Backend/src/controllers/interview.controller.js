const pdfParse = require("pdf-parse");
const generateInterviewReport = require("../service/ai.service.js");

async function generateInterviewReportController(req, res) {
  const resumeContent = await new pdfParse.PDFParse(
    Uint8Array.from(req.file.buffer),
  ).getText();
  const { selfDescrption, jobDescription } = req.body;

  const interReportByAi = await generateInterviewReport({
    resume: resumeContent,
    selfDescrption,
    jobDescription,
  });

  const interviewReport = {
    user: req.user._id,
    resume: resumeContent,
    selfDescrption,
    jobDescription,
    ...interReportByAi,
  };
  res.status(201).json(interviewReport);
}

module.exports = {
  generateInterviewReportController,
};

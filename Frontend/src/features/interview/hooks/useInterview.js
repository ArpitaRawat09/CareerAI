import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../service/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, error, setError, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        try {
            setError("")
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            const generatedReport = response.data || response.interviewReport
            setReport(generatedReport)
            return generatedReport
        } catch (error) {
            setError(error.response?.data?.message || "We could not generate your report. Please try again.")
        } finally {
            setLoading(false)
        }
        return null
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        try {
            setError("")
            const response = await getInterviewReportById(interviewId)
            const loadedReport = response.data || response.interviewReport
            setReport(loadedReport)
            return loadedReport
        } catch (error) {
            setError(error.response?.data?.message || "We could not load this report.")
        } finally {
            setLoading(false)
        }
        return null
    }

    const getReports = async () => {
        setLoading(true)
        try {
            setError("")
            const response = await getAllInterviewReports()
            const loadedReports = response.data || response.interviewReports || []
            setReports(loadedReports)
            return loadedReports
        } catch (error) {
            setError(error.response?.data?.message || "We could not load your interview reports.")
        } finally {
            setLoading(false)
        }
        return []
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        try {
            const response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
        }
        catch (error) {
            setError(error.response?.data?.message || "We could not download the preparation PDF.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId ])

    return { loading, error, report, reports, generateReport, getReportById, getReports, getResumePdf }

}